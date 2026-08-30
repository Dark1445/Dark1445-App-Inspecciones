
import React from 'react';

// For services/reportService.ts and services/airtableService.ts
declare global {
    interface Window {
        jspdf: any;
        Airtable: any;
    }
}

export type Role = 'Admin' | 'Invitado';

export interface Status {
    text: 'Vencida' | 'Por Vencer' | 'Vigente' | 'N/A';
    color: 'red' | 'yellow' | 'green' | 'gray';
}

export interface Tool {
    id: string;
    tipo: string;
    herramienta: string;
    detalle: string;
    serial: string;
    ultimaInspeccion: string; // YYYY-MM-DD
    tipoUltimaInspeccion: 'Parcial' | 'Full' | null;
    certificadoRef: string;
    notificationDays?: number;
    notificationEmails?: string[];
    nextInspectionDate: Date | null;
    status: Status;
    daysUntilExpiry?: number | null;
    ultimaInspeccionParcial?: string; // YYYY-MM-DD
    ultimaInspeccionFull?: string; // YYYY-MM-DD
    nextInspectionParcialDate?: Date | null;
    nextInspectionFullDate?: Date | null;
    daysUntilParcialExpiry?: number | null;
    daysUntilFullExpiry?: number | null;
    statusParcial?: Status;
    statusFull?: Status;
    xoverPin?: string;
    xoverBox?: string;
    xoverLargo?: string;
    xoverCuelloPesca?: boolean;
    xoverPinInspected?: boolean;
    xoverBoxInspected?: boolean;
    reactionBracketOption?: 'Paleta' | 'Cuerpo' | 'Brazo' | null;
    cabezaElevadoraConexion?: string;
    sdeDiametro?: string;
    sdeCapacidad?: string;
}

export interface Operation {
    id: string;
    equipo: string;
    operadora: string;
    diametro: string;
    estado: string;
    tipoOperacion: string;
    yacimiento: string;
    fechaInicio: string; // YYYY-MM-DD
    fechaFin: string; // YYYY-MM-DD
    solicitud: string;
    assignedTools: string[]; // array of tool IDs
    createdAt: Date;
    buidsheet?: string;
    DT?: string;
}

export type PersonnelEventType = 'Operación' | 'Vacaciones' | 'Compensatorio' | 'Enfermedad' | 'Franco';

export interface PersonnelEvent {
    id: string;
    type: Exclude<PersonnelEventType, 'Franco'>;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
}

export interface PersonnelCourse {
    courseId: string;
    issueDate: string; // YYYY-MM-DD
    expiryDate: string; // YYYY-MM-DD
}

export type PersonnelSector = 'ODS' | 'Convencional' | 'Mantenimiento' | 'Laboratorio' | 'Jerarquico';

export interface Personnel {
    id: string;
    firstName: string;
    lastName: string;
    dob: string; // YYYY-MM-DD
    sector: PersonnelSector;
    diagramStartDate?: string; // YYYY-MM-DD
    diagramType?: '10x5' | '5x2' | '8x4' | null;
    courses: PersonnelCourse[];
    events: PersonnelEvent[];
}

export interface Course {
    id: string;
    name: string;
    description: string;
}

export interface User {
    id: string;
    username: string;
    password?: string;
    role: Role;
}

export type VehicleType = 'Pick up' | 'Camion' | 'Van';

export interface VehicleNovedad {
    id: string;
    vehicleId: string;
    descripcion: string;
    fechaCreacion: string; // YYYY-MM-DD
    fechaCierre?: string; // YYYY-MM-DD
    estado: 'Pendiente' | 'Cerrado';
}

export interface Vehicle {
    id: string;
    numeroUnidad: string;
    patente: string;
    tipo: VehicleType;
    ultimoServiceFecha: string; // YYYY-MM-DD
    ultimoServiceKm: number | null;
    vtvVencimiento: string; // YYYY-MM-DD
    vtvStatus: Status;
    vencimientoHidrogrua?: string; // YYYY-MM-DD
    hidrogruaStatus?: Status;
    novedades?: VehicleNovedad[];
    ruedaAuxilio?: boolean;
}


export interface ToolDefinition {
    standard?: number; // months
    partial?: number; // months
    full?: number; // months
    details?: string[];
    hasDetailField?: boolean;
}

export interface ToolDefinitions {
    [tipo: string]: {
        [herramienta: string]: ToolDefinition;
    };
}