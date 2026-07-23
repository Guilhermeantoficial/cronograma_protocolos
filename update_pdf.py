import re

with open('src/utils/exportPdf.ts', 'r') as f:
    content = f.read()

# 1. Update graficaBody
grafica_repl = """    const hasManualGrafica = Object.keys(datasManuaisPrincipal).length > 0;
    const graficaHead = hasManualGrafica 
      ? [["REFERÊNCIA", "ETAPA (ATIVIDADE)", "DATA (CALCULADA)", "DATA (MANUAL)"]]
      : [["REFERÊNCIA", "ETAPA (ATIVIDADE)", "DATA PROGRAMADA"]];

    const graficaBody = [
      ["E4", "Prazo limite para recebimento de base (com 10 dias úteis para OPED)", formatDate(calculosGrafica.e4), hasManualGrafica ? formatDate(datasManuaisPrincipal["E4"]) : null],
      ["E5", "ITENS | Disponibilização da Escrita p/ OPED (se houver)", formatDate(calculosGrafica.e5), hasManualGrafica ? formatDate(datasManuaisPrincipal["E5"]) : null],
      ["E6", "OPED | Envio do arquivo de dados (.csv)", formatDate(calculosGrafica.e6), hasManualGrafica ? formatDate(datasManuaisPrincipal["E6"]) : null],
      ["E7", "ITENS | Disponibilização dos Cadernos p/ Logística", formatDate(calculosGrafica.e7), hasManualGrafica ? formatDate(datasManuaisPrincipal["E7"]) : null],
      ["E8", "LOG | Envio de arquivos p/ gráfica", formatDate(calculosGrafica.e8), hasManualGrafica ? formatDate(datasManuaisPrincipal["E8"]) : null],
      ["E9", "GRÁFICA | Envio dos arquivos p/ OPED", formatDate(calculosGrafica.e9), hasManualGrafica ? formatDate(datasManuaisPrincipal["E9"]) : null],
      ["E10", "OPED | Fim da validação", formatDate(calculosGrafica.e10), hasManualGrafica ? formatDate(datasManuaisPrincipal["E10"]) : null],
      ["E11", "CAMPO | Fim da homologação", formatDate(calculosGrafica.e11), hasManualGrafica ? formatDate(datasManuaisPrincipal["E11"]) : null],
      ["E12", "ENTREGA NOS POLOS", formatDate(calculosGrafica.entregaPolos), hasManualGrafica ? formatDate(datasManuaisPrincipal["E12"]) : null]
    ].map(row => row.filter(cell => cell !== null));

    autoTable(doc, {
      startY: currentY,
      head: graficaHead,"""

content = re.sub(r'const graficaBody = \[.*?\];\s*autoTable\(doc, \{\s*startY: currentY,\s*head: \[\["REFERÊNCIA", "ETAPA \(ATIVIDADE\)", "DATA PROGRAMADA"\]\],', grafica_repl, content, flags=re.DOTALL)

# 2. Update caedBody
caed_repl = """    const hasManualCaed = Object.keys(datasManuaisPrincipal).length > 0;
    const caedHead = hasManualCaed 
      ? [["REFERÊNCIA", "ETAPA (ATIVIDADE)", "DATA (CALCULADA)", "DATA (MANUAL)"]]
      : [["REFERÊNCIA", "ETAPA (ATIVIDADE)", "DATA PROGRAMADA"]];

    const caedBody = [
      ["C4", "Prazo limite para recebimento de base (com 10 dias úteis para OPED)", formatDate(calculosCaed.c4), hasManualCaed ? formatDate(datasManuaisPrincipal["C4"]) : null],
      ["C5", "ITENS | Disponibilização da Escrita p/ OPED (se houver)", formatDate(calculosCaed.c5), hasManualCaed ? formatDate(datasManuaisPrincipal["C5"]) : null],
      ["C6", "OPED | Envio do arquivo de dados (.csv)", formatDate(calculosCaed.c6), hasManualCaed ? formatDate(datasManuaisPrincipal["C6"]) : null],
      ["C7", "OPED | Fim da validação", formatDate(calculosCaed.c7), hasManualCaed ? formatDate(datasManuaisPrincipal["C7"]) : null],
      ["C8", "CAMPO | Fim da homologação", formatDate(calculosCaed.c8), hasManualCaed ? formatDate(datasManuaisPrincipal["C8"]) : null],
      ["C9", "ENTREGA DOS POLOS", formatDate(calculosCaed.entregaPolos), hasManualCaed ? formatDate(datasManuaisPrincipal["C9"]) : null]
    ].map(row => row.filter(cell => cell !== null));

    autoTable(doc, {
      startY: currentY,
      head: caedHead,"""

content = re.sub(r'const caedBody = \[.*?\];\s*autoTable\(doc, \{\s*startY: currentY,\s*head: \[\["REFERÊNCIA", "ETAPA \(ATIVIDADE\)", "DATA PROGRAMADA"\]\],', caed_repl, content, flags=re.DOTALL)

# 3. Update extrasBody
extras_repl = """  const hasManualExtras = Object.keys(datasManuaisExtras).length > 0;
  const extrasHead = hasManualExtras
    ? [["CÉLULA", "ETAPA (ATIVIDADE)", "DATA INÍCIO (CALC)", "DATA INÍCIO (MANUAL)", "DATA FIM (CALC)", "DATA FIM (MANUAL)"]]
    : [["CÉLULA", "ETAPA (ATIVIDADE)", "DATA INÍCIO", "DATA FIM"]];

  const extrasRows = datasExtras.map(item => {
    const row = [
      item.celula,
      item.nome,
      formatDate(item.inicio)
    ];
    if (hasManualExtras) row.push(formatDate(datasManuaisExtras[item.celula]?.inicio));
    row.push(item.fim !== "-" ? formatDate(item.fim) : "-");
    if (hasManualExtras) row.push(item.fim !== "-" ? formatDate(datasManuaisExtras[item.celula]?.fim) : "-");
    return row;
  });

  autoTable(doc, {
    startY: currentY,
    head: extrasHead,"""

content = re.sub(r'const extrasRows = datasExtras\.map\(item => \[\s*item\.celula,\s*item\.nome,\s*formatDate\(item\.inicio\),\s*item\.fim !== "-" \? formatDate\(item\.fim\) : "-"\s*\]\);\s*autoTable\(doc, \{\s*startY: currentY,\s*head: \[\["CÉLULA", "ETAPA \(ATIVIDADE\)", "DATA INÍCIO", "DATA FIM"\]\],', extras_repl, content, flags=re.DOTALL)

# Write back
with open('src/utils/exportPdf.ts', 'w') as f:
    f.write(content)
