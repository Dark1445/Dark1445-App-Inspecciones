
import type { Tool, Status, Personnel } from '../types';
import { TOOL_DEFINITIONS } from '../definitions';

export const calculateNextInspection = (tool: Omit<Tool, 'nextInspectionDate' | 'status'>): Date | null => {
    if (!tool.ultimaInspeccion) return null;
    const lastDate = new Date(tool.ultimaInspeccion + 'T00:00:00');
    if (isNaN(lastDate.getTime())) return null;

    const definition = TOOL_DEFINITIONS[tool.tipo]?.[tool.herramienta];
    if (!definition) return null;

    let monthsToAdd = 0;
    if (definition.standard) {
        monthsToAdd = definition.standard;
    } else if (definition.partial && definition.full) {
        monthsToAdd = tool.tipoUltimaInspeccion === 'Full' ? definition.full : definition.partial;
    }
    
    if (monthsToAdd > 0) {
        lastDate.setMonth(lastDate.getMonth() + monthsToAdd);
        return lastDate;
    }
    return null;
}

export const calculateToolInspections = (tool: any) => {
    const definition = TOOL_DEFINITIONS[tool.tipo]?.[tool.herramienta];
    
    let nextInspectionDate: Date | null = null;
    let nextInspectionParcialDate: Date | null = null;
    let nextInspectionFullDate: Date | null = null;
    
    let statusParcial = getStatus(null);
    let statusFull = getStatus(null);
    let daysUntilParcialExpiry: number | null = null;
    let daysUntilFullExpiry: number | null = null;
    
    if (definition) {
        if (definition.standard) {
            if (tool.ultimaInspeccion) {
                const lastDate = new Date(tool.ultimaInspeccion + 'T00:00:00');
                if (!isNaN(lastDate.getTime())) {
                    lastDate.setMonth(lastDate.getMonth() + definition.standard);
                    nextInspectionDate = lastDate;
                }
            }
        } else if (definition.partial && definition.full) {
            // It has partial and full!
            // First: Partial inspection next date
            const parDateStr = tool.ultimaInspeccionParcial || (tool.ultimaInspeccion && tool.tipoUltimaInspeccion === 'Parcial' ? tool.ultimaInspeccion : '');
            if (parDateStr) {
                const uDate = new Date(parDateStr + 'T00:00:00');
                if (!isNaN(uDate.getTime())) {
                    uDate.setMonth(uDate.getMonth() + definition.partial);
                    nextInspectionParcialDate = uDate;
                    statusParcial = getStatus(uDate);
                    daysUntilParcialExpiry = getDaysUntilExpiry(uDate);
                }
            }
            
            // Second: Full inspection next date
            const fullDateStr = tool.ultimaInspeccionFull || (tool.ultimaInspeccion && tool.tipoUltimaInspeccion === 'Full' ? tool.ultimaInspeccion : '');
            if (fullDateStr) {
                const uDate = new Date(fullDateStr + 'T00:00:00');
                if (!isNaN(uDate.getTime())) {
                    uDate.setMonth(uDate.getMonth() + definition.full);
                    nextInspectionFullDate = uDate;
                    statusFull = getStatus(uDate);
                    daysUntilFullExpiry = getDaysUntilExpiry(uDate);
                }
            }
            
            // Determine overall next inspection: whichever is earlier
            if (nextInspectionParcialDate && nextInspectionFullDate) {
                if (nextInspectionParcialDate < nextInspectionFullDate) {
                    nextInspectionDate = nextInspectionParcialDate;
                } else {
                    nextInspectionDate = nextInspectionFullDate;
                }
            } else {
                nextInspectionDate = nextInspectionParcialDate || nextInspectionFullDate || null;
            }
        }
    }
    
    const status = getStatus(nextInspectionDate);
    const daysUntilExpiry = getDaysUntilExpiry(nextInspectionDate);
    
    return {
        nextInspectionDate,
        nextInspectionParcialDate,
        nextInspectionFullDate,
        status,
        statusParcial,
        statusFull,
        daysUntilExpiry,
        daysUntilParcialExpiry,
        daysUntilFullExpiry
    };
};

export const getStatus = (nextInspectionDate: Date | null): Status => {
    if (!nextInspectionDate) return { text: 'N/A', color: 'gray' };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    thirtyDaysFromNow.setHours(0,0,0,0);
    
    if (nextInspectionDate < today) {
        return { text: 'Vencida', color: 'red' };
    } else if (nextInspectionDate <= thirtyDaysFromNow) {
        return { text: 'Por Vencer', color: 'yellow' };
    } else {
        return { text: 'Vigente', color: 'green' };
    }
}

export const getDaysUntilExpiry = (nextInspectionDate: Date | null): number | null => {
    if (!nextInspectionDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiryDate = new Date(nextInspectionDate);
    expiryDate.setHours(0, 0, 0, 0);

    if (expiryDate < today) return 0;
    
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

export const isNotificationActive = (tool: Tool): boolean => {
    // The bell is visually active if the tool's inspection is expired or expiring soon (within 30 days).
    return tool.status.text === 'Vencida' || tool.status.text === 'Por Vencer';
}

export const calculateAge = (dob: string): number | null => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return null;
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
};

export const calculateDiagramStatus = (startDateStr: string | undefined, diagramType?: Personnel['diagramType']): string => {
    if (!startDateStr) {
        return 'N/A';
    }

    const startDate = new Date(startDateStr + 'T00:00:00');
    if (isNaN(startDate.getTime())) {
        return 'Fecha Inválida';
    }

    let workDays = 10;
    let cycleLength = 15; // Default 10x5

    if (diagramType === '5x2') {
        workDays = 5;
        cycleLength = 7;
    } else if (diagramType === '8x4') {
        workDays = 8;
        cycleLength = 12;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const dayInCycle = (diffDays % cycleLength) + 1;

    if (dayInCycle <= workDays) {
        return `Día ${dayInCycle} de diagrama`;
    } else {
        return 'Franco';
    }
};

export const getDiagramDayStatus = (startDateStr: string | undefined, targetDate: Date, diagramType?: Personnel['diagramType']): 'Work' | 'Franco' | 'Invalid' | 'N/A' => {
    // 5x2 logic is independent of startDate
    if (diagramType === '5x2') {
        const dayOfWeek = targetDate.getDay(); // 0 is Sunday, 6 is Saturday
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return 'Franco';
        }
        return 'Work';
    }

    if (!startDateStr) {
        return 'N/A';
    }

    const startDate = new Date(startDateStr + 'T00:00:00');
    if (isNaN(startDate.getTime())) {
        return 'Invalid';
    }
    
    let workDays = 10;
    let cycleLength = 15; // Default 10x5

    if (diagramType === '8x4') {
        workDays = 8;
        cycleLength = 12;
    }

    const currentTargetDate = new Date(targetDate);
    currentTargetDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);

    const diffTime = currentTargetDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const dayInCycle = (((diffDays % cycleLength) + cycleLength) % cycleLength) + 1;

    if (dayInCycle <= workDays) {
        return 'Work';
    } else {
        return 'Franco';
    }
};

export const getPersonnelCourseStatus = (personnel: Personnel): Status => {
    if (!personnel.courses || personnel.courses.length === 0) {
        return { text: 'Vigente', color: 'green' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    thirtyDaysFromNow.setHours(0, 0, 0, 0);

    let isExpiringSoon = false;

    for (const course of personnel.courses) {
        if (!course.expiryDate) continue;
        const expiryDate = new Date(course.expiryDate + 'T00:00:00');
        if (isNaN(expiryDate.getTime())) continue;

        if (expiryDate < today) {
            return { text: 'Vencida', color: 'red' }; // Most urgent
        }

        if (expiryDate <= thirtyDaysFromNow) {
            isExpiringSoon = true;
        }
    }

    if (isExpiringSoon) {
        return { text: 'Por Vencer', color: 'yellow' };
    }

    return { text: 'Vigente', color: 'green' };
};
