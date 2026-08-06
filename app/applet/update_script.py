with open("src/utils/exportPdf.ts", "r", encoding="utf-8") as f:
    pdf = f.read()

# 1. Hide Prazo Contratual (Fator 1.25) - Editado if no edit
old_sidebar = """  const sidebarRows = [
    [{ content: "1. CONFIGURAÇÕES GERAIS", colSpan: 2, styles: { fillColor: [242, 242, 242], fontStyle: 'bold' } }],
    ["Código do Subprograma", codClean],
    ["Nome do Subprograma", subNameClean],
    ["Tipo de Avaliação do Subprograma", evaluationType === "somativa" ? "Somativa" : "Formativa"],
    ["Cenário Operacional (Geração de DVs)", activeScenario === "caed" ? "CAEd gera DVs" : "Gráfica gera DVs"],
    
    [{ content: "2. PARÂMETROS INICIAIS (ÂNCORAS)", colSpan: 2, styles: { fillColor: [242, 242, 242], fontStyle: 'bold' } }],
    ["Entrega nos Polos (Anchor)", formatDate(dataEntrega)],
    ["Prazo Contratual (Dias)", displayPrazoOriginal ? `${displayPrazoOriginal} dias` : "-"],
    ["Prazo Contratual (Fator 1.25)", displayFatorOriginal ? `${displayFatorOriginal} dias` : "-"],
    ["Prazo Contratual (Fator 1.25) - Editado", displayFatorEditado],
    
    [{ content: "3. CRITÉRIOS DE HABILITAÇÃO", colSpan: 2, styles: { fillColor: [242, 242, 242], fontStyle: 'bold' } }],
    ["CAEd APLICAÇÃO (EP05) (Ativa B5 e B9)", constaCaedAplicacao ? "Habilitado (Sim)" : "Desabilitado (Não)"],
    ["ESCRITA (Ativa B8)", possuiEscrita ? "Habilitado (Sim)" : "Desabilitado (Não)"],
    ["MATERIAIS IMPRESSOS (Ativa B14 e B20)", possuiMaterialImpresso ? "Habilitado (Sim)" : "Desabilitado (Não)"],
    
    [{ content: "4. CAMPOS DE PREENCHIMENTO DO SIDEBAR", colSpan: 2, styles: { fillColor: [242, 242, 242], fontStyle: 'bold' } }],
    ["Aplicação dos Cadernos (Início)", formatDate(b23ManualInicio)],
    ["Aplicação dos Cadernos (Fim)", formatDate(b23ManualFim)],
    ["Recolhimento nos Polos (Início)", desativadosOpcionais.B26 ? { content: "-", styles: { textColor: [160, 174, 192] } } : formatDate(b26ManualInicio)],
    ["Solicitação de Leiaute da Base Institucional", formatDate(b5ManualInicio)],
    
    [{ content: activeScenario === "caed" ? "5. FLUXO PRINCIPAL DE PRAZOS CAED (QUADROS)" : "5. FLUXO PRINCIPAL DE PRAZOS GRÁFICOS (QUADROS)", colSpan: 2, styles: { fillColor: [242, 242, 242], fontStyle: 'bold' } }],
    ["Recebimento de base com gordura", formatDate(activeScenario === "caed" ? calculosCaed.c1_limiteBaseDestaque : calculosGrafica.e1_limiteBaseDestaque)],
    ["Disponibilização dos itens de escrita antecipados", possuiEscrita ? formatDate(activeScenario === "caed" ? calculosCaed.c2_dispEscritaDestaque : calculosGrafica.e2_dispEscritaDestaque) : { content: "-", styles: { textColor: [160, 174, 192] } }]
  ];"""

new_sidebar = """  const hasFatorEditado = prazoComFatorEditado !== undefined && prazoComFatorEditado !== "" && displayFatorEditado !== "-";

  const sidebarRows: any[] = [
    [{ content: "1. CONFIGURAÇÕES GERAIS", colSpan: 2, styles: { fillColor: [242, 242, 242], fontStyle: 'bold' } }],
    ["Código do Subprograma", codClean],
    ["Nome do Subprograma", subNameClean],
    ["Tipo de Avaliação do Subprograma", evaluationType === "somativa" ? "Somativa" : "Formativa"],
    ["Cenário Operacional (Geração de DVs)", activeScenario === "caed" ? "CAEd gera DVs" : "Gráfica gera DVs"],
    
    [{ content: "2. PARÂMETROS INICIAIS (ÂNCORAS)", colSpan: 2, styles: { fillColor: [242, 242, 242], fontStyle: 'bold' } }],
    ["Entrega nos Polos (Anchor)", formatDate(dataEntrega)],
    ["Prazo Contratual (Dias)", displayPrazoOriginal ? `${displayPrazoOriginal} dias` : "-"],
    ["Prazo Contratual (Fator 1.25)", displayFatorOriginal ? `${displayFatorOriginal} dias` : "-"]
  ];

  if (hasFatorEditado) {
    sidebarRows.push(["Prazo Contratual (Fator 1.25) - Editado", displayFatorEditado]);
  }

  sidebarRows.push(
    [{ content: "3. CRITÉRIOS DE HABILITAÇÃO", colSpan: 2, styles: { fillColor: [242, 242, 242], fontStyle: 'bold' } }],
    ["CAEd APLICAÇÃO (EP05) (Ativa B5 e B9)", constaCaedAplicacao ? "Habilitado (Sim)" : "Desabilitado (Não)"],
    ["ESCRITA (Ativa B8)", possuiEscrita ? "Habilitado (Sim)" : "Desabilitado (Não)"],
    ["MATERIAIS IMPRESSOS (Ativa B14 e B20)", possuiMaterialImpresso ? "Habilitado (Sim)" : "Desabilitado (Não)"],
    
    [{ content: "4. CAMPOS DE PREENCHIMENTO DO SIDEBAR", colSpan: 2, styles: { fillColor: [242, 242, 242], fontStyle: 'bold' } }],
    ["Aplicação dos Cadernos (Início)", formatDate(b23ManualInicio)],
    ["Aplicação dos Cadernos (Fim)", formatDate(b23ManualFim)],
    ["Recolhimento nos Polos (Início)", desativadosOpcionais.B26 ? { content: "-", styles: { textColor: [160, 174, 192] } } : formatDate(b26ManualInicio)],
    ["Solicitação de Leiaute da Base Institucional", formatDate(b5ManualInicio)],
    
    [{ content: activeScenario === "caed" ? "5. FLUXO PRINCIPAL DE PRAZOS CAEd (QUADROS)" : "5. FLUXO PRINCIPAL DE PRAZOS GRÁFICOS (QUADROS)", colSpan: 2, styles: { fillColor: [242, 242, 242], fontStyle: 'bold' } }],
    ["Recebimento de base com gordura", formatDate(activeScenario === "caed" ? calculosCaed.c1_limiteBaseDestaque : calculosGrafica.e1_limiteBaseDestaque)],
    ["Disponibilização dos itens de escrita antecipados", possuiEscrita ? formatDate(activeScenario === "caed" ? calculosCaed.c2_dispEscritaDestaque : calculosGrafica.e2_dispEscritaDestaque) : { content: "-", styles: { textColor: [160, 174, 192] } }]
  );"""

assert old_sidebar in pdf, "old_sidebar not found!"
pdf = pdf.replace(old_sidebar, new_sidebar)

# 2. Font size reduction and header column names for PDF tables
pdf = pdf.replace("doc.setFontSize(16);", "doc.setFontSize(14);")
pdf = pdf.replace("doc.text('2. TABELA CAED E DATAS EXTRAS', 14, currentY);", "doc.text('2. TABELA CAEd E DATAS EXTRAS', 14, currentY);")

# Update table font size in styles
pdf = pdf.replace("fontSize: 10,\n      cellPadding: 1.5,", "fontSize: 8.5,\n      cellPadding: 1.2,")

# Headers
pdf = pdf.replace('const headerGrafica = ["CÓDIGO", "CÓD.", "ETAPA"];', 'const headerGrafica = ["", "CÓD.", "ETAPA"];')
pdf = pdf.replace('const headerCaed = ["CÓDIGO", "CÓD.", "ETAPA"];', 'const headerCaed = ["", "CÓD.", "ETAPA"];')
pdf = pdf.replace('const headerExtras = ["CÓDIGO", "CÓD.", "ETAPA"];', 'const headerExtras = ["", "CÓD.", "ETAPA"];')

# Column width adjustments
old_grafica_col = """    const pColStyles: any = {};
    pColStyles[0] = { cellWidth: 15, halign: 'center' };
    pColStyles[1] = { cellWidth: 18, halign: 'center' };
    
    if (modoEdicaoPrincipal) {
      if (ocultarCalculosPrincipal) {
        pColStyles[2] = { cellWidth: 89, halign: 'left' };
        pColStyles[3] = { cellWidth: 30, halign: 'center' };
        pColStyles[4] = { cellWidth: 30, halign: 'center' };
      } else {
        pColStyles[2] = { cellWidth: 49, halign: 'left' };
        pColStyles[3] = { cellWidth: 25, halign: 'center' };
        pColStyles[4] = { cellWidth: 25, halign: 'center' };
        pColStyles[5] = { cellWidth: 25, halign: 'center' };
        pColStyles[6] = { cellWidth: 25, halign: 'center' };
      }
    } else {
      pColStyles[2] = { cellWidth: 95, halign: 'left' };
      pColStyles[3] = { cellWidth: 27, halign: 'center' };
      pColStyles[4] = { cellWidth: 27, halign: 'center' };
    }"""

new_grafica_col = """    const pColStyles: any = {};
    pColStyles[0] = { cellWidth: 12, halign: 'center' };
    pColStyles[1] = { cellWidth: 15, halign: 'center' };
    
    if (modoEdicaoPrincipal) {
      if (ocultarCalculosPrincipal) {
        pColStyles[2] = { cellWidth: 95, halign: 'left' };
        pColStyles[3] = { cellWidth: 30, halign: 'center' };
        pColStyles[4] = { cellWidth: 30, halign: 'center' };
      } else {
        pColStyles[2] = { cellWidth: 55, halign: 'left' };
        pColStyles[3] = { cellWidth: 25, halign: 'center' };
        pColStyles[4] = { cellWidth: 25, halign: 'center' };
        pColStyles[5] = { cellWidth: 25, halign: 'center' };
        pColStyles[6] = { cellWidth: 25, halign: 'center' };
      }
    } else {
      pColStyles[2] = { cellWidth: 101, halign: 'left' };
      pColStyles[3] = { cellWidth: 27, halign: 'center' };
      pColStyles[4] = { cellWidth: 27, halign: 'center' };
    }"""

assert old_grafica_col in pdf, "old_grafica_col not found!"
pdf = pdf.replace(old_grafica_col, new_grafica_col)

old_caed_col = """    const pColStyles: any = {};
    pColStyles[0] = { cellWidth: 15, halign: 'center' };
    pColStyles[1] = { cellWidth: 18, halign: 'center' };
    
    if (modoEdicaoPrincipal) {
      if (ocultarCalculosPrincipal) {
        pColStyles[2] = { cellWidth: 117, halign: 'left' };
        pColStyles[3] = { cellWidth: 30, halign: 'center' };
      } else {
        pColStyles[2] = { cellWidth: 99, halign: 'left' };
        pColStyles[3] = { cellWidth: 25, halign: 'center' };
        pColStyles[4] = { cellWidth: 25, halign: 'center' };
      }
    } else {
      pColStyles[2] = { cellWidth: 122, halign: 'left' };
      pColStyles[3] = { cellWidth: 27, halign: 'center' };
    }"""

new_caed_col = """    const pColStyles: any = {};
    pColStyles[0] = { cellWidth: 12, halign: 'center' };
    pColStyles[1] = { cellWidth: 15, halign: 'center' };
    
    if (modoEdicaoPrincipal) {
      if (ocultarCalculosPrincipal) {
        pColStyles[2] = { cellWidth: 125, halign: 'left' };
        pColStyles[3] = { cellWidth: 30, halign: 'center' };
      } else {
        pColStyles[2] = { cellWidth: 105, halign: 'left' };
        pColStyles[3] = { cellWidth: 25, halign: 'center' };
        pColStyles[4] = { cellWidth: 25, halign: 'center' };
      }
    } else {
      pColStyles[2] = { cellWidth: 128, halign: 'left' };
      pColStyles[3] = { cellWidth: 27, halign: 'center' };
    }"""

assert old_caed_col in pdf, "old_caed_col not found!"
pdf = pdf.replace(old_caed_col, new_caed_col)

old_extras_col = """    const colStyles: any = {};
    colStyles[0] = { cellWidth: 15, halign: 'center' };
    colStyles[1] = { cellWidth: 18, halign: 'center' };
    
    if (modoEdicaoExtras) {
      if (ocultarCalculosExtras) {
        colStyles[2] = { cellWidth: 89, halign: 'left' };
        colStyles[3] = { cellWidth: 30, halign: 'center' };
        colStyles[4] = { cellWidth: 30, halign: 'center' };
      } else {
        colStyles[2] = { cellWidth: 49, halign: 'left' };
        colStyles[3] = { cellWidth: 25, halign: 'center' };
        colStyles[4] = { cellWidth: 25, halign: 'center' };
        colStyles[5] = { cellWidth: 25, halign: 'center' };
        colStyles[6] = { cellWidth: 25, halign: 'center' };
      }
    } else {
      colStyles[2] = { cellWidth: 95, halign: 'left' };
      colStyles[3] = { cellWidth: 27, halign: 'center' };
      colStyles[4] = { cellWidth: 27, halign: 'center' };
    }"""

new_extras_col = """    const colStyles: any = {};
    colStyles[0] = { cellWidth: 12, halign: 'center' };
    colStyles[1] = { cellWidth: 15, halign: 'center' };
    
    if (modoEdicaoExtras) {
      if (ocultarCalculosExtras) {
        colStyles[2] = { cellWidth: 95, halign: 'left' };
        colStyles[3] = { cellWidth: 30, halign: 'center' };
        colStyles[4] = { cellWidth: 30, halign: 'center' };
      } else {
        colStyles[2] = { cellWidth: 55, halign: 'left' };
        colStyles[3] = { cellWidth: 25, halign: 'center' };
        colStyles[4] = { cellWidth: 25, halign: 'center' };
        colStyles[5] = { cellWidth: 25, halign: 'center' };
        colStyles[6] = { cellWidth: 25, halign: 'center' };
      }
    } else {
      colStyles[2] = { cellWidth: 101, halign: 'left' };
      colStyles[3] = { cellWidth: 27, halign: 'center' };
      colStyles[4] = { cellWidth: 27, halign: 'center' };
    }"""

assert old_extras_col in pdf, "old_extras_col not found!"
pdf = pdf.replace(old_extras_col, new_extras_col)

with open("src/utils/exportPdf.ts", "w", encoding="utf-8") as f:
    f.write(pdf)

print("exportPdf.ts updated successfully!")
