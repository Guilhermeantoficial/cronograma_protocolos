import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  b23ManualInicio: string;
  b23ManualFim: string;
  b26ManualInicio: string;
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

export function exportToPdf({
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
  b23ManualInicio,
  b23ManualFim,
  b26ManualInicio,
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
  const formatDate = (dataStr: any) => {
    if (!dataStr || typeof dataStr !== 'string' || dataStr === "-" || dataStr === "1889-01-01" || dataStr === "01/01/1889" || dataStr.startsWith("1889") || dataStr.startsWith("1900") || dataStr === "1900-01-01") {
      return "-";
    }
    const partes = dataStr.split('-');
    if (partes.length !== 3) return dataStr;
    const d = partes[2].padStart(2, '0');
    const m = partes[1].padStart(2, '0');
    const y = partes[0];
    return `${d}/${m}/${y}`;
  };

  const didParseCellHelper = (data: any) => {
    if (data.row.section === 'head') return;
    const rawRow = data.row.raw;
    let hasNA = false;
    if (Array.isArray(rawRow)) {
      hasNA = rawRow.some(val => {
        if (!val) return false;
        if (typeof val === 'string' && val.includes('N/A')) return true;
        if (typeof val === 'object') {
          if (val.content && typeof val.content === 'string' && (val.content.includes('N/A') || (val.content === '-' && val.styles?.textColor))) return true;
        }
        return false;
      });
    } else if (rawRow && typeof rawRow === 'object') {
      hasNA = Object.values(rawRow).some(val => {
        if (!val) return false;
        if (typeof val === 'string' && val.includes('N/A')) return true;
        if (typeof val === 'object') {
          const obj = val as any;
          if (obj.content && typeof obj.content === 'string' && (obj.content.includes('N/A') || (obj.content === '-' && obj.styles?.textColor))) return true;
        }
        return false;
      });
    }
    if (hasNA) {
      data.cell.styles.textColor = [160, 174, 192];
    }
  };

  // Create PDF Document (A4, portrait, millimeters)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const subNameClean = (nomeSubprograma || "").trim().toUpperCase();
  const codClean = (codSubprograma || "0000").trim().toUpperCase();

  // Draw Header Banner on first page (white background as requested)
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 30, 'F');

  // Title Text inside Banner (CAEd Deep Blue color)
  doc.setTextColor(63, 72, 204);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CRONOGRAMA DE PLANEJAMENTO INICIAL', 14, 15);

  // Subtitle/Metadata under Title
  doc.setTextColor(100, 116, 139);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`CÓD. SUBPROGRAMA: ${codClean} | ${subNameClean}`, 14, 21);

  // Generation Date & Time below CÓD. SUBPROGRAMA
  const nowGen = new Date();
  const formatGenDate = `${nowGen.getDate().toString().padStart(2, '0')}/${(nowGen.getMonth() + 1).toString().padStart(2, '0')}/${nowGen.getFullYear()}`;
  const formatGenTime = `${nowGen.getHours().toString().padStart(2, '0')}:${nowGen.getMinutes().toString().padStart(2, '0')}`;
  const genStr = `GERADO EM: ${formatGenDate} às ${formatGenTime}`;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(genStr, 14, 25);

  // Divider line (Yellow accent)
  doc.setDrawColor(255, 242, 0);
  doc.setLineWidth(1);
  doc.line(14, 28, 196, 28);

  let currentY = 36;

  // --- SECTION 1: RESUMO DO SIDEBAR ---
  doc.setTextColor(30, 41, 59);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('1. RESUMO DOS PARÂMETROS E CONFIGURAÇÕES', 14, currentY);
  currentY += 4;

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

  const sidebarRows: any[] = [
    [{ content: "1. CONFIGURAÇÕES GERAIS", colSpan: 2, styles: { fillColor: [242, 242, 242], fontStyle: 'bold' } }],
    ["Código do Subprograma", codClean],
    ["Nome do Subprograma", subNameClean],
    ["Tipo de Avaliação do Subprograma", evaluationType === "somativa" ? "Somativa" : "Formativa"],
    ["Geração de dados variáveis", activeScenario === "caed" ? "CAEd gera DVs" : "Gráfica gera DVs"],
    
    [{ content: "PARÂMETROS INICIAIS", colSpan: 2, styles: { fillColor: [242, 242, 242], fontStyle: 'bold' } }],
    ["Entrega nos Polos", formatDate(dataEntrega)],
    ["Prazo Gráfico (Dias)", displayPrazoOriginal ? `${displayPrazoOriginal} dias` : "-"],
    ["Prazo Protocolos (Fator 1.25)", displayFatorOriginal ? `${displayFatorOriginal} dias` : "-"]
  ];

  if (hasFatorEditado) {
    sidebarRows.push(["Prazo Protocolos (Fator 1.25) - Editado", displayFatorEditado]);
  }

  sidebarRows.push(
    [{ content: "3. CRITÉRIOS DE HABILITAÇÃO", colSpan: 2, styles: { fillColor: [242, 242, 242], fontStyle: 'bold' } }],
    ["CAEd Aplicação (EP05) (Ativa B5 e B9)", constaCaedAplicacao ? "Habilitado" : "Desabilitado"],
    ["Escrita (Ativa B8)", possuiEscrita ? "Habilitado" : "Desabilitado"],
    ["Manuais impressos (Ativa B14 e B20)", possuiMaterialImpresso ? "Habilitado" : "Desabilitado"],
    
    [{ content: "4. CAMPOS DE PREENCHIMENTO DO SIDEBAR", colSpan: 2, styles: { fillColor: [242, 242, 242], fontStyle: 'bold' } }],
    ["Aplicação dos Cadernos (Início)", formatDate(b23ManualInicio)],
    ["Aplicação dos Cadernos (Fim)", formatDate(b23ManualFim)],
    ["Recolhimento nos Polos (Início)", desativadosOpcionais.B26 ? { content: "-", styles: { textColor: [160, 174, 192] } } : formatDate(b26ManualInicio)],
    ["Solicitação de Leiaute da Base Institucional", formatDate(b5ManualInicio)],
    
    [{ content: activeScenario === "caed" ? "5. FLUXO PRINCIPAL DE PRAZOS CAEd (QUADROS)" : "5. FLUXO PRINCIPAL DE PRAZOS GRÁFICOS (QUADROS)", colSpan: 2, styles: { fillColor: [242, 242, 242], fontStyle: 'bold' } }],
    ["Recebimento de base com gordura", formatDate(activeScenario === "caed" ? calculosCaed.c1_limiteBaseDestaque : calculosGrafica.e1_limiteBaseDestaque)],
    ["Disponibilização dos itens de escrita antecipados", possuiEscrita ? formatDate(activeScenario === "caed" ? calculosCaed.c2_dispEscritaDestaque : calculosGrafica.e2_dispEscritaDestaque) : { content: "-", styles: { textColor: [160, 174, 192] } }]
  );

  autoTable(doc, {
    startY: currentY,
    body: sidebarRows as any[],
    theme: 'plain',
    styles: {
      fontSize: 8.5,
      cellPadding: 1.2,
      lineColor: [201, 202, 204],
      lineWidth: 0.1,
      font: 'Helvetica'
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 90 },
      1: { cellWidth: 92 }
    },
    margin: { left: 14, right: 14 },
    didParseCell: didParseCellHelper,
    didDrawPage: (data) => {
      currentY = data.cursor ? data.cursor.y : currentY;
    }
  });

  currentY += 8;

  // --- SECTION 2: TABELA GERA DVS (CONDICIONAL) ---
  if (activeScenario === "grafica") {
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }

    doc.setTextColor(30, 41, 59);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('2. TABELA GRÁFICA E DATAS EXTRAS', 14, currentY);
    currentY += 4;

    const headerGrafica = ["CÓD.", "ETAPA"];
    if (!ocultarCalculosPrincipal) {
      headerGrafica.push("DATA INÍCIO", "DATA FIM");
    }
    if (modoEdicaoPrincipal) {
      headerGrafica.push("DATA INÍCIO (MANUAL)", "DATA FIM (MANUAL)");
    }

    const totalCols = 2 + (!ocultarCalculosPrincipal ? 2 : 0) + (modoEdicaoPrincipal ? 2 : 0);
    const rows: any[] = [];

    const eCells = ["E4", "E5", "E6", "E7", "E9", "E10", "E11", "E12"];
    const allGraficaItems = [
      ...eCells.map(cel => ({ isE: true as const, celula: cel, rowData: null as any })),
      ...datasExtras.map(row => ({ isE: false as const, celula: row.celula, rowData: row }))
    ].sort((a, b) => getCodOrdemNumeric(a.celula) - getCodOrdemNumeric(b.celula));

    allGraficaItems.forEach((item) => {
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
        const rowData = [codOrdem, rowName];
        if (!ocultarCalculosPrincipal) {
          rowData.push(displayInicio, displayFim);
        }
        if (modoEdicaoPrincipal) {
          rowData.push(manualInicio, manualFim);
        }
        rows.push(rowData);
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
        }

        const dependenteInativoB26 = row.dependenteB26 && desativadosOpcionais.B26;
        const dependenteInativoB20 = row.celula === "B14" && (!possuiMaterialImpresso || desativadosOpcionais.B20);
        const isFieldDeactivated = (row.celula !== 'B21' && desativadosOpcionais[row.celula]) || dependenteInativoB26 || dependenteInativoB20;

        let displayInicio = "-";
        let displayFim = "-";

        if (!isRowDisabled && !isFieldDeactivated) {
          displayInicio = formatDate(row.inicio);
          displayFim = row.fim && row.fim !== "-" ? formatDate(row.fim) : "-";
        }

        let manualInicio = "-";
        let manualFim = "-";

        if (!isRowDisabled && !isFieldDeactivated) {
          manualInicio = (datasManuaisExtras[row.celula]?.inicio || row.inicio) ? formatDate(datasManuaisExtras[row.celula]?.inicio || row.inicio) : "-";
          manualFim = (row.fim && row.fim !== "-") ? formatDate(datasManuaisExtras[row.celula]?.fim || row.fim) : "-";
        }

        const codOrdem = COD_ORDEM_MAP[row.celula] || "-";
        const rowData = [codOrdem, row.nome];
        if (!ocultarCalculosPrincipal) {
          rowData.push(displayInicio, displayFim);
        }
        if (modoEdicaoPrincipal) {
          rowData.push(manualInicio, manualFim);
        }
        rows.push(rowData);
      }
    });

    const pColStyles: any = {};
    pColStyles[0] = { cellWidth: 15, halign: 'center' };
    
    if (modoEdicaoPrincipal) {
      if (ocultarCalculosPrincipal) {
        pColStyles[1] = { cellWidth: 107, halign: 'left' };
        pColStyles[2] = { cellWidth: 30, halign: 'center' };
        pColStyles[3] = { cellWidth: 30, halign: 'center' };
      } else {
        pColStyles[1] = { cellWidth: 67, halign: 'left' };
        pColStyles[2] = { cellWidth: 25, halign: 'center' };
        pColStyles[3] = { cellWidth: 25, halign: 'center' };
        pColStyles[4] = { cellWidth: 25, halign: 'center' };
        pColStyles[5] = { cellWidth: 25, halign: 'center' };
      }
    } else {
      pColStyles[1] = { cellWidth: 113, halign: 'left' };
      pColStyles[2] = { cellWidth: 27, halign: 'center' };
      pColStyles[3] = { cellWidth: 27, halign: 'center' };
    }

    autoTable(doc, {
      startY: currentY,
      head: [headerGrafica],
      body: rows,
      theme: 'plain',
      styles: {
        fontSize: 8.5,
        cellPadding: 1.2,
        lineColor: [201, 202, 204],
        lineWidth: 0.1,
        font: 'Helvetica',
        halign: 'center',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [242, 242, 242],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      columnStyles: pColStyles,
      margin: { left: 14, right: 14 },
      didParseCell: didParseCellHelper,
      didDrawPage: (data) => {
        currentY = data.cursor ? data.cursor.y : currentY;
      }
    });

    currentY += 8;
  } else if (activeScenario === "caed") {
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }

    doc.setTextColor(30, 41, 59);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('2. TABELA CAEd E DATAS EXTRAS', 14, currentY);
    currentY += 4;

    const headerCaed = ["CÓD.", "ETAPA"];
    if (!ocultarCalculosPrincipal) {
      headerCaed.push("DATA INÍCIO", "DATA FIM");
    }
    if (modoEdicaoPrincipal) {
      headerCaed.push("DATA INÍCIO (MANUAL)", "DATA FIM (MANUAL)");
    }

    const cCells = ["C4", "C5", "C6", "C7", "C8", "C10"];
    const allCaedItems = [
      ...cCells.map(cel => ({ isC: true as const, celula: cel, rowData: null as any })),
      ...datasExtras.map(row => ({ isC: false as const, celula: row.celula, rowData: row }))
    ].sort((a, b) => getCodOrdemNumeric(a.celula) - getCodOrdemNumeric(b.celula));

    const caedBody: any[] = [];
    allCaedItems.forEach(item => {
      if (item.isC) {
        const id = item.celula;
        const isRowDisabled = id === "C5" && !possuiEscrita;
        const name = 
          id === "C4" ? "Recebimento de base institucional (inegociável, sem gordura)" :
          id === "C5" ? "Disponibilização dos itens de escrita antecipados" :
          id === "C6" ? "Geração e validação dos arquivos de dados variáveis (DVs)" :
          id === "C7" ? "Disponibilização dos cadernos de testes" :
          id === "C8" ? "Homologação dos arquivos de DVs" :
          id === "C10" ? "Entrega dos materiais nos polos até:" : "";

        let displayInicio = "-";
        let displayFim = "-";
        let manualInicio = "-";
        let manualFim = "-";

        if (!isRowDisabled) {
          if (id === "C4") {
            displayInicio = formatDate(calculosCaed.c4);
            displayFim = formatDate(calculosCaed.c4);
            manualInicio = formatDate(datasManuaisPrincipal["C4"] || calculosCaed.c4);
            manualFim = formatDate(datasManuaisPrincipal["C4"] || calculosCaed.c4);
          } else if (id === "C5") {
            displayInicio = formatDate(calculosCaed.c5);
            displayFim = formatDate(calculosCaed.c5);
            manualInicio = formatDate(datasManuaisPrincipal["C5"] || calculosCaed.c5);
            manualFim = formatDate(datasManuaisPrincipal["C5"] || calculosCaed.c5);
          } else if (id === "C6") {
            displayInicio = formatDate(calculosCaed.c6);
            displayFim = formatDate(calculosCaed.c6);
            manualInicio = formatDate(datasManuaisPrincipal["C6"] || calculosCaed.c6);
            manualFim = formatDate(datasManuaisPrincipal["C6"] || calculosCaed.c6);
          } else if (id === "C7") {
            displayInicio = formatDate(calculosCaed.c7);
            displayFim = formatDate(calculosCaed.c7);
            manualInicio = formatDate(datasManuaisPrincipal["C7"] || calculosCaed.c7);
            manualFim = formatDate(datasManuaisPrincipal["C7"] || calculosCaed.c7);
          } else if (id === "C8") {
            displayInicio = formatDate(calculosCaed.c8_inicio || calculosCaed.c8);
            displayFim = formatDate(calculosCaed.c8);
            manualInicio = formatDate(datasManuaisPrincipal["C8_inicio"] || calculosCaed.c8_inicio || calculosCaed.c8);
            manualFim = formatDate(datasManuaisPrincipal["C8"] || calculosCaed.c8);
          } else if (id === "C10") {
            displayInicio = formatDate(calculosCaed.entregaPolos);
            displayFim = formatDate(calculosCaed.entregaPolos);
            manualInicio = formatDate(datasManuaisPrincipal["C10"] || calculosCaed.entregaPolos);
            manualFim = formatDate(datasManuaisPrincipal["C10"] || calculosCaed.entregaPolos);
          }
        }

        const codOrdem = COD_ORDEM_MAP[id] || "-";
        const mapped = [codOrdem, name];
        if (!ocultarCalculosPrincipal) {
          mapped.push(displayInicio, displayFim);
        }
        if (modoEdicaoPrincipal) {
          mapped.push(manualInicio, manualFim);
        }
        caedBody.push(mapped);
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
        }

        const dependenteInativoB26 = row.dependenteB26 && desativadosOpcionais.B26;
        const dependenteInativoB20 = row.celula === "B14" && (!possuiMaterialImpresso || desativadosOpcionais.B20);
        const isFieldDeactivated = (row.celula !== 'B21' && desativadosOpcionais[row.celula]) || dependenteInativoB26 || dependenteInativoB20;

        let displayInicio: any = "-";
        let displayFim: any = "-";

        if (!isRowDisabled && !isFieldDeactivated) {
          displayInicio = formatDate(row.inicio);
          displayFim = row.fim && row.fim !== "-" ? formatDate(row.fim) : "-";
        } else {
          displayInicio = { content: "-", styles: { textColor: [160, 174, 192] } };
          displayFim = { content: "-", styles: { textColor: [160, 174, 192] } };
        }

        let manualInicio: any = "-";
        let manualFim: any = "-";

        if (!isRowDisabled && !isFieldDeactivated) {
          manualInicio = (datasManuaisExtras[row.celula]?.inicio || row.inicio) ? formatDate(datasManuaisExtras[row.celula]?.inicio || row.inicio) : "-";
          manualFim = (row.fim && row.fim !== "-") ? formatDate(datasManuaisExtras[row.celula]?.fim || row.fim) : "-";
        } else {
          manualInicio = { content: "-", styles: { textColor: [160, 174, 192] } };
          manualFim = { content: "-", styles: { textColor: [160, 174, 192] } };
        }

        const codOrdem = COD_ORDEM_MAP[row.celula] || "-";
        const mapped = [codOrdem, row.nome];
        if (!ocultarCalculosPrincipal) {
          mapped.push(displayInicio, displayFim);
        }
        if (modoEdicaoPrincipal) {
          mapped.push(manualInicio, manualFim);
        }
        caedBody.push(mapped);
      }
    });

    const pColStyles: any = {};
    pColStyles[0] = { cellWidth: 15, halign: 'center' };
    
    if (modoEdicaoPrincipal) {
      if (ocultarCalculosPrincipal) {
        pColStyles[1] = { cellWidth: 107, halign: 'left' };
        pColStyles[2] = { cellWidth: 30, halign: 'center' };
        pColStyles[3] = { cellWidth: 30, halign: 'center' };
      } else {
        pColStyles[1] = { cellWidth: 67, halign: 'left' };
        pColStyles[2] = { cellWidth: 25, halign: 'center' };
        pColStyles[3] = { cellWidth: 25, halign: 'center' };
        pColStyles[4] = { cellWidth: 25, halign: 'center' };
        pColStyles[5] = { cellWidth: 25, halign: 'center' };
      }
    } else {
      pColStyles[1] = { cellWidth: 113, halign: 'left' };
      pColStyles[2] = { cellWidth: 27, halign: 'center' };
      pColStyles[3] = { cellWidth: 27, halign: 'center' };
    }

    autoTable(doc, {
      startY: currentY,
      head: [headerCaed],
      body: caedBody,
      theme: 'plain',
      styles: {
        fontSize: 8.5,
        cellPadding: 1.2,
        lineColor: [201, 202, 204],
        lineWidth: 0.1,
        font: 'Helvetica',
        halign: 'center',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [242, 242, 242],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      columnStyles: pColStyles,
      margin: { left: 14, right: 14 },
      didParseCell: didParseCellHelper,
      didDrawPage: (data) => {
        currentY = data.cursor ? data.cursor.y : currentY;
      }
    });

    currentY += 8;
  }

  // --- SECTION 3: DETALHAMENTO DE ETAPAS ---
  if (activeScenario !== "grafica" && activeScenario !== "caed") {
    doc.addPage();
    currentY = 20;

    doc.setTextColor(30, 41, 59);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('3. DETALHAMENTO ADICIONAL DE ETAPAS', 14, currentY);
    currentY += 4;

    const headerExtras = ["CÓD.", "ETAPA"];
    if (modoEdicaoExtras) {
      if (ocultarCalculosExtras) {
        headerExtras.push("DATA INÍCIO (MANUAL)", "DATA FIM (MANUAL)");
      } else {
        headerExtras.push("DATA INÍCIO", "DATA FIM", "DATA INÍCIO (MANUAL)", "DATA FIM (MANUAL)");
      }
    } else {
      headerExtras.push("DATA INÍCIO", "DATA FIM");
    }

    const extrasRows: any[] = [];
    const sortedDetalhamentoExtras = [...datasExtras].sort((a, b) => getCodOrdemNumeric(a.celula) - getCodOrdemNumeric(b.celula));
    sortedDetalhamentoExtras.forEach((row) => {
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
      }

      const dependenteInativoB26 = row.dependenteB26 && desativadosOpcionais.B26;
      const dependenteInativoB20 = row.celula === "B14" && (!possuiMaterialImpresso || desativadosOpcionais.B20);
      const isFieldDeactivated = (row.celula !== 'B21' && desativadosOpcionais[row.celula]) || dependenteInativoB26 || dependenteInativoB20;

      let displayInicio: any = "-";
      let displayFim: any = "-";

      if (!isRowDisabled && !isFieldDeactivated) {
        displayInicio = formatDate(row.inicio);
        displayFim = row.fim && row.fim !== "-" ? formatDate(row.fim) : "-";
      } else {
        displayInicio = { content: "-", styles: { textColor: [160, 174, 192] } };
        displayFim = { content: "-", styles: { textColor: [160, 174, 192] } };
      }

      let manualInicio: any = "-";
      let manualFim: any = "-";

      if (!isRowDisabled && !isFieldDeactivated) {
        manualInicio = datasManuaisExtras[row.celula]?.inicio ? formatDate(datasManuaisExtras[row.celula].inicio) : "-";
        manualFim = datasManuaisExtras[row.celula]?.fim ? formatDate(datasManuaisExtras[row.celula].fim) : "-";
      } else {
        manualInicio = { content: "-", styles: { textColor: [160, 174, 192] } };
        manualFim = { content: "-", styles: { textColor: [160, 174, 192] } };
      }

      const codOrdem = COD_ORDEM_MAP[row.celula] || "-";

      if (modoEdicaoExtras) {
        if (ocultarCalculosExtras) {
          extrasRows.push([
            codOrdem,
            row.nome,
            manualInicio,
            manualFim
          ]);
        } else {
          extrasRows.push([
            codOrdem,
            row.nome,
            displayInicio,
            displayFim,
            manualInicio,
            manualFim
          ]);
        }
      } else {
        extrasRows.push([
          codOrdem,
          row.nome,
          displayInicio,
          displayFim
        ]);
      }
    });

    const colStyles: any = {};
    colStyles[0] = { cellWidth: 15, halign: 'center' };
    
    if (modoEdicaoExtras) {
      if (ocultarCalculosExtras) {
        colStyles[1] = { cellWidth: 107, halign: 'left' };
        colStyles[2] = { cellWidth: 30, halign: 'center' };
        colStyles[3] = { cellWidth: 30, halign: 'center' };
      } else {
        colStyles[1] = { cellWidth: 67, halign: 'left' };
        colStyles[2] = { cellWidth: 25, halign: 'center' };
        colStyles[3] = { cellWidth: 25, halign: 'center' };
        colStyles[4] = { cellWidth: 25, halign: 'center' };
        colStyles[5] = { cellWidth: 25, halign: 'center' };
      }
    } else {
      colStyles[1] = { cellWidth: 113, halign: 'left' };
      colStyles[2] = { cellWidth: 27, halign: 'center' };
      colStyles[3] = { cellWidth: 27, halign: 'center' };
    }

    autoTable(doc, {
      startY: currentY,
      head: [headerExtras],
      body: extrasRows,
      theme: 'plain',
      styles: {
        fontSize: 8.5,
        cellPadding: 1.2,
        lineColor: [201, 202, 204],
        lineWidth: 0.1,
        font: 'Helvetica',
        halign: 'center',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [242, 242, 242],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      columnStyles: colStyles,
      margin: { left: 14, right: 14, top: 15, bottom: 15 },
      pageBreak: 'auto',
      rowPageBreak: 'avoid',
      didParseCell: didParseCellHelper,
      didDrawPage: (data) => {
        currentY = data.cursor ? data.cursor.y : currentY;
      }
    });
  }

  // --- RICH HTML RENDERER FOR ANOTAÇÕES COMPLEMENTARES ---
  interface TextRun {
    text: string;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strike: boolean;
    color: [number, number, number] | null;
    bgColor: [number, number, number] | null;
  }

  interface TextBlock {
    type: 'paragraph' | 'h1' | 'h2' | 'h3' | 'bullet' | 'number';
    listIndex?: number;
    runs: TextRun[];
  }

  const parseColorString = (str: string): [number, number, number] | null => {
    if (!str) return null;
    const rgbMatch = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (rgbMatch) {
      return [parseInt(rgbMatch[1], 10), parseInt(rgbMatch[2], 10), parseInt(rgbMatch[3], 10)];
    }
    const hexMatch = str.match(/#([0-9a-f]{6})/i);
    if (hexMatch) {
      const hex = hexMatch[1];
      return [
        parseInt(hex.substring(0, 2), 16),
        parseInt(hex.substring(2, 4), 16),
        parseInt(hex.substring(4, 6), 16)
      ];
    }
    return null;
  };

  const extractRunsFromDomNode = (
    node: Node,
    parentStyle: {
      bold: boolean;
      italic: boolean;
      underline: boolean;
      strike: boolean;
      color: [number, number, number] | null;
      bgColor: [number, number, number] | null;
    }
  ): TextRun[] => {
    const currentStyle = { ...parentStyle };

    if (node.nodeType === 1) { // Element
      const elem = node as HTMLElement;
      const tag = elem.tagName.toUpperCase();

      if (tag === 'B' || tag === 'STRONG') currentStyle.bold = true;
      if (tag === 'I' || tag === 'EM') currentStyle.italic = true;
      if (tag === 'U') currentStyle.underline = true;
      if (tag === 'S' || tag === 'STRIKE' || tag === 'DEL') currentStyle.strike = true;

      const styleAttr = elem.getAttribute('style') || '';
      if (/font-weight\s*:\s*(bold|[6-9]00)/i.test(styleAttr)) currentStyle.bold = true;
      if (/font-style\s*:\s*italic/i.test(styleAttr)) currentStyle.italic = true;
      if (/text-decoration\s*:[^;]*underline/i.test(styleAttr)) currentStyle.underline = true;
      if (/text-decoration\s*:[^;]*line-through/i.test(styleAttr)) currentStyle.strike = true;

      const colorMatch = styleAttr.match(/(?:^|;\s*)color\s*:\s*([^;]+)/i);
      if (colorMatch) {
        const parsed = parseColorString(colorMatch[1]);
        if (parsed) currentStyle.color = parsed;
      }

      const bgMatch = styleAttr.match(/(?:^|;\s*)background-color\s*:\s*([^;]+)/i);
      if (bgMatch) {
        const parsed = parseColorString(bgMatch[1]);
        if (parsed) currentStyle.bgColor = parsed;
      }

      let runs: TextRun[] = [];
      for (let i = 0; i < elem.childNodes.length; i++) {
        runs = runs.concat(extractRunsFromDomNode(elem.childNodes[i], currentStyle));
      }
      return runs;
    } else if (node.nodeType === 3) { // Text
      const text = node.nodeValue || '';
      if (text) {
        return [{
          text,
          bold: currentStyle.bold,
          italic: currentStyle.italic,
          underline: currentStyle.underline,
          strike: currentStyle.strike,
          color: currentStyle.color,
          bgColor: currentStyle.bgColor
        }];
      }
    }
    return [];
  };

  const parseRichTextBlocks = (rawHtml: string): TextBlock[] => {
    if (!rawHtml || !rawHtml.trim()) return [];

    const isHtml = /<[a-z][\s\S]*>/i.test(rawHtml);
    if (!isHtml) {
      const lines = rawHtml.split(/\r?\n/);
      return lines.map(line => ({
        type: 'paragraph',
        runs: [{ text: line, bold: false, italic: false, underline: false, strike: false, color: null, bgColor: null }]
      }));
    }

    const parser = new DOMParser();
    const parsedDoc = parser.parseFromString(`<div>${rawHtml}</div>`, 'text/html');
    const container = parsedDoc.body.firstElementChild || parsedDoc.body;

    const blocks: TextBlock[] = [];

    const processNode = (parent: Node) => {
      for (let i = 0; i < parent.childNodes.length; i++) {
        const child = parent.childNodes[i];
        if (child.nodeType === 1) {
          const elem = child as HTMLElement;
          const tag = elem.tagName.toUpperCase();

          if (tag === 'H1' || tag === 'H2' || tag === 'H3') {
            const type = tag.toLowerCase() as 'h1' | 'h2' | 'h3';
            const runs = extractRunsFromDomNode(elem, { bold: true, italic: false, underline: false, strike: false, color: null, bgColor: null });
            blocks.push({ type, runs });
          } else if (tag === 'UL') {
            let itemIdx = 0;
            for (let j = 0; j < elem.childNodes.length; j++) {
              const li = elem.childNodes[j];
              if (li.nodeType === 1 && (li as HTMLElement).tagName.toUpperCase() === 'LI') {
                itemIdx++;
                const runs = extractRunsFromDomNode(li, { bold: false, italic: false, underline: false, strike: false, color: null, bgColor: null });
                blocks.push({ type: 'bullet', listIndex: itemIdx, runs });
              }
            }
          } else if (tag === 'OL') {
            let itemIdx = 0;
            for (let j = 0; j < elem.childNodes.length; j++) {
              const li = elem.childNodes[j];
              if (li.nodeType === 1 && (li as HTMLElement).tagName.toUpperCase() === 'LI') {
                itemIdx++;
                const runs = extractRunsFromDomNode(li, { bold: false, italic: false, underline: false, strike: false, color: null, bgColor: null });
                blocks.push({ type: 'number', listIndex: itemIdx, runs });
              }
            }
          } else if (tag === 'P' || tag === 'DIV' || tag === 'BLOCKQUOTE') {
            const runs = extractRunsFromDomNode(elem, { bold: false, italic: false, underline: false, strike: false, color: null, bgColor: null });
            blocks.push({ type: 'paragraph', runs });
          } else {
            const runs = extractRunsFromDomNode(elem, { bold: false, italic: false, underline: false, strike: false, color: null, bgColor: null });
            if (runs.length > 0) {
              blocks.push({ type: 'paragraph', runs });
            }
          }
        } else if (child.nodeType === 3) {
          const text = child.nodeValue || '';
          if (text.trim()) {
            blocks.push({
              type: 'paragraph',
              runs: [{ text, bold: false, italic: false, underline: false, strike: false, color: null, bgColor: null }]
            });
          }
        }
      }
    };

    processNode(container);
    return blocks;
  };

  // --- SECTION: ANOTAÇÕES COMPLEMENTARES (AO FINAL DEPOIS DAS TABELAS) ---
  const sectionNum = "3";
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  } else {
    currentY += 8;
  }

  doc.setTextColor(30, 41, 59);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`${sectionNum}. ANOTAÇÕES COMPLEMENTARES`, 14, currentY);
  currentY += 5;

  const renderNotesSection = (rawContent: string) => {
    const blocks = parseRichTextBlocks(rawContent);

    const leftMargin = 14;
    const rightMargin = 14;
    const pageWidth = 210;
    const contentWidth = pageWidth - leftMargin - rightMargin; // 182mm
    const padding = 4;
    const innerWidth = contentWidth - padding * 2; // 174mm
    const startX = leftMargin + padding;

    const boxStartY = currentY;

    if (blocks.length === 0) {
      doc.setDrawColor(201, 202, 204);
      doc.setLineWidth(0.1);
      doc.rect(leftMargin, boxStartY, contentWidth, 18);
      currentY = boxStartY + 18 + 8;
      return;
    }

    let yPos = boxStartY + padding;

    for (const block of blocks) {
      let fontSizePt = 8.5;
      if (block.type === 'h1') fontSizePt = 11;
      else if (block.type === 'h2') fontSizePt = 10;
      else if (block.type === 'h3') fontSizePt = 9.5;

      const fontSizeMm = fontSizePt * 0.352778;
      const lineHeightMm = fontSizeMm * 1.5; // strict 1.5 line height

      let runs = [...block.runs];
      if (block.type === 'bullet') {
        runs.unshift({ text: '• ', bold: true, italic: false, underline: false, strike: false, color: [30, 41, 59], bgColor: null });
      } else if (block.type === 'number') {
        runs.unshift({ text: `${block.listIndex || 1}. `, bold: true, italic: false, underline: false, strike: false, color: [30, 41, 59], bgColor: null });
      }

      const blockText = runs.map(r => r.text).join('');
      if (!blockText || !blockText.trim()) {
        yPos += lineHeightMm;
        continue;
      }

      interface RenderSegment {
        text: string;
        bold: boolean;
        italic: boolean;
        underline: boolean;
        strike: boolean;
        color: [number, number, number];
        bgColor: [number, number, number] | null;
        widthMm: number;
      }

      const lines: RenderSegment[][] = [[]];
      let currentLineWidth = 0;

      for (const run of runs) {
        let fontStyle = 'normal';
        if (run.bold && run.italic) fontStyle = 'bolditalic';
        else if (run.bold) fontStyle = 'bold';
        else if (run.italic) fontStyle = 'italic';

        doc.setFont('Helvetica', fontStyle);
        doc.setFontSize(fontSizePt);

        const words = run.text.split(/(?<= )|(?= )/);

        for (const word of words) {
          if (!word) continue;
          const wordWidth = doc.getTextWidth(word);

          if (currentLineWidth + wordWidth > innerWidth && lines[lines.length - 1].length > 0) {
            lines.push([]);
            currentLineWidth = 0;
            if (word === ' ') continue;
          }

          lines[lines.length - 1].push({
            text: word,
            bold: run.bold,
            italic: run.italic,
            underline: run.underline,
            strike: run.strike,
            color: run.color || [30, 41, 59],
            bgColor: run.bgColor,
            widthMm: wordWidth
          });
          currentLineWidth += wordWidth;
        }
      }

      for (const line of lines) {
        if (line.length === 0) continue;

        if (yPos + lineHeightMm > 275) {
          doc.addPage();
          yPos = 20;
        }

        let curX = startX;
        const baselineY = yPos + fontSizeMm * 0.8;

        for (const seg of line) {
          let fontStyle = 'normal';
          if (seg.bold && seg.italic) fontStyle = 'bolditalic';
          else if (seg.bold) fontStyle = 'bold';
          else if (seg.italic) fontStyle = 'italic';

          doc.setFont('Helvetica', fontStyle);
          doc.setFontSize(fontSizePt);

          if (seg.bgColor) {
            doc.setFillColor(seg.bgColor[0], seg.bgColor[1], seg.bgColor[2]);
            doc.rect(curX, baselineY - fontSizeMm * 0.8, seg.widthMm, fontSizeMm * 1.1, 'F');
          }

          doc.setTextColor(seg.color[0], seg.color[1], seg.color[2]);
          doc.text(seg.text, curX, baselineY);

          if (seg.underline) {
            doc.setDrawColor(seg.color[0], seg.color[1], seg.color[2]);
            doc.setLineWidth(0.2);
            doc.line(curX, baselineY + 0.4, curX + seg.widthMm, baselineY + 0.4);
          }

          if (seg.strike) {
            doc.setDrawColor(seg.color[0], seg.color[1], seg.color[2]);
            doc.setLineWidth(0.2);
            doc.line(curX, baselineY - fontSizeMm * 0.35, curX + seg.widthMm, baselineY - fontSizeMm * 0.35);
          }

          curX += seg.widthMm;
        }

        yPos += lineHeightMm;
      }

      yPos += 1;
    }

    const totalBoxHeight = Math.max(18, yPos - boxStartY + padding);
    doc.setDrawColor(201, 202, 204);
    doc.setLineWidth(0.1);
    doc.rect(leftMargin, boxStartY, contentWidth, totalBoxHeight);

    currentY = boxStartY + totalBoxHeight + 8;
  };

  renderNotesSection(observacoes || '');

  // Footer text with page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    // Draw footer line
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 282, 196, 282);
    doc.text(`Página ${i} de ${totalPages}`, 196, 286, { align: 'right' });
    doc.text('Fundação CAEd | Cronograma Automático', 14, 286);
  }

  // File Name Structure: [COD.SUBPROGRAMA]_[SUBPROGRAMA]_PROGRAMAÇÃO_INICIAL_[DATA]_[HORA].pdf
  const now = new Date();
  const dateStr = [
    now.getDate().toString().padStart(2, '0'),
    (now.getMonth() + 1).toString().padStart(2, '0'),
    now.getFullYear()
  ].join('');
  const timeStr = [
    now.getHours().toString().padStart(2, '0'),
    now.getMinutes().toString().padStart(2, '0')
  ].join('');
  const filenameSubPart = subNameClean ? `${subNameClean.replace(/\s+/g, '_')}_` : '';
  const filename = `${codClean}_${filenameSubPart}PROGRAMAÇÃO_INICIAL_${dateStr}_${timeStr}.pdf`;
  doc.save(filename);
}
