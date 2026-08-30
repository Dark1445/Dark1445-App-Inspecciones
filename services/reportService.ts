
import type { Tool, Operation, Personnel } from '../types';

export type ReportSortOption = 'status' | 'tipo' | 'herramienta' | 'informe-categorizado';

export const generateCategorizedReport = (tools: Tool[]) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const reportDate = new Date().toLocaleDateString('es-ES');
    const criticalTools = tools.filter(tool => tool.status.text === 'Vencida' || tool.status.text === 'Por Vencer');

    const categories: { [key: string]: string[] } = {
        'Mantenimiento': ['Llave 7.6-30', 'Llave 5.5-15', 'Llave Eckel', 'Llave 16-25'],
        'Handling Tools': ['Spider', 'Cuña Neumatica', 'Cuña Manual', 'Elevador YT', 'Elevador HYT', 'Elevador YC', 'Elevador HYC', 'Elevador SDE', 'Elevador SJE', 'Collarin', 'Amela', 'Bowl', 'Llave Petol', 'Swivel', 'Slip Cuña', 'Slip Spider', 'Slip Elevador', 'Colgador Mecanico', 'Colgador Hidraulico'],
        'CRT': ['Elevador Hidraulico', 'Service Loop', 'Panel de control', 'DTE', 'DTI', 'VOLANT', 'Xover', 'Link de Elevador', 'Campana', 'Fill-up', 'Cabeza Elevadora', 'Pasteca', 'Reaction Bracket', 'Slip DT']
    };

    let firstPage = true;

    for (const [title, toolNames] of Object.entries(categories)) {
        const filtered = criticalTools.filter(t => toolNames.includes(t.herramienta));
        if (filtered.length === 0) continue;

        if (!firstPage) {
            doc.addPage();
        }
        firstPage = false;

        doc.setFontSize(18);
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.text(`Titulo ${title} (inspecciones por vencer y vencidas)`, 14, 25);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        
        const sortedFiltered = [...filtered].sort((a, b) => {
            const typeCompare = (a.tipo || '').localeCompare(b.tipo || '');
            if (typeCompare !== 0) return typeCompare;
            const toolCompare = (a.herramienta || '').localeCompare(b.herramienta || '');
            if (toolCompare !== 0) return toolCompare;
            return (a.serial || '').localeCompare(b.serial || '');
        });

        const tableColumn = ["Tipo", "Herramienta", "Serial", "Estado", "Fecha de Vencimiento"];
        const tableRows = sortedFiltered.map(tool => [
            tool.tipo || 'N/A',
            `${tool.herramienta} ${tool.detalle || ''}`.trim(),
            tool.serial,
            tool.status.text,
            tool.nextInspectionDate ? tool.nextInspectionDate.toLocaleDateString('es-ES') : 'N/A'
        ]);

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 35,
            theme: 'grid',
            headStyles: { fillColor: [22, 160, 133] },
        });
    }

    doc.save(`informe_categorizado_${reportDate.replace(/\//g, '-')}.pdf`);
};

export const generatePDFReport = (tools: Tool[], sortBy: ReportSortOption = 'status') => {
    if (sortBy === 'informe-categorizado') {
        generateCategorizedReport(tools);
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let toolsToReport: Tool[] = [];
    let reportTitle: string = "Informe de Inspecciones";
    
    const criticalTools = tools.filter(tool => tool.status.text === 'Vencida' || tool.status.text === 'Por Vencer');

    switch (sortBy) {
        case 'tipo':
            reportTitle = "Informe por Tipo (Vencidas y Por Vencer)";
            toolsToReport = [...criticalTools].sort((a, b) => {
                const typeCompare = a.tipo.localeCompare(b.tipo);
                if (typeCompare !== 0) return typeCompare;
                const toolNameCompare = a.herramienta.localeCompare(b.herramienta);
                if (toolNameCompare !== 0) return toolNameCompare;
                return a.serial.localeCompare(b.serial);
            });
            break;
        
        case 'herramienta':
            reportTitle = "Informe por Nombre (Vencidas y Por Vencer)";
            toolsToReport = [...criticalTools].sort((a, b) => {
                const toolNameCompare = a.herramienta.localeCompare(b.herramienta);
                if (toolNameCompare !== 0) return toolNameCompare;
                return a.serial.localeCompare(b.serial);
            });
            break;
            
        case 'status':
        default:
            reportTitle = "Informe de Herramientas Vencidas y Por Vencer";
            toolsToReport = criticalTools;
            const statusOrder: { [key: string]: number } = { 'Vencida': 1, 'Por Vencer': 2 };
            toolsToReport.sort((a, b) => {
                const orderA = statusOrder[a.status.text] || 3;
                const orderB = statusOrder[b.status.text] || 3;
                if (orderA !== orderB) return orderA - orderB;
                const dateA = a.nextInspectionDate?.getTime() || 0;
                const dateB = b.nextInspectionDate?.getTime() || 0;
                return dateA - dateB;
            });
            break;
    }

    if (toolsToReport.length === 0) {
        alert("No hay herramientas para incluir en este tipo de informe.");
        return;
    }

    const tableColumn = ["Herramienta", "Serial", "Estado", "Fecha de Vencimiento"];
    const tableRows = toolsToReport.map(tool => [
        `${tool.herramienta} ${tool.detalle || ''}`.trim(),
        tool.serial,
        tool.status.text,
        tool.nextInspectionDate ? tool.nextInspectionDate.toLocaleDateString('es-ES') : 'N/A'
    ]);
    
    const reportDate = new Date().toLocaleDateString('es-ES');

    // Using declare to assert the type of autoTable
    (doc as any).autoTable({ 
        head: [tableColumn], 
        body: tableRows, 
        startY: 35,
        margin: { top: 35 }, // Ensures header margin is applied to all pages
        theme: 'grid', 
        headStyles: { fillColor: [22, 160, 133] },
        didDrawPage: (data: any) => {
            // Header for every page
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Fecha: ${reportDate}`, 14, 15);
            
            doc.setFontSize(18);
            doc.setTextColor(0);
            doc.setFont('helvetica', 'bold');
            doc.text(reportTitle, 14, 25);
            
            // Optional: Footer with page number
            const str = "Página " + doc.internal.getNumberOfPages();
            doc.setFontSize(10);
            doc.setTextColor(150);
            const pageSize = doc.internal.pageSize;
            const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
            doc.text(str, data.settings.margin.left, pageHeight - 10);
        }
    });
    
    const safeTitle = reportTitle.replace(/ /g, '_').toLowerCase();
    doc.save(`${safeTitle}_${reportDate.replace(/\//g, '-')}.pdf`);
};

export const generateOperationsReport = (operations: Operation[], tools: Tool[]) => {
    const { jsPDF } = window.jspdf;
    // Create landscale document
    const doc = new jsPDF('l', 'mm', 'a4');
    const reportDate = new Date().toLocaleDateString('es-ES');
    
    // Title & Info
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59); // Crisp dark theme slate
    doc.setFont('helvetica', 'bold');
    doc.text("Resumen - Control de Operaciones", 14, 18);
    
    // Calculate grand total of tools to display here securely
    const totalToolsInUse = operations.reduce((sum, op) => sum + op.assignedTools.length, 0);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Fecha de generación: ${reportDate}  |  Total de Equipos Activos: ${operations.length}  |  Total General de Herramientas en Uso: ${totalToolsInUse}`, 14, 25);

    if (operations.length === 0) {
        doc.setFontSize(12);
        doc.setTextColor(150);
        doc.text("No hay operaciones disponibles para reportar.", 14, 40);
        doc.save(`informe_operaciones_${reportDate.replace(/\//g, '-')}.pdf`);
        return;
    }

    // 1. Columns headers: "DESCRIPCIÓN" followed by active operation equipos, and a "TOTAL GENERAL" column
    const headers = ["DESCRIPCIÓN", ...operations.map(op => op.diametro ? `${op.equipo} (${op.diametro})` : op.equipo), "TOTAL GENERAL"];

    // 2. Identify all unique tool names (herramientas) currently assigned to ANY operation
    // This makes the matrix dense and relevant.
    const assignedToolsSet = new Set<string>();
    operations.forEach(op => {
        op.assignedTools.forEach(toolId => {
            const tool = tools.find(t => t.id === toolId);
            if (tool && tool.herramienta) {
                assignedToolsSet.add(tool.herramienta);
            }
        });
    });

    const uniqueToolNames = Array.from(assignedToolsSet).sort();

    // 3. Populate rows
    const tableRows: any[][] = [];

    uniqueToolNames.forEach(toolName => {
        const row = [toolName];
        let toolRowTotal = 0;
        operations.forEach(op => {
            // Count tools of this name assigned to this operation
            const count = op.assignedTools.filter(toolId => {
                const t = tools.find(x => x.id === toolId);
                return t && t.herramienta === toolName;
            }).length;
            
            toolRowTotal += count;
            row.push(count > 0 ? count.toString() : "");
        });
        row.push(toolRowTotal.toString()); // Total for this tool across all equipment
        tableRows.push(row);
    });

    // 4. Create footer (Gt / Subtotal row)
    const footerRow = ["Subtotal por Equipo"];
    let grandTotal = 0;
    operations.forEach(op => {
        footerRow.push(op.assignedTools.length.toString());
        grandTotal += op.assignedTools.length;
    });
    footerRow.push(grandTotal.toString()); // Grand total at the intersection of bottom-right

    // 5. Generate the autoTable
    (doc as any).autoTable({
        head: [headers],
        body: tableRows,
        foot: [footerRow],
        startY: 35,
        theme: 'grid',
        headStyles: { 
            fillColor: [30, 41, 59], // Dark slate theme
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            0: { halign: 'left', fontStyle: 'bold' } // Description left-aligned & bold
        },
        bodyStyles: {
            halign: 'center'
        },
        footStyles: {
            fillColor: [241, 245, 249], // soft slate/gray footer matching image
            textColor: [15, 23, 42],
            fontStyle: 'bold',
            halign: 'center'
        },
        styles: {
            fontSize: 9,
            cellPadding: 3
        },
        didDrawPage: (data: any) => {
            // Optional footer with page number
            const str = "Página " + doc.internal.getNumberOfPages();
            doc.setFontSize(9);
            doc.setTextColor(150);
            const pageSize = doc.internal.pageSize;
            const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
            doc.text(str, data.settings.margin.left, pageHeight - 10);
        }
    });

    doc.save(`informe_operaciones_${reportDate.replace(/\//g, '-')}.pdf`);
};


