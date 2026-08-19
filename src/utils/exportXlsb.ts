import * as XLSX from 'xlsx-js-style';
import { COD_ORDEM_MAP, getCodOrdemNumeric } from './codOrdem';

interface ExportParams {
  codSubprograma: string;
  nomeSubprograma: string;
  evaluationType: string;
  activeScenario: string;
  dataEntrega: string;
  prazoContratual: string | number;
  prazoComFator?: string | number;
  prazoContratualOriginal?: string | number;
  prazoComFatorOriginal?: string | number;
  prazoContratualEditado?: string | number;
  prazoComFatorEditado?: string | number;
  constaCaedAplicacao: boolean;
  possuiEscrita: boolean;
  possuiMaterialImpresso?: boolean;
  possuiConsorcio?: boolean;
  possuiBraile?: boolean;
  possuiAdLibras?: boolean;
  b21ManualInicio?: string;
  b23ManualInicio: string;
  b23ManualFim: string;
  b26ManualInicio: string;
  b26ManualFim?: string;
  b5ManualInicio: string;
  desativadosOpcionais: Record<string, boolean>;
  calculosGrafica: any;
  calculosCaed: any;
  datasExtras: any[];
  datasManuaisPrincipal?: Record<string, string>;
  datasManuaisExtras?: Record<string, { inicio?: string, fim?: string }>;
  modoEdicaoPrincipal?: boolean;
  modoEdicaoExtras?: boolean;
  ocultarCalculosPrincipal?: boolean;
  ocultarCalculosExtras?: boolean;
  observacoes?: string;
}

function extractFormattingFromHtml(raw: string) {
  if (!raw) return { text: '', color: '333333', bold: false, italic: false, underline: false };

  let text = raw;
  if (/<[a-z][\s\S]*>/i.test(raw)) {
    text = raw
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<[^>]+>/g, '');
  }

  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

  return { text, color: '333333', bold: false, italic: false, underline: false };
}

export function exportToXlsb({
  codSubprograma,
  nomeSubprograma,
  evaluationType,
  activeScenario,
  dataEntrega,
  prazoContratual,
  prazoComFator,
  prazoContratualOriginal,
  prazoComFatorOriginal,
  prazoContratualEditado,
  prazoComFatorEditado,
  constaCaedAplicacao,
  possuiEscrita,
  possuiMaterialImpresso = true,
  possuiConsorcio = false,
  possuiBraile = false,
  possuiAdLibras = false,
  b21ManualInicio = '',
  b23ManualInicio,
  b23ManualFim,
  b26ManualInicio,
  b26ManualFim = '',
  b5ManualInicio,
  desativadosOpcionais,
  calculosGrafica,
  calculosCaed,
  datasExtras,
  datasManuaisPrincipal = {},
  datasManuaisExtras = {},
  modoEdicaoPrincipal = false,
  modoEdicaoExtras = false,
  ocultarCalculosPrincipal = false,
  ocultarCalculosExtras = false,
  observacoes = ''
}: ExportParams) {
  
  // Local date formatting function
  const formatDate = (dataStr: string) => {
    if (!dataStr || dataStr === "-" || dataStr === "1889-01-01" || dataStr === "01/01/1889" || dataStr.startsWith("1889") || dataStr.startsWith("1900") || dataStr === "1900-01-01") {
      return "-";
    }
    const partes = dataStr.split('-');
    if (partes.length !== 3) return dataStr;
    const d = partes[2].padStart(2, '0');
    const m = partes[1].padStart(2, '0');
    const y = partes[0];
    return `${d}/${m}/${y}`;
  };

  const wb = XLSX.utils.book_new();

  // Style helper to apply borders, backgrounds, fonts, uppercase headings, and hide gridlines
  const applyStylesToSheet = (ws: any, options: {
    headerBg?: string; // Hex color without #
    headerRowIndex?: number; // 0-based index of header row
    sectionTitles?: string[]; // Row texts in Column A to style as section titles
    colWidths?: number[]; // Width of columns
  }) => {
    // Hide gridlines (both standard and sheet views)
    ws['!views'] = [{ showGridLines: false }];
    ws['!showGridLines'] = false;

    const ref = ws['!ref'] || "A1:A1";
    const range = XLSX.utils.decode_range(ref);

    // Dotted gray border (Cor Cinza, Traçado Pontilhado)
    const dottedBorder = {
      top: { style: 'dotted', color: { rgb: 'C9CACC' } },
      bottom: { style: 'dotted', color: { rgb: 'C9CACC' } },
      left: { style: 'dotted', color: { rgb: 'C9CACC' } },
      right: { style: 'dotted', color: { rgb: 'C9CACC' } }
    };

    // Helper to identify section headers in Column A
    const isSectionTitle = (val: any) => {
      if (typeof val !== 'string') return false;
      const clean = val.trim().toUpperCase();
      return options.sectionTitles?.some(title => {
        const cleanTitle = title.trim().toUpperCase();
        return clean.startsWith(cleanTitle) || clean === cleanTitle;
      });
    };

    // Check row-by-row if Column A is a section title to apply to the whole row
    const rowIsSectionTitle: Record<number, boolean> = {};
    for (let r = range.s.r; r <= range.e.r; r++) {
      const cellRefColA = XLSX.utils.encode_cell({ r, c: 0 });
      const valColA = ws[cellRefColA]?.v;
      if (isSectionTitle(valColA)) {
        rowIsSectionTitle[r] = true;
      }
    }

    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        let cell = ws[cellRef];

        // Ensure cell exists so we can apply border & formatting
        if (!cell) {
          cell = { t: 's', v: '' };
          ws[cellRef] = cell;
        }

        if (!cell.s) {
          cell.s = {};
        }

        // Apply global dotted border
        cell.s.border = { ...dottedBorder };
        // Default clean font
        cell.s.font = { name: "Arial", sz: 10, color: { rgb: "333333" } };
        // Default left alignment for text, right for dates/numbers
        cell.s.alignment = {
          vertical: "center",
          horizontal: (c === 0 && r > 2) ? "center" : "left"
        };

        // If it's the main header of the tab (Row 0)
        if (r === 0 && c === 0) {
          cell.s.font = { bold: true, name: "Arial", sz: 12, color: { rgb: "000000" } };
          if (typeof cell.v === 'string') {
            cell.v = cell.v.toUpperCase();
          }
          cell.s.fill = { fgColor: { rgb: "FFF200" } }; // CAEd yellow accents
          continue;
        }

        // If it's a section title row (Aba 1)
        if (rowIsSectionTitle[r]) {
          cell.s.font = { bold: true, name: "Arial", sz: 10, color: { rgb: "000000" } };
          cell.s.fill = { fgColor: { rgb: "F2F2F2" } }; // BRANCO, PLANO DE FUNDO 1, MAIS ESCURO 5%
          if (typeof cell.v === 'string') {
            cell.v = cell.v.toUpperCase();
          }
          continue;
        }

        // If it is the main tabular header row (e.g. Row 2 in Abas 2, 3, 4)
        if (options.headerRowIndex !== undefined && r === options.headerRowIndex) {
          cell.s.font = { bold: true, name: "Arial", sz: 10, color: { rgb: "000000" } };
          cell.s.alignment = { vertical: "center", horizontal: "left" };
          if (options.headerBg) {
            cell.s.fill = { fgColor: { rgb: options.headerBg } };
          }
          // Enforce bold & uppercase for header texts
          if (typeof cell.v === 'string') {
            cell.v = cell.v.toUpperCase();
          }
        }
      }
    }

    // Set column widths
    if (options.colWidths) {
      ws['!cols'] = options.colWidths.map(w => ({ wch: w }));
    }
  };

  // --- SHEET 1: PARÂMETROS E FLUXO PRINCIPAL ---
  const displayPrazoOriginal = (prazoContratualOriginal !== undefined && prazoContratualOriginal !== '') 
    ? prazoContratualOriginal 
    : prazoContratual;

  const displayFatorOriginal = (prazoComFatorOriginal !== undefined && prazoComFatorOriginal !== '') 
    ? prazoComFatorOriginal 
    : (prazoComFator || (prazoContratual ? Math.ceil(Number(prazoContratual) * 1.25) : ''));

  const displayPrazoEditado = (prazoContratualEditado !== undefined && prazoContratualEditado !== '') 
    ? `${prazoContratualEditado} dias` 
    : "-";

  const displayFatorEditado = (prazoComFatorEditado !== undefined && prazoComFatorEditado !== '') 
    ? `${prazoComFatorEditado} dias` 
    : "-";

  const hasFatorEditado = prazoComFatorEditado !== undefined && prazoComFatorEditado !== '' && displayFatorEditado !== "-";

  const sidebarData: any[] = [
    ["PARÂMETROS E CONFIGURAÇÕES DO CRONOGRAMA", ""],
    ["", ""],
    ["1. CONFIGURAÇÕES GERAIS", ""],
    ["Código do Subprograma", codSubprograma],
    ["Nome do Subprograma", nomeSubprograma || ""],
    ["Tipo de Avaliação do Subprograma", evaluationType === "somativa" ? "Somativa" : "Formativa"],
    ["Geração de dados variáveis", activeScenario === "caed" ? "CAEd gera DVs" : "Gráfica gera DVs"],
    ["", ""],
    ["PARÂMETROS INICIAIS", ""],
    ["Entrega nos Polos", formatDate(dataEntrega)],
    ["Prazo Gráfico (Dias)", displayPrazoOriginal ? `${displayPrazoOriginal} dias` : "-"],
    ["Prazo Protocolos (Fator 1.25)", displayFatorOriginal ? `${displayFatorOriginal} dias` : "-"]
  ];

  if (hasFatorEditado) {
    sidebarData.push(["Prazo Protocolos (Fator 1.25) - Editado", displayFatorEditado]);
  }

  sidebarData.push(
    ["", ""],
    ["3. CRITÉRIOS DE HABILITAÇÃO", ""],
    ["CAEd Aplicação (EP05) (Ativa B5 e B9)", constaCaedAplicacao ? "Habilitado" : "Desabilitado"],
    ["Escrita IRC (Ativa B8)", possuiEscrita ? "Habilitado" : "Desabilitado"],
    ["Manuais impressos (Ativa B14 e B20)", possuiMaterialImpresso ? "Habilitado" : "Desabilitado"],
    ["Braile (Ativa B17 e B19)", possuiBraile ? "Habilitado" : "Desabilitado"],
    ["AD e/ou Libras (Ativa B19 e B18 c/ Consórcio)", possuiAdLibras ? "Habilitado" : "Desabilitado"],
    ["Consórcio (Ativa B18 c/ AD/Libras)", possuiConsorcio ? "Habilitado" : "Desabilitado"],
    ["", ""],
    ["4. CAMPOS DE PREENCHIMENTO DO SIDEBAR", ""],
    ["Aplicação dos Cadernos (Início)", formatDate(b23ManualInicio)],
    ["Aplicação dos Cadernos (Fim)", formatDate(b23ManualFim)],
    ["Recolhimento nos Polos (Início)", desativadosOpcionais.B26 ? "Inativo" : formatDate(b26ManualInicio)],
    ["Solicitação de Leiaute da Base Institucional", formatDate(b5ManualInicio)],
    ["", ""],
    [activeScenario === "caed" ? "5. FLUXO PRINCIPAL DE PRAZOS CAEd (QUADROS)" : "5. FLUXO PRINCIPAL DE PRAZOS GRÁFICOS (QUADROS)", ""],
    ["Recebimento de base com gordura", formatDate(activeScenario === "caed" ? calculosCaed.c1_limiteBaseDestaque : calculosGrafica.e1_limiteBaseDestaque)],
    ["Disponibilização dos itens de escrita antecipados", possuiEscrita ? formatDate(activeScenario === "caed" ? calculosCaed.c2_dispEscritaDestaque : calculosGrafica.e2_dispEscritaDestaque) : "N/A (Não possui escrita)"]
  );

  const wsResumo = XLSX.utils.aoa_to_sheet(sidebarData);
  applyStylesToSheet(wsResumo, {
    sectionTitles: [
      "1. CONFIGURAÇÕES GERAIS",
      "PARÂMETROS INICIAIS",
      "3. CRITÉRIOS DE HABILITAÇÃO",
      "4. CAMPOS DE PREENCHIMENTO DO SIDEBAR",
      "5. FLUXO PRINCIPAL DE PRAZOS GRÁFICOS (QUADROS)",
      "5. FLUXO PRINCIPAL DE PRAZOS CAEd (QUADROS)"
    ],
    colWidths: [45, 35]
  });
  XLSX.utils.book_append_sheet(wb, wsResumo, "Parâmetros e Fluxo Principal");

  // --- SHEET 2: TABELA GRÁFICA E DATAS EXTRAS ---
  if (activeScenario === "grafica") {
    const headerGrafica = ["CÓD.", "ETAPA", "DATA INÍCIO", "DATA FIM"];
    if (modoEdicaoPrincipal || modoEdicaoExtras) {
      headerGrafica.push("DATA INÍCIO MANUAL", "DATA FIM MANUAL");
    }

    const rowsGrafica = [
      ["TABELA GRÁFICA E DATAS EXTRAS", "", "", "", "", ""],
      ["", "", "", "", "", ""],
      headerGrafica
    ];

    const eCells = ["E4", "E5", "E6", "E7", "E9", "E10", "E11"];
    const allGraficaItems = [
      ...eCells.map(cel => ({ isE: true as const, celula: cel, rowData: null as any })),
      ...datasExtras.map(row => ({ isE: false as const, celula: row.celula, rowData: row }))
    ].sort((a, b) => getCodOrdemNumeric(a.celula) - getCodOrdemNumeric(b.celula));

    allGraficaItems.forEach(item => {
      if (item.isE) {
        const cel = item.celula;
        const isRowDisabled = cel === "E5" && !possuiEscrita;
        const celLower = cel.toLowerCase();
        
        const displayInicio = isRowDisabled ? "-" : formatDate(calculosGrafica[`${celLower}_inicio`]);
        const displayFim = isRowDisabled ? "-" : formatDate(calculosGrafica[celLower]);

        const manualInicio = isRowDisabled ? "-" : formatDate(datasManuaisPrincipal[`${cel}_inicio`] || calculosGrafica[`${celLower}_inicio`]);
        const manualFim = isRowDisabled ? "-" : formatDate(datasManuaisPrincipal[cel] || calculosGrafica[celLower]);

        const rowName = 
          cel === "E4" ? "Recebimento de base institucional (inegociável, sem gordura)" :
          cel === "E5" ? "Disponibilização dos itens de escrita antecipados" :
          cel === "E6" ? "Envio do arquivo de dados (.csv)" :
          cel === "E7" ? "Disponibilização dos cadernos de testes" :
          cel === "E9" ? "Envio dos arquivos de dados variáveis (DVs)" :
          cel === "E10" ? "Validação dos arquivos de DVs" :
          cel === "E11" ? "Homologação dos arquivos de DVs" :
          cel === "E12" ? "Entrega dos materiais nos polos" : "";

        const codOrdem = COD_ORDEM_MAP[cel] || "-";
        const rowCells = [codOrdem, rowName, displayInicio, displayFim];
        if (modoEdicaoPrincipal || modoEdicaoExtras) {
          rowCells.push(manualInicio, manualFim);
        }
        rowsGrafica.push(rowCells);
      } else {
        const row = item.rowData;
        let isRowDisabled = false;
        if (evaluationType === 'somativa' || evaluationType === 'formativa') {
          if (row.isB5B9 && !constaCaedAplicacao) {
            isRowDisabled = true;
          }
          if (row.isB8 && !possuiEscrita) {
            isRowDisabled = true;
          }
          if (row.isMaterialImpresso && !possuiMaterialImpresso) {
            isRowDisabled = true;
          }
          if ((row.celula === "B6" || row.celula === "B7" || row.celula === "B22") && (!b5ManualInicio || b5ManualInicio === "1889-01-01")) {
            isRowDisabled = true;
          }
          if (row.celula === "B17" && !possuiBraile) {
            isRowDisabled = true;
          }
          if (row.celula === "B18" && !(possuiConsorcio && possuiAdLibras)) {
            isRowDisabled = true;
          }
          if (row.celula === "B19" && !(possuiBraile || possuiAdLibras)) {
            isRowDisabled = true;
          }
        }

        const dependenteInativoB26 = row.dependenteB26 && desativadosOpcionais.B26;
        const dependenteInativoB20 = row.celula === "B14" && (!possuiMaterialImpresso || desativadosOpcionais.B20);
        const isFieldDeactivated = (row.celula !== 'B21' && desativadosOpcionais[row.celula]) || dependenteInativoB26 || dependenteInativoB20;

        let displayInicio = "-";
        let displayFim = "-";

        if (!isRowDisabled && !isFieldDeactivated) {
          displayInicio = (row.inicio && row.inicio !== "1889-01-01") ? formatDate(row.inicio) : "-";
          displayFim = row.fim && row.fim !== "-" && row.fim !== "1889-01-01" ? formatDate(row.fim) : "-";
        } else {
          displayInicio = "Inativo / Desabilitado";
          displayFim = "Inativo / Desabilitado";
        }

        let manualInicio = "-";
        let manualFim = "-";
        if (!isRowDisabled && !isFieldDeactivated) {
          const mInicioVal = (datasManuaisExtras && datasManuaisExtras[row.celula]?.inicio) || (row.celula === "B21" ? b21ManualInicio : "");
          manualInicio = (mInicioVal && mInicioVal !== "1889-01-01") ? formatDate(mInicioVal) : "-";

          let mFimVal = (datasManuaisExtras && datasManuaisExtras[row.celula]?.fim) || row.fim;
          if (row.celula === "B21") {
            const sidebarManual = (datasManuaisPrincipal && (datasManuaisPrincipal["C10"] || datasManuaisPrincipal["E12"]));
            if (sidebarManual && sidebarManual !== "1889-01-01") {
              mFimVal = sidebarManual;
            }
          }
          manualFim = (mFimVal && mFimVal !== "-" && mFimVal !== "1889-01-01") ? formatDate(mFimVal) : "-";
        } else {
          manualInicio = "Inativo / Desabilitado";
          manualFim = "Inativo / Desabilitado";
        }

        const codOrdem = COD_ORDEM_MAP[row.celula] || "-";
        const rowCells = [codOrdem, row.nome, displayInicio, displayFim];
        if (modoEdicaoPrincipal || modoEdicaoExtras) {
          rowCells.push(manualInicio, manualFim);
        }
        rowsGrafica.push(rowCells);
      }
    });

    // Anotações Complementares (sem cabeçalho de tabela, com estrutura em branco se vazio e reproduzindo formatações)
    const notesFormatGrafica = extractFormattingFromHtml(observacoes || '');
    rowsGrafica.push(["", "", "", "", "", ""]);
    rowsGrafica.push(["ANOTAÇÕES COMPLEMENTARES", "", "", "", "", ""]);
    const notesRowIdxGrafica = rowsGrafica.length;
    rowsGrafica.push([notesFormatGrafica.text || "", "", "", "", "", ""]);

    const wsGrafica = XLSX.utils.aoa_to_sheet(rowsGrafica);
    const colWidthsGrafica = [12, 55, 20, 20];
    if (modoEdicaoPrincipal || modoEdicaoExtras) {
      colWidthsGrafica.push(20, 20);
    }

    applyStylesToSheet(wsGrafica, {
      headerRowIndex: 2,
      headerBg: "D8E4BC", // VERDE OLIVA, ÊNFASE 3, MAIS CLARO 60%
      sectionTitles: [
        "TABELA GRÁFICA E DATAS EXTRAS",
        "ANOTAÇÕES COMPLEMENTARES"
      ],
      colWidths: colWidthsGrafica
    });

    const cellRefGrafica = XLSX.utils.encode_cell({ r: notesRowIdxGrafica, c: 0 });
    if (wsGrafica[cellRefGrafica]) {
      wsGrafica[cellRefGrafica].s = {
        font: {
          name: "Arial",
          sz: 10,
          color: { rgb: notesFormatGrafica.color },
          bold: notesFormatGrafica.bold,
          italic: notesFormatGrafica.italic,
          underline: notesFormatGrafica.underline
        },
        alignment: { vertical: "top", horizontal: "left", wrapText: true },
        border: {
          top: { style: 'dotted', color: { rgb: 'C9CACC' } },
          bottom: { style: 'dotted', color: { rgb: 'C9CACC' } },
          left: { style: 'dotted', color: { rgb: 'C9CACC' } },
          right: { style: 'dotted', color: { rgb: 'C9CACC' } }
        }
      };
    }
    XLSX.utils.book_append_sheet(wb, wsGrafica, "Tabela Gráfica e Datas Extras");
  }

  // --- SHEET 3: TABELA CAEd E DATAS EXTRAS ---
  if (activeScenario === "caed") {
    const headerCaed = ["CÓD.", "ETAPA", "DATA INÍCIO", "DATA FIM"];
    if (modoEdicaoPrincipal || modoEdicaoExtras) {
      headerCaed.push("DATA INÍCIO MANUAL", "DATA FIM MANUAL");
    }

    const rowsCaed = [
      ["TABELA CAEd E DATAS EXTRAS", "", "", "", "", ""],
      ["", "", "", "", "", ""],
      headerCaed
    ];

    const cCells = ["C4", "C5", "C6", "C7", "C8"];
    const allCaedItems = [
      ...cCells.map(cel => ({ isC: true as const, celula: cel, rowData: null as any })),
      ...datasExtras.map(row => ({ isC: false as const, celula: row.celula, rowData: row }))
    ].sort((a, b) => getCodOrdemNumeric(a.celula) - getCodOrdemNumeric(b.celula));

    allCaedItems.forEach(item => {
      if (item.isC) {
        const cel = item.celula;
        const isRowDisabled = cel === "C5" && !possuiEscrita;
        
        let displayInicio = "-";
        let displayFim = "-";
        let manualInicio = "-";
        let manualFim = "-";

        if (!isRowDisabled) {
          if (cel === "C4") {
            displayInicio = formatDate(calculosCaed.c4);
            displayFim = formatDate(calculosCaed.c4);
            manualInicio = formatDate(datasManuaisPrincipal["C4"] || calculosCaed.c4);
            manualFim = formatDate(datasManuaisPrincipal["C4"] || calculosCaed.c4);
          } else if (cel === "C5") {
            displayInicio = formatDate(calculosCaed.c5);
            displayFim = formatDate(calculosCaed.c5);
            manualInicio = formatDate(datasManuaisPrincipal["C5"] || calculosCaed.c5);
            manualFim = formatDate(datasManuaisPrincipal["C5"] || calculosCaed.c5);
          } else if (cel === "C6") {
            displayInicio = formatDate(calculosCaed.c6);
            displayFim = formatDate(calculosCaed.c6);
            manualInicio = formatDate(datasManuaisPrincipal["C6"] || calculosCaed.c6);
            manualFim = formatDate(datasManuaisPrincipal["C6"] || calculosCaed.c6);
          } else if (cel === "C7") {
            displayInicio = formatDate(calculosCaed.c7);
            displayFim = formatDate(calculosCaed.c7);
            manualInicio = formatDate(datasManuaisPrincipal["C7"] || calculosCaed.c7);
            manualFim = formatDate(datasManuaisPrincipal["C7"] || calculosCaed.c7);
          } else if (cel === "C8") {
            displayInicio = formatDate(calculosCaed.c8_inicio || calculosCaed.c8);
            displayFim = formatDate(calculosCaed.c8);
            manualInicio = formatDate(datasManuaisPrincipal["C8_inicio"] || calculosCaed.c8_inicio || calculosCaed.c8);
            manualFim = formatDate(datasManuaisPrincipal["C8"] || calculosCaed.c8);
          } else if (cel === "C10") {
            displayInicio = formatDate(calculosCaed.entregaPolos);
            displayFim = formatDate(calculosCaed.entregaPolos);
            manualInicio = formatDate(datasManuaisPrincipal["C10"] || calculosCaed.entregaPolos);
            manualFim = formatDate(datasManuaisPrincipal["C10"] || calculosCaed.entregaPolos);
          }
        }

        const rowName = 
          cel === "C4" ? "Recebimento de base institucional (inegociável, sem gordura)" :
          cel === "C5" ? "Disponibilização dos itens de escrita antecipados" :
          cel === "C6" ? "Geração e validação dos arquivos de dados variáveis (DVs)" :
          cel === "C7" ? "Disponibilização dos cadernos de testes" :
          cel === "C8" ? "Homologação dos arquivos de DVs" :
          cel === "C10" ? "Entrega dos materiais nos polos até:" : "";

        const codOrdem = COD_ORDEM_MAP[cel] || "-";
        const rowCells = [codOrdem, rowName, displayInicio, displayFim];
        if (modoEdicaoPrincipal || modoEdicaoExtras) {
          rowCells.push(manualInicio, manualFim);
        }
        rowsCaed.push(rowCells);
      } else {
        const row = item.rowData;
        let isRowDisabled = false;
        if (evaluationType === 'somativa' || evaluationType === 'formativa') {
          if (row.isB5B9 && !constaCaedAplicacao) {
            isRowDisabled = true;
          }
          if (row.isB8 && !possuiEscrita) {
            isRowDisabled = true;
          }
          if (row.isMaterialImpresso && !possuiMaterialImpresso) {
            isRowDisabled = true;
          }
          if ((row.celula === "B6" || row.celula === "B7" || row.celula === "B22") && (!b5ManualInicio || b5ManualInicio === "1889-01-01")) {
            isRowDisabled = true;
          }
          if (row.celula === "B17" && !possuiBraile) {
            isRowDisabled = true;
          }
          if (row.celula === "B18" && !(possuiConsorcio && possuiAdLibras)) {
            isRowDisabled = true;
          }
          if (row.celula === "B19" && !(possuiBraile || possuiAdLibras)) {
            isRowDisabled = true;
          }
        }

        const dependenteInativoB26 = row.dependenteB26 && desativadosOpcionais.B26;
        const dependenteInativoB20 = row.celula === "B14" && (!possuiMaterialImpresso || desativadosOpcionais.B20);
        const isFieldDeactivated = (row.celula !== 'B21' && desativadosOpcionais[row.celula]) || dependenteInativoB26 || dependenteInativoB20;

        let displayInicio = "-";
        let displayFim = "-";

        if (!isRowDisabled && !isFieldDeactivated) {
          displayInicio = (row.inicio && row.inicio !== "1889-01-01") ? formatDate(row.inicio) : "-";
          displayFim = row.fim && row.fim !== "-" && row.fim !== "1889-01-01" ? formatDate(row.fim) : "-";
        } else {
          displayInicio = "Inativo / Desabilitado";
          displayFim = "Inativo / Desabilitado";
        }

        let manualInicio = "-";
        let manualFim = "-";
        if (!isRowDisabled && !isFieldDeactivated) {
          const mInicioVal = (datasManuaisExtras && datasManuaisExtras[row.celula]?.inicio) || (row.celula === "B21" ? b21ManualInicio : "");
          manualInicio = (mInicioVal && mInicioVal !== "1889-01-01") ? formatDate(mInicioVal) : "-";

          let mFimVal = (datasManuaisExtras && datasManuaisExtras[row.celula]?.fim) || row.fim;
          if (row.celula === "B21") {
            const sidebarManual = (datasManuaisPrincipal && (datasManuaisPrincipal["C10"] || datasManuaisPrincipal["E12"]));
            if (sidebarManual && sidebarManual !== "1889-01-01") {
              mFimVal = sidebarManual;
            }
          }
          manualFim = (mFimVal && mFimVal !== "-" && mFimVal !== "1889-01-01") ? formatDate(mFimVal) : "-";
        } else {
          manualInicio = "Inativo / Desabilitado";
          manualFim = "Inativo / Desabilitado";
        }

        const codOrdem = COD_ORDEM_MAP[row.celula] || "-";
        const rowCells = [codOrdem, row.nome, displayInicio, displayFim];
        if (modoEdicaoPrincipal || modoEdicaoExtras) {
          rowCells.push(manualInicio, manualFim);
        }
        rowsCaed.push(rowCells);
      }
    });

    // Anotações Complementares (sem cabeçalho de tabela, com estrutura em branco se vazio e reproduzindo formatações)
    const notesFormatCaed = extractFormattingFromHtml(observacoes || '');
    rowsCaed.push(["", "", "", "", "", ""]);
    rowsCaed.push(["ANOTAÇÕES COMPLEMENTARES", "", "", "", "", ""]);
    const notesRowIdxCaed = rowsCaed.length;
    rowsCaed.push([notesFormatCaed.text || "", "", "", "", "", ""]);

    const wsCaed = XLSX.utils.aoa_to_sheet(rowsCaed);
    const colWidthsCaed = [12, 55, 20, 20];
    if (modoEdicaoPrincipal || modoEdicaoExtras) {
      colWidthsCaed.push(20, 20);
    }

    applyStylesToSheet(wsCaed, {
      headerRowIndex: 2,
      headerBg: "FFF2CC", // AMARELO CLARO
      sectionTitles: [
        "TABELA CAEd E DATAS EXTRAS",
        "ANOTAÇÕES COMPLEMENTARES"
      ],
      colWidths: colWidthsCaed
    });

    const cellRefCaed = XLSX.utils.encode_cell({ r: notesRowIdxCaed, c: 0 });
    if (wsCaed[cellRefCaed]) {
      wsCaed[cellRefCaed].s = {
        font: {
          name: "Arial",
          sz: 10,
          color: { rgb: notesFormatCaed.color },
          bold: notesFormatCaed.bold,
          italic: notesFormatCaed.italic,
          underline: notesFormatCaed.underline
        },
        alignment: { vertical: "top", horizontal: "left", wrapText: true },
        border: {
          top: { style: 'dotted', color: { rgb: 'C9CACC' } },
          bottom: { style: 'dotted', color: { rgb: 'C9CACC' } },
          left: { style: 'dotted', color: { rgb: 'C9CACC' } },
          right: { style: 'dotted', color: { rgb: 'C9CACC' } }
        }
      };
    }
    XLSX.utils.book_append_sheet(wb, wsCaed, "Tabela CAEd e Datas Extras");
  }

  // Determine standard file name: [COD.SUBPROGRAMA]_[SUBPROGRAMA]_PROGRAMAÇÃO_INICIAL.xlsb in uppercase
  const cleanSubprogram = (nomeSubprograma || "").trim().toUpperCase().replace(/\s+/g, '_');
  const cleanCod = (codSubprograma || "0000").trim().toUpperCase();
  const subPart = cleanSubprogram ? `${cleanSubprogram}_` : '';
  const filename = `${cleanCod}_${subPart}PROGRAMAÇÃO_INICIAL.xlsb`;

  // --- DOWNLOAD THE FILE AS XLSB ---
  XLSX.writeFile(wb, filename, { bookType: "xlsb" });
}
