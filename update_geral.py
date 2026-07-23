import re

# Update PDF
with open('src/utils/exportPdf.ts', 'r') as f:
    pdf = f.read()

geral_pdf = """
  // --- CRONOGRAMA GERAL ---
  if (cronogramaGeral && cronogramaGeral.length > 0) {
    doc.addPage();
    currentY = 20;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('4. CRONOGRAMA GERAL (FLUXO UNIFICADO)', 14, currentY);
    currentY += 4;

    const hasManualGeral = Object.keys(datasManuaisGeral).length > 0;
    const geralHead = hasManualGeral
      ? [["Ref", "Seção / Atividade", "Responsável", "Data Início (CALC)", "Data Início (MANUAL)", "Data Fim (CALC)", "Data Fim (MANUAL)"]]
      : [["Ref", "Seção / Atividade", "Responsável", "Data Início", "Data Fim"]];

    const geralRows = cronogramaGeral.map(row => {
      let isDeactivated = false;
      const dependenteInativoB26 = row.dependenteB26 && desativadosOpcionais.B26;
      const dependenteInativoB20 = row.key === "B14" && desativadosOpcionais.B20;
      if ((row.key !== 'B21' && desativadosOpcionais[row.key]) || dependenteInativoB26 || dependenteInativoB20) {
        isDeactivated = true;
      }

      const nomeAtiv = row.atividade + (isDeactivated ? " (Desabilitado)" : "");
      const newRow = [
        row.codigo || row.key,
        nomeAtiv,
        row.responsavel,
        formatDate(row.dataInicio)
      ];
      if (hasManualGeral) newRow.push(formatDate(datasManuaisGeral[row.codigo]?.inicio));
      newRow.push(row.dataFim !== "-" ? formatDate(row.dataFim) : "-");
      if (hasManualGeral) newRow.push(row.dataFim !== "-" ? formatDate(datasManuaisGeral[row.codigo]?.fim) : "-");
      return newRow;
    });

    autoTable(doc, {
      startY: currentY,
      head: geralHead,
      body: geralRows,
      theme: 'plain',
      styles: {
        fontSize: 8,
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
      columnStyles: {
        0: { cellWidth: 15, fontStyle: 'bold' },
        1: { cellWidth: 80, halign: 'left' }
      }
    });
  }
"""

pdf = re.sub(r'doc\.save\(\`Cronograma.*?\.pdf\`\);', geral_pdf + r'\n  doc.save(`Cronograma_${nomeSubprograma || "Unnamed"}_${timestamp}.pdf`);', pdf)
with open('src/utils/exportPdf.ts', 'w') as f:
    f.write(pdf)

# Update XLSB
with open('src/utils/exportXlsb.ts', 'r') as f:
    xlsb = f.read()

param_match = re.search(r'datasManuaisGeral\?: Record<string, \{ inicio\?: string, fim\?: string \}>;', xlsb)
if param_match and 'cronogramaGeral?: any[];' not in xlsb:
    xlsb = xlsb.replace(
        'datasManuaisGeral?: Record<string, { inicio?: string, fim?: string }>;',
        'datasManuaisGeral?: Record<string, { inicio?: string, fim?: string }>;\n  cronogramaGeral?: any[];'
    )
    
export_match = re.search(r'datasManuaisGeral = \{\}', xlsb)
if export_match and 'cronogramaGeral = []' not in xlsb:
    xlsb = xlsb.replace(
        'datasManuaisGeral = {}',
        'datasManuaisGeral = {},\n  cronogramaGeral = []'
    )

geral_xlsb = """
  // --- SHEET 4: CRONOGRAMA GERAL ---
  if (cronogramaGeral && cronogramaGeral.length > 0) {
    const hasManualGeral = Object.keys(datasManuaisGeral).length > 0;
    const headerGeral = hasManualGeral
      ? ["Ref", "Seção / Atividade", "Responsável", "Data Início (CALC)", "Data Início (MANUAL)", "Data Fim (CALC)", "Data Fim (MANUAL)"]
      : ["Ref", "Seção / Atividade", "Responsável", "Data Início", "Data Fim"];

    const rowsGeral: any[] = [
      ["CRONOGRAMA GERAL (FLUXO UNIFICADO)", "", "", ""].concat(hasManualGeral ? ["", "", ""] : []),
      ["", "", "", ""].concat(hasManualGeral ? ["", "", ""] : []),
      headerGeral
    ];

    cronogramaGeral.forEach(row => {
      let isDeactivated = false;
      const dependenteInativoB26 = row.dependenteB26 && desativadosOpcionais.B26;
      const dependenteInativoB20 = row.key === "B14" && desativadosOpcionais.B20;
      if ((row.key !== 'B21' && desativadosOpcionais[row.key]) || dependenteInativoB26 || dependenteInativoB20) {
        isDeactivated = true;
      }
      const nomeAtiv = row.atividade + (isDeactivated ? " (Desabilitado)" : "");
      
      const newRow = [
        row.codigo || row.key,
        nomeAtiv,
        row.responsavel,
        formatDate(row.dataInicio),
        ...(hasManualGeral ? [formatDate(datasManuaisGeral[row.codigo]?.inicio)] : []),
        row.dataFim !== "-" ? formatDate(row.dataFim) : "-",
        ...(hasManualGeral ? [row.dataFim !== "-" ? formatDate(datasManuaisGeral[row.codigo]?.fim) : "-"] : [])
      ];
      rowsGeral.push(newRow);
    });

    const wsGeral = XLSX.utils.aoa_to_sheet(rowsGeral);
    applyStylesToSheet(wsGeral, {
      titleMergeRange: { s: { r: 0, c: 0 }, e: { r: 0, c: hasManualGeral ? 6 : 4 } },
      headerRowIndex: 2,
      colCount: hasManualGeral ? 7 : 5,
      colWidths: hasManualGeral 
        ? [{ wch: 10 }, { wch: 60 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }]
        : [{ wch: 10 }, { wch: 60 }, { wch: 20 }, { wch: 15 }, { wch: 15 }]
    });
    XLSX.utils.book_append_sheet(wb, wsGeral, "Cronograma Geral");
  }
"""

xlsb = re.sub(r'XLSX\.writeFile\(wb, \`Cronograma.*?.xlsb\`\);', geral_xlsb + r'\n  XLSX.writeFile(wb, `Cronograma_${nomeSubprograma || "Unnamed"}_${timestamp}.xlsb`);', xlsb)
with open('src/utils/exportXlsb.ts', 'w') as f:
    f.write(xlsb)
