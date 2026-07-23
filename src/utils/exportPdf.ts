import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

export function exportToPdf({
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
  doc.text(`CÓD. SUBPROGRAMA: ${codClean} | NOME: ${subNameClean}`, 14, 21);

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
  doc.setFontSize(10);
  doc.text('1. RESUMO DOS PARÂMETROS E CONFIGURAÇÕES', 14, currentY);
  currentY += 4;

  const sidebarRows = [
    [{ content: "1. CONFIGURAÇÕES GERAIS", colSpan: 2, styles: { fillColor: [242, 242, 242], fontStyle: 'bold' } }],
    ["Código do Subprograma", codClean],
    ["Nome do Subprograma", subNameClean],
    ["Tipo de Avaliação do Subprograma", evaluationType === "somativa" ? "Somativa" : "Formativa"],
    ["Cenário Operacional (Geração de DVs)", activeScenario === "caed" ? "CAEd gera DVs" : "Gráfica gera DVs"],
    
    [{ content: "2. PARÂMETROS INICIAIS (ÂNCORAS)", colSpan: 2, styles: { fillColor: [242, 242, 242], fontStyle: 'bold' } }],
    ["Entrega nos Polos (Anchor)", formatDate(dataEntrega)],
    ["Prazo Contratual (Dias)", prazoContratual ? `${prazoContratual} dias` : "-"],
    ["Prazo Contratual Ajustado (Fator 1.25)", prazoContratual ? `${Math.ceil(Number(prazoContratual) * 1.25)} dias` : "-"],
    
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
    ["Limite Recebimento da Base", formatDate(activeScenario === "caed" ? calculosCaed.c1_limiteBaseDestaque : calculosGrafica.e1_limiteBaseDestaque)],
    ["Disponibilização de Escrita", possuiEscrita ? formatDate(activeScenario === "caed" ? calculosCaed.c2_dispEscritaDestaque : calculosGrafica.e2_dispEscritaDestaque) : { content: "-", styles: { textColor: [160, 174, 192] } }]
  ];

  autoTable(doc, {
    startY: currentY,
    body: sidebarRows as any[],
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 1.5,
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
    doc.setFontSize(10);
    doc.text('2. TABELA GRÁFICA E DATAS EXTRAS', 14, currentY);
    currentY += 4;

    const headerGrafica = ["CÓDIGO", "ETAPA"];
    if (!ocultarCalculosPrincipal) {
      headerGrafica.push("DATA INÍCIO", "DATA FIM");
    }
    if (modoEdicaoPrincipal) {
      headerGrafica.push("DATA INÍCIO (MANUAL)", "DATA FIM (MANUAL)");
    }

    const totalCols = 2 + (!ocultarCalculosPrincipal ? 2 : 0) + (modoEdicaoPrincipal ? 2 : 0);
    const rows: any[] = [];

    // 1) E-rows (E4 to E12)
    const eCells = ["E4", "E5", "E6", "E7", "E8", "E9", "E10", "E11", "E12"];
    eCells.forEach((cel) => {
      const isRowDisabled = cel === "E5" && !possuiEscrita;
      const celLower = cel.toLowerCase();
      
      const displayInicio = isRowDisabled ? "-" : formatDate(calculosGrafica[`${celLower}_inicio`]);
      const displayFim = isRowDisabled ? "-" : formatDate(calculosGrafica[celLower]);

      const manualInicio = isRowDisabled ? "-" : (datasManuaisPrincipal[`${cel}_inicio`] ? formatDate(datasManuaisPrincipal[`${cel}_inicio`]) : "-");
      const manualFim = isRowDisabled ? "-" : (datasManuaisPrincipal[cel] ? formatDate(datasManuaisPrincipal[cel]) : "-");

      const rowName = 
        cel === "E4" ? "Recebimento de base institucional (inegociável, sem gordura)" :
        cel === "E5" ? "Disponibilização dos itens de escrita antecipados" :
        cel === "E6" ? "Envio do arquivo de dados (.csv)" :
        cel === "E7" ? "Disponibilização dos cadernos de teste" :
        cel === "E8" ? "Envio dos arquivos para impressão" :
        cel === "E9" ? "Envio dos arquivos de dados variáveis (DVs)" :
        cel === "E10" ? "Validação dos arquivos de DVs" :
        cel === "E11" ? "Homologação dos arquivos de DVs" :
        cel === "E12" ? "Entrega dos materiais nos polos" : "";

      const rowData = [cel, rowName];
      if (!ocultarCalculosPrincipal) {
        rowData.push(displayInicio, displayFim);
      }
      if (modoEdicaoPrincipal) {
        rowData.push(manualInicio, manualFim);
      }
      rows.push(rowData);
    });

    // 3) B-rows (datasExtras)
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
      }

      let manualInicio = "-";
      let manualFim = "-";

      if (!isRowDisabled && !isFieldDeactivated) {
        manualInicio = datasManuaisExtras[row.celula]?.inicio ? formatDate(datasManuaisExtras[row.celula].inicio) : "-";
        manualFim = datasManuaisExtras[row.celula]?.fim ? formatDate(datasManuaisExtras[row.celula].fim) : "-";
      }

      const rowData = [row.celula, row.nome];
      if (!ocultarCalculosPrincipal) {
        rowData.push(displayInicio, displayFim);
      }
      if (modoEdicaoPrincipal) {
        rowData.push(manualInicio, manualFim);
      }
      rows.push(rowData);
    });

    const pColStyles: any = {};
    pColStyles[0] = { cellWidth: 18, halign: 'center' };
    
    if (modoEdicaoPrincipal) {
      if (ocultarCalculosPrincipal) {
        pColStyles[1] = { cellWidth: 104, halign: 'left' };
        pColStyles[2] = { cellWidth: 30, halign: 'center' };
        pColStyles[3] = { cellWidth: 30, halign: 'center' };
      } else {
        pColStyles[1] = { cellWidth: 64, halign: 'left' };
        pColStyles[2] = { cellWidth: 25, halign: 'center' };
        pColStyles[3] = { cellWidth: 25, halign: 'center' };
        pColStyles[4] = { cellWidth: 25, halign: 'center' };
        pColStyles[5] = { cellWidth: 25, halign: 'center' };
      }
    } else {
      pColStyles[1] = { cellWidth: 110, halign: 'left' };
      pColStyles[2] = { cellWidth: 27, halign: 'center' };
      pColStyles[3] = { cellWidth: 27, halign: 'center' };
    }

    autoTable(doc, {
      startY: currentY,
      head: [headerGrafica],
      body: rows,
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 1.5,
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
    doc.setFontSize(10);
    doc.text('2. TABELA CAED GERA DVS', 14, currentY);
    currentY += 4;

    const headerCaed = ["CÓDIGO", "ETAPA"];
    if (!ocultarCalculosPrincipal) {
      headerCaed.push("DATA PROGRAMADA");
    }
    if (modoEdicaoPrincipal) {
      headerCaed.push("DATA PROGRAMADA (MANUAL)");
    }

    const caedBody = [
      ["C4", "Recebimento de base institucional (inegociável, sem gordura)", formatDate(calculosCaed.c4), modoEdicaoPrincipal ? formatDate(datasManuaisPrincipal["C4"]) : null],
      ["C5", "Disponibilização dos itens de escrita antecipados", formatDate(calculosCaed.c5), modoEdicaoPrincipal ? formatDate(datasManuaisPrincipal["C5"]) : null],
      ["C6", "Envio dos arquivos de dados variáveis (DVs)", formatDate(calculosCaed.c6), modoEdicaoPrincipal ? formatDate(datasManuaisPrincipal["C6"]) : null],
      ["C7", "Disponibilização dos cadernos de teste", formatDate(calculosCaed.c7), modoEdicaoPrincipal ? formatDate(datasManuaisPrincipal["C7"]) : null],
      ["C8", "Homologação dos arquivos de DVs", formatDate(calculosCaed.c8), modoEdicaoPrincipal ? formatDate(datasManuaisPrincipal["C8"]) : null],
      ["C9", "Envio dos arquivos para impressão", formatDate(calculosCaed.c9), modoEdicaoPrincipal ? formatDate(datasManuaisPrincipal["C9"]) : null],
      ["C10", "Entrega dos materiais nos polos até:", formatDate(calculosCaed.entregaPolos), modoEdicaoPrincipal ? formatDate(datasManuaisPrincipal["C10"]) : null]
    ].map(row => {
      const id = row[0];
      const name = row[1];
      const calc = row[2];
      const manual = row[3];

      const mapped = [id, name];
      if (!ocultarCalculosPrincipal) {
        mapped.push(calc);
      }
      if (modoEdicaoPrincipal) {
        mapped.push(manual);
      }
      return mapped;
    });

    const pColStyles: any = {};
    pColStyles[0] = { cellWidth: 18, halign: 'center' };
    
    if (modoEdicaoPrincipal) {
      if (ocultarCalculosPrincipal) {
        pColStyles[1] = { cellWidth: 132, halign: 'left' };
        pColStyles[2] = { cellWidth: 30, halign: 'center' };
      } else {
        pColStyles[1] = { cellWidth: 114, halign: 'left' };
        pColStyles[2] = { cellWidth: 25, halign: 'center' };
        pColStyles[3] = { cellWidth: 25, halign: 'center' };
      }
    } else {
      pColStyles[1] = { cellWidth: 137, halign: 'left' };
      pColStyles[2] = { cellWidth: 27, halign: 'center' };
    }

    autoTable(doc, {
      startY: currentY,
      head: [headerCaed],
      body: caedBody,
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 1.5,
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
  if (activeScenario !== "grafica") {
    doc.addPage();
    currentY = 20;

    doc.setTextColor(30, 41, 59);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('3. DETALHAMENTO ADICIONAL DE ETAPAS', 14, currentY);
    currentY += 4;

    const headerExtras = ["CÓDIGO", "ETAPA"];
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

      if (modoEdicaoExtras) {
        if (ocultarCalculosExtras) {
          extrasRows.push([
            row.celula,
            row.nome,
            manualInicio,
            manualFim
          ]);
        } else {
          extrasRows.push([
            row.celula,
            row.nome,
            displayInicio,
            displayFim,
            manualInicio,
            manualFim
          ]);
        }
      } else {
        extrasRows.push([
          row.celula,
          row.nome,
          displayInicio,
          displayFim
        ]);
      }
    });

    const colStyles: any = {};
    colStyles[0] = { cellWidth: 18, halign: 'center' };
    
    if (modoEdicaoExtras) {
      if (ocultarCalculosExtras) {
        colStyles[1] = { cellWidth: 104, halign: 'left' };
        colStyles[2] = { cellWidth: 30, halign: 'center' };
        colStyles[3] = { cellWidth: 30, halign: 'center' };
      } else {
        colStyles[1] = { cellWidth: 64, halign: 'left' };
        colStyles[2] = { cellWidth: 25, halign: 'center' };
        colStyles[3] = { cellWidth: 25, halign: 'center' };
        colStyles[4] = { cellWidth: 25, halign: 'center' };
        colStyles[5] = { cellWidth: 25, halign: 'center' };
      }
    } else {
      colStyles[1] = { cellWidth: 110, halign: 'left' };
      colStyles[2] = { cellWidth: 27, halign: 'center' };
      colStyles[3] = { cellWidth: 27, halign: 'center' };
    }

    autoTable(doc, {
      startY: currentY,
      head: [headerExtras],
      body: extrasRows,
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 1.5,
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
    doc.text('Fundação CAEd - Planejamento Inicial', 14, 286);
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
