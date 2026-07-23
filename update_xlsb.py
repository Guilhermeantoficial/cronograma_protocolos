import re

with open('src/utils/exportXlsb.ts', 'r') as f:
    content = f.read()

# Update ExportParams
params_repl = """interface ExportParams {
  codSubprograma: string;
  nomeSubprograma: string;
  evaluationType: string;
  activeScenario: string;
  dataEntrega: string;
  prazoContratual: string | number;
  constaCaedAplicacao: boolean;
  possuiEscrita: boolean;
  b23ManualInicio: string;
  b26ManualInicio: string;
  b5ManualInicio: string;
  desativadosOpcionais: Record<string, boolean>;
  calculosGrafica: any;
  calculosCaed: any;
  datasExtras: any[];
  datasManuaisPrincipal?: Record<string, string>;
  datasManuaisExtras?: Record<string, { inicio?: string, fim?: string }>;
  datasManuaisGeral?: Record<string, { inicio?: string, fim?: string }>;
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
  b23ManualInicio,
  b26ManualInicio,
  b5ManualInicio,
  desativadosOpcionais,
  calculosGrafica,
  calculosCaed,
  datasExtras,
  datasManuaisPrincipal = {},
  datasManuaisExtras = {},
  datasManuaisGeral = {}
}: ExportParams) {"""
content = re.sub(r'interface ExportParams \{.*?\}: ExportParams\) \{', params_repl, content, flags=re.DOTALL)

# Update rowsGrafica
grafica_repl = """  const hasManualGrafica = Object.keys(datasManuaisPrincipal).length > 0;
  const headerGrafica = hasManualGrafica 
    ? ["Ref", "ETAPA (Atividade)", "DATA PROGRAMADA", "DATA PROGRAMADA (MANUAL)"]
    : ["Ref", "ETAPA (Atividade)", "DATA PROGRAMADA"];

  const rowsGrafica = [
    ["TABELA GRÁFICA GERA DVS", "", ""].concat(hasManualGrafica ? [""] : []),
    ["", "", ""].concat(hasManualGrafica ? [""] : []),
    headerGrafica,
    [
      "E4",
      "Prazo limite para recebimento de base (com 10 dias úteis para OPED)",
      formatDate(calculosGrafica.e4),
      ...(hasManualGrafica ? [formatDate(datasManuaisPrincipal["E4"])] : [])
    ],
    [
      "E5",
      "ITENS | Disponibilização da Escrita p/ OPED (se houver)",
      formatDate(calculosGrafica.e5),
      ...(hasManualGrafica ? [formatDate(datasManuaisPrincipal["E5"])] : [])
    ],
    [
      "E6",
      "OPED | Envio do arquivo de dados (.csv)",
      formatDate(calculosGrafica.e6),
      ...(hasManualGrafica ? [formatDate(datasManuaisPrincipal["E6"])] : [])
    ],
    [
      "E7",
      "ITENS | Disponibilização dos Cadernos p/ Logística",
      formatDate(calculosGrafica.e7),
      ...(hasManualGrafica ? [formatDate(datasManuaisPrincipal["E7"])] : [])
    ],
    [
      "E8",
      "LOG | Envio de arquivos p/ gráfica",
      formatDate(calculosGrafica.e8),
      ...(hasManualGrafica ? [formatDate(datasManuaisPrincipal["E8"])] : [])
    ],
    [
      "E9",
      "GRÁFICA | Envio dos arquivos p/ OPED",
      formatDate(calculosGrafica.e9),
      ...(hasManualGrafica ? [formatDate(datasManuaisPrincipal["E9"])] : [])
    ],
    [
      "E10",
      "OPED | Fim da validação",
      formatDate(calculosGrafica.e10),
      ...(hasManualGrafica ? [formatDate(datasManuaisPrincipal["E10"])] : [])
    ],
    [
      "E11",
      "CAMPO | Fim da homologação",
      formatDate(calculosGrafica.e11),
      ...(hasManualGrafica ? [formatDate(datasManuaisPrincipal["E11"])] : [])
    ],
    [
      "E12",
      "ENTREGA NOS POLOS",
      formatDate(calculosGrafica.entregaPolos),
      ...(hasManualGrafica ? [formatDate(datasManuaisPrincipal["E12"])] : [])
    ]
  ];"""
content = re.sub(r'const rowsGrafica = \[.*?\];\s*const wsGrafica = XLSX\.utils\.aoa_to_sheet\(rowsGrafica\);', grafica_repl + '\n  const wsGrafica = XLSX.utils.aoa_to_sheet(rowsGrafica);', content, flags=re.DOTALL)

# Update rowsCaed
caed_repl = """    const hasManualCaed = Object.keys(datasManuaisPrincipal).length > 0;
    const headerCaed = hasManualCaed 
      ? ["Ref", "ETAPA (Atividade)", "DATA PROGRAMADA", "DATA PROGRAMADA (MANUAL)"]
      : ["Ref", "ETAPA (Atividade)", "DATA PROGRAMADA"];

    const rowsCaed = [
      ["TABELA CAED GERA DVS", "", ""].concat(hasManualCaed ? [""] : []),
      ["", "", ""].concat(hasManualCaed ? [""] : []),
      headerCaed,
      [
        "C4",
        "Prazo limite para recebimento de base (com 10 dias úteis para OPED)",
        formatDate(calculosCaed.c4),
        ...(hasManualCaed ? [formatDate(datasManuaisPrincipal["C4"])] : [])
      ],
      [
        "C5",
        "ITENS | Disponibilização da Escrita p/ OPED (se houver)",
        formatDate(calculosCaed.c5),
        ...(hasManualCaed ? [formatDate(datasManuaisPrincipal["C5"])] : [])
      ],
      [
        "C6",
        "OPED | Envio do arquivo de dados (.csv)",
        formatDate(calculosCaed.c6),
        ...(hasManualCaed ? [formatDate(datasManuaisPrincipal["C6"])] : [])
      ],
      [
        "C7",
        "OPED | Fim da validação",
        formatDate(calculosCaed.c7),
        ...(hasManualCaed ? [formatDate(datasManuaisPrincipal["C7"])] : [])
      ],
      [
        "C8",
        "CAMPO | Fim da homologação",
        formatDate(calculosCaed.c8),
        ...(hasManualCaed ? [formatDate(datasManuaisPrincipal["C8"])] : [])
      ],
      [
        "C9",
        "ENTREGA DOS POLOS",
        formatDate(calculosCaed.c9),
        ...(hasManualCaed ? [formatDate(datasManuaisPrincipal["C9"])] : [])
      ],
      [
        "C10",
        "ENTREGA NOS POLOS",
        formatDate(calculosCaed.entregaPolos),
        ...(hasManualCaed ? [formatDate(datasManuaisPrincipal["C10"])] : [])
      ]
    ];"""
content = re.sub(r'const rowsCaed = \[.*?\];\s*const wsCaed = XLSX\.utils\.aoa_to_sheet\(rowsCaed\);', caed_repl + '\n    const wsCaed = XLSX.utils.aoa_to_sheet(rowsCaed);', content, flags=re.DOTALL)

# Update rowsExtras
extras_repl = """  const hasManualExtras = Object.keys(datasManuaisExtras).length > 0;
  const headerExtras = hasManualExtras
    ? ["CÉLULA", "ETAPA (ATIVIDADE)", "DATA INÍCIO (CALC)", "DATA INÍCIO (MANUAL)", "DATA FIM (CALC)", "DATA FIM (MANUAL)"]
    : ["CÉLULA", "ETAPA (ATIVIDADE)", "DATA INÍCIO", "DATA FIM"];

  const rowsExtras: any[] = [
    ["DEMAIS PRAZOS PARA APLICAÇÃO", "", "", ""].concat(hasManualExtras ? ["", ""] : []),
    ["", "", "", ""].concat(hasManualExtras ? ["", ""] : []),
    headerExtras
  ];

  datasExtras.forEach(row => {
    let status = "";
    if (evaluationType === 'somativa' || evaluationType === 'formativa') {
      if (row.isB5B9 && !constaCaedAplicacao) {
        status = " (Desabilitado)";
      }
      if (row.isB8 && !possuiEscrita) {
        status = " (Desabilitado)";
      }
    }
    const dependenteInativoB26 = row.dependenteB26 && desativadosOpcionais.B26;
    const dependenteInativoB20 = row.celula === "B14" && desativadosOpcionais.B20;
    const isFieldDeactivated = (row.celula !== 'B21' && desativadosOpcionais[row.celula]) || dependenteInativoB26 || dependenteInativoB20;
    if (isFieldDeactivated) {
      status = " (Desabilitado)";
    }

    const newRow = [
      row.celula,
      row.nome + status,
      formatDate(row.inicio),
      ...(hasManualExtras ? [formatDate(datasManuaisExtras[row.celula]?.inicio)] : []),
      row.fim !== "-" ? formatDate(row.fim) : "-",
      ...(hasManualExtras ? [row.fim !== "-" ? formatDate(datasManuaisExtras[row.celula]?.fim) : "-"] : [])
    ];
    rowsExtras.push(newRow);
  });"""
content = re.sub(r'const rowsExtras = \[\s*\["DEMAIS PRAZOS PARA APLICAÇÃO", "", "", ""\],\s*\["", "", "", ""\],\s*\["CÉLULA", "ETAPA \(ATIVIDADE\)", "DATA INÍCIO", "DATA FIM"\]\s*\];\s*datasExtras\.forEach\(row => \{.*?rowsExtras\.push\(\[\s*row\.celula,\s*row\.nome \+ status,\s*formatDate\(row\.inicio\),\s*row\.fim !== "-" \? formatDate\(row\.fim\) : "-"\s*\]\);\s*\}\);', extras_repl, content, flags=re.DOTALL)

with open('src/utils/exportXlsb.ts', 'w') as f:
    f.write(content)
