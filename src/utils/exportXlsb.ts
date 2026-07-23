import * as XLSX from 'xlsx-js-style';

interface ExportParams {
  codSubprograma: string;
  nomeSubprograma: string;
  evaluationType: string;
  activeScenario: string;
  dataEntrega: string;
  prazoContratual: string | number;
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
}

export function exportToXlsb({
  codSubprograma,
  nomeSubprograma,
  evaluationType,
  activeScenario,
  dataEntrega,
  prazoContratual,
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
  ocultarCalculosExtras = false
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
  const sidebarData = [
    ["PARÂMETROS E CONFIGURAÇÕES DO CRONOGRAMA", ""],
    ["", ""],
    ["1. CONFIGURAÇÕES GERAIS", ""],
    ["Código do Subprograma", codSubprograma],
    ["Nome do Subprograma", nomeSubprograma || ""],
    ["Tipo de Avaliação do Subprograma", evaluationType === "somativa" ? "Somativa" : "Formativa"],
    ["Cenário Operacional (Geração de DVs)", activeScenario === "caed" ? "CAEd gera DVs" : "Gráfica gera DVs"],
    ["", ""],
    ["2. PARÂMETROS INICIAIS (ÂNCORAS)", ""],
    ["Entrega nos Polos (Anchor)", formatDate(dataEntrega)],
    ["Prazo Contratual (Dias)", prazoContratual ? `${prazoContratual} dias` : "-"],
    ["Prazo Contratual Ajustado (Fator 1.25)", prazoContratual ? `${Math.ceil(Number(prazoContratual) * 1.25)} dias` : "-"],
    ["", ""],
    ["3. CRITÉRIOS DE HABILITAÇÃO", ""],
    ["CAEd APLICAÇÃO (EP05) (Ativa B5 e B9)", constaCaedAplicacao ? "Habilitado (Sim)" : "Desabilitado (Não)"],
    ["ESCRITA (Ativa B8)", possuiEscrita ? "Habilitado (Sim)" : "Desabilitado (Não)"],
    ["MATERIAIS IMPRESSOS (Ativa B14 e B20)", possuiMaterialImpresso ? "Habilitado (Sim)" : "Desabilitado (Não)"],
    ["", ""],
    ["4. CAMPOS DE PREENCHIMENTO DO SIDEBAR", ""],
    ["Aplicação dos Cadernos (Início)", formatDate(b23ManualInicio)],
    ["Aplicação dos Cadernos (Fim)", formatDate(b23ManualFim)],
    ["Recolhimento nos Polos (Início)", desativadosOpcionais.B26 ? "Inativo" : formatDate(b26ManualInicio)],
    ["Solicitação de Leiaute da Base Institucional", formatDate(b5ManualInicio)],
    ["", ""],
    [activeScenario === "caed" ? "5. FLUXO PRINCIPAL DE PRAZOS CAED (QUADROS)" : "5. FLUXO PRINCIPAL DE PRAZOS GRÁFICOS (QUADROS)", ""],
    ["Limite Recebimento da Base", formatDate(activeScenario === "caed" ? calculosCaed.c1_limiteBaseDestaque : calculosGrafica.e1_limiteBaseDestaque)],
    ["Disponibilização de Escrita", possuiEscrita ? formatDate(activeScenario === "caed" ? calculosCaed.c2_dispEscritaDestaque : calculosGrafica.e2_dispEscritaDestaque) : "N/A (Não possui escrita)"]
  ];

  const wsResumo = XLSX.utils.aoa_to_sheet(sidebarData);
  applyStylesToSheet(wsResumo, {
    sectionTitles: [
      "1. CONFIGURAÇÕES GERAIS",
      "2. PARÂMETROS INICIAIS (ÂNCORAS)",
      "3. CRITÉRIOS DE HABILITAÇÃO",
      "4. CAMPOS DE PREENCHIMENTO DO SIDEBAR",
      "5. FLUXO PRINCIPAL DE PRAZOS GRÁFICOS (QUADROS)",
      "5. FLUXO PRINCIPAL DE PRAZOS CAED (QUADROS)"
    ],
    colWidths: [45, 35]
  });
  XLSX.utils.book_append_sheet(wb, wsResumo, "Parâmetros e Fluxo Principal");

  // --- SHEET 2: TABELA GRÁFICA GERA DVS ---
  if (activeScenario === "grafica") {
    const headerGrafica = ["Ref", "ETAPA (Atividade)", "FÓRMULA / LÓGICA DE CÁLCULO"];
    if (modoEdicaoPrincipal) {
      if (ocultarCalculosPrincipal) {
        headerGrafica.push("DATA MANUAL");
      } else {
        headerGrafica.push("DATA PROGRAMADA", "DATA MANUAL");
      }
    } else {
      headerGrafica.push("DATA PROGRAMADA");
    }

    const rowsGrafica = [
      ["TABELA GRÁFICA GERA DVS", "", "", "", ""],
      ["", "", "", "", ""],
      headerGrafica,
      [
        "E4",
        "Prazo limite para recebimento de base (com 10 dias úteis para OPED)",
        "DIATRABALHO(E6;-10;Feriados!$B:$B)",
        ...(modoEdicaoPrincipal 
          ? (ocultarCalculosPrincipal ? [formatDate(datasManuaisPrincipal["E4"])] : [formatDate(calculosGrafica.e4), formatDate(datasManuaisPrincipal["E4"])])
          : [formatDate(calculosGrafica.e4)]
        )
      ],
      [
        "E6",
        "OPED | Envio do arquivo de dados (.csv)",
        "DIATRABALHO(E9;-4;Feriados!$B:$B)",
        ...(modoEdicaoPrincipal 
          ? (ocultarCalculosPrincipal ? [formatDate(datasManuaisPrincipal["E6"])] : [formatDate(calculosGrafica.e6), formatDate(datasManuaisPrincipal["E6"])])
          : [formatDate(calculosGrafica.e6)]
        )
      ],
      [
        "E7",
        "ITENS | Disponibilização dos Cadernos p/ Logística",
        "DIATRABALHO(E8;-2;Feriados!$B:$B)",
        ...(modoEdicaoPrincipal 
          ? (ocultarCalculosPrincipal ? [formatDate(datasManuaisPrincipal["E7"])] : [formatDate(calculosGrafica.e7), formatDate(datasManuaisPrincipal["E7"])])
          : [formatDate(calculosGrafica.e7)]
        )
      ],
      [
        "E8",
        "LOG | Envio de arquivos p/ gráfica",
        "Cópia de E9",
        ...(modoEdicaoPrincipal 
          ? (ocultarCalculosPrincipal ? [formatDate(datasManuaisPrincipal["E8"])] : [formatDate(calculosGrafica.e8), formatDate(datasManuaisPrincipal["E8"])])
          : [formatDate(calculosGrafica.e8)]
        )
      ],
      [
        "E9",
        "GRÁFICA | Envio dos arquivos p/ OPED",
        "DIATRABALHO(E10;-2;Feriados!$B:$B)",
        ...(modoEdicaoPrincipal 
          ? (ocultarCalculosPrincipal ? [formatDate(datasManuaisPrincipal["E9"])] : [formatDate(calculosGrafica.e9), formatDate(datasManuaisPrincipal["E9"])])
          : [formatDate(calculosGrafica.e9)]
        )
      ],
      [
        "E10",
        "OPED | Fim da validação",
        "DIATRABALHO(E11;-2;Feriados!$B:$B)",
        ...(modoEdicaoPrincipal 
          ? (ocultarCalculosPrincipal ? [formatDate(datasManuaisPrincipal["E10"])] : [formatDate(calculosGrafica.e10), formatDate(datasManuaisPrincipal["E10"])])
          : [formatDate(calculosGrafica.e10)]
        )
      ],
      [
        "E11",
        "CAMPO | Fim da homologação",
        "DIATRABALHO(E12;-E14+4;Feriados!$B:$B)",
        ...(modoEdicaoPrincipal 
          ? (ocultarCalculosPrincipal ? [formatDate(datasManuaisPrincipal["E11"])] : [formatDate(calculosGrafica.e11), formatDate(datasManuaisPrincipal["E11"])])
          : [formatDate(calculosGrafica.e11)]
        )
      ],
      [
        "E12",
        "ENTREGA NOS POLOS ATÉ:",
        "Inserção Manual",
        ...(modoEdicaoPrincipal 
          ? (ocultarCalculosPrincipal ? [formatDate(datasManuaisPrincipal["E12"])] : [formatDate(calculosGrafica.entregaPolos), formatDate(datasManuaisPrincipal["E12"])])
          : [formatDate(calculosGrafica.entregaPolos)]
        )
      ]
    ];

    const wsGrafica = XLSX.utils.aoa_to_sheet(rowsGrafica);
    const colWidthsGrafica = [8, 55, 35];
    if (modoEdicaoPrincipal) {
      if (ocultarCalculosPrincipal) {
        colWidthsGrafica.push(20);
      } else {
        colWidthsGrafica.push(20, 20);
      }
    } else {
      colWidthsGrafica.push(20);
    }

    applyStylesToSheet(wsGrafica, {
      headerRowIndex: 2,
      headerBg: "D8E4BC", // VERDE OLIVA, ÊNFASE 3, MAIS CLARO 60%
      colWidths: colWidthsGrafica
    });
    XLSX.utils.book_append_sheet(wb, wsGrafica, "Tabela Gráfica gera DVs");
  }

  // --- SHEET 3: TABELA CAED GERA DVS ---
  if (activeScenario === "caed") {
    const headerCaed = ["Ref", "ETAPA (Atividade)"];
    if (modoEdicaoPrincipal) {
      if (ocultarCalculosPrincipal) {
        headerCaed.push("DATA MANUAL");
      } else {
        headerCaed.push("DATA PROGRAMADA", "DATA MANUAL");
      }
    } else {
      headerCaed.push("DATA PROGRAMADA");
    }

    const rowsCaed = [
      ["TABELA CAED GERA DVS", "", "", ""],
      ["", "", "", ""],
      headerCaed,
      [
        "C4",
        "Prazo limite para recebimento de base (com 10 dias úteis para OPED)",
        ...(modoEdicaoPrincipal 
          ? (ocultarCalculosPrincipal ? [formatDate(datasManuaisPrincipal["C4"])] : [formatDate(calculosCaed.c4), formatDate(datasManuaisPrincipal["C4"])])
          : [formatDate(calculosCaed.c4)]
        )
      ],
      [
        "C5",
        "ITENS | Disponibilização da Escrita p/ OPED (se houver)",
        ...(modoEdicaoPrincipal 
          ? (ocultarCalculosPrincipal ? [formatDate(datasManuaisPrincipal["C5"])] : [formatDate(calculosCaed.c5), formatDate(datasManuaisPrincipal["C5"])])
          : [formatDate(calculosCaed.c5)]
        )
      ],
      [
        "C6",
        "OPED | Envio do arquivo de dados (.csv)",
        ...(modoEdicaoPrincipal 
          ? (ocultarCalculosPrincipal ? [formatDate(datasManuaisPrincipal["C6"])] : [formatDate(calculosCaed.c6), formatDate(datasManuaisPrincipal["C6"])])
          : [formatDate(calculosCaed.c6)]
        )
      ],
      [
        "C7",
        "OPED | Fim da validação",
        ...(modoEdicaoPrincipal 
          ? (ocultarCalculosPrincipal ? [formatDate(datasManuaisPrincipal["C7"])] : [formatDate(calculosCaed.c7), formatDate(datasManuaisPrincipal["C7"])])
          : [formatDate(calculosCaed.c7)]
        )
      ],
      [
        "C8",
        "CAMPO | Fim da homologação",
        ...(modoEdicaoPrincipal 
          ? (ocultarCalculosPrincipal ? [formatDate(datasManuaisPrincipal["C8"])] : [formatDate(calculosCaed.c8), formatDate(datasManuaisPrincipal["C8"])])
          : [formatDate(calculosCaed.c8)]
        )
      ],
      [
        "C9",
        "ENTREGA DOS POLOS",
        ...(modoEdicaoPrincipal 
          ? (ocultarCalculosPrincipal ? [formatDate(datasManuaisPrincipal["C9"])] : [formatDate(calculosCaed.c9), formatDate(datasManuaisPrincipal["C9"])])
          : [formatDate(calculosCaed.c9)]
        )
      ],
      [
        "C10",
        "ENTREGA NOS POLOS ATÉ:",
        ...(modoEdicaoPrincipal 
          ? (ocultarCalculosPrincipal ? [formatDate(datasManuaisPrincipal["C10"])] : [formatDate(calculosCaed.entregaPolos), formatDate(datasManuaisPrincipal["C10"])])
          : [formatDate(calculosCaed.entregaPolos)]
        )
      ]
    ];
    const wsCaed = XLSX.utils.aoa_to_sheet(rowsCaed);
    const colWidthsCaed = [8, 55];
    if (modoEdicaoPrincipal) {
      if (ocultarCalculosPrincipal) {
        colWidthsCaed.push(20);
      } else {
        colWidthsCaed.push(20, 20);
      }
    } else {
      colWidthsCaed.push(20);
    }

    applyStylesToSheet(wsCaed, {
      headerRowIndex: 2,
      headerBg: "FFF2CC", // AMARELO CLARO
      colWidths: colWidthsCaed
    });
    XLSX.utils.book_append_sheet(wb, wsCaed, "Tabela CAEd gera DVs");
  }

  // --- SHEET 4: DETALHAMENTO ADICIONAL DE ETAPAS ---
  const headerExtras = ["Célula", "ETAPA (Atividade)"];
  if (modoEdicaoExtras) {
    if (ocultarCalculosExtras) {
      headerExtras.push("DATA INÍCIO MANUAL", "DATA FIM MANUAL");
    } else {
      headerExtras.push("DATA INÍCIO", "DATA FIM", "DATA INÍCIO MANUAL", "DATA FIM MANUAL");
    }
  } else {
    headerExtras.push("DATA INÍCIO", "DATA FIM");
  }
  headerExtras.push("FÓRMULA LÓGICA DE INÍCIO", "FÓRMULA LÓGICA FIM");

  const rowsExtras = [
    ["DETALHAMENTO ADICIONAL DE ETAPAS", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    headerExtras
  ];

  datasExtras.forEach((row) => {
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
    } else {
      displayInicio = "Inativo / Desabilitado";
      displayFim = "Inativo / Desabilitado";
    }

    let manualInicio = "-";
    let manualFim = "-";
    if (!isRowDisabled && !isFieldDeactivated) {
      manualInicio = datasManuaisExtras[row.celula]?.inicio ? formatDate(datasManuaisExtras[row.celula].inicio) : "-";
      manualFim = datasManuaisExtras[row.celula]?.fim ? formatDate(datasManuaisExtras[row.celula].fim) : "-";
    } else {
      manualInicio = "Inativo / Desabilitado";
      manualFim = "Inativo / Desabilitado";
    }

    const rowCells = [row.celula, row.nome];
    if (modoEdicaoExtras) {
      if (ocultarCalculosExtras) {
        rowCells.push(manualInicio, manualFim);
      } else {
        rowCells.push(displayInicio, displayFim, manualInicio, manualFim);
      }
    } else {
      rowCells.push(displayInicio, displayFim);
    }
    rowCells.push(row.formula_inicio, row.formula_fim);
    rowsExtras.push(rowCells);
  });

  const wsExtras = XLSX.utils.aoa_to_sheet(rowsExtras);
  const colWidthsExtras = [8, 45];
  if (modoEdicaoExtras) {
    if (ocultarCalculosExtras) {
      colWidthsExtras.push(18, 18);
    } else {
      colWidthsExtras.push(18, 18, 18, 18);
    }
  } else {
    colWidthsExtras.push(18, 18);
  }
  colWidthsExtras.push(35, 35);

  applyStylesToSheet(wsExtras, {
    headerRowIndex: 2,
    headerBg: "DDEBF7", // AZUL, ÊNFASE 1, MAIS CLARO 80%
    colWidths: colWidthsExtras
  });
  XLSX.utils.book_append_sheet(wb, wsExtras, "Detalhamento de Etapas");

  // Determine standard file name: [COD.SUBPROGRAMA]_[SUBPROGRAMA]_PROGRAMAÇÃO_INICIAL.xlsb in uppercase
  const cleanSubprogram = (nomeSubprograma || "").trim().toUpperCase().replace(/\s+/g, '_');
  const cleanCod = (codSubprograma || "0000").trim().toUpperCase();
  const subPart = cleanSubprogram ? `${cleanSubprogram}_` : '';
  const filename = `${cleanCod}_${subPart}PROGRAMAÇÃO_INICIAL.xlsb`;

  // --- DOWNLOAD THE FILE AS XLSB ---
  XLSX.writeFile(wb, filename, { bookType: "xlsb" });
}
