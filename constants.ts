
import type { Tool, Operation, Personnel, Course, User } from './types';
import { calculateNextInspection, getStatus } from './utils/dateUtils';

const createToolWithCalculatedFields = (toolData: Omit<Tool, 'nextInspectionDate' | 'status'>): Tool => {
  const nextInspectionDate = calculateNextInspection(toolData);
  const status = getStatus(nextInspectionDate);
  return { ...toolData, nextInspectionDate, status };
};

const today = new Date();
const lastMonth = new Date(today);
lastMonth.setMonth(today.getMonth() - 1);
const sixMonthsAgo = new Date(today);
sixMonthsAgo.setMonth(today.getMonth() - 6);
const expiredDate = new Date(today);
expiredDate.setMonth(today.getMonth() - 7);

export const INITIAL_TOOLS: Tool[] = [
    // FIX: Added missing 'certificadoRef' property to satisfy the Tool type.
    createToolWithCalculatedFields({ id: '1', tipo: 'Handling tool', herramienta: 'Spider', detalle: '500 TN', serial: 'SP-500-001', ultimaInspeccion: sixMonthsAgo.toISOString().split('T')[0], tipoUltimaInspeccion: 'Parcial', certificadoRef: 'REF-001', notificationDays: 15, notificationEmails: ['test@example.com'] }),
    // FIX: Added missing 'certificadoRef' property to satisfy the Tool type.
    createToolWithCalculatedFields({ id: '2', tipo: 'Handling tool', herramienta: 'Elevador HYC', detalle: '150 TN', serial: 'EHYC-150-002', ultimaInspeccion: lastMonth.toISOString().split('T')[0], tipoUltimaInspeccion: null, certificadoRef: 'REF-002' }),
    // FIX: Added missing 'detalle' and 'certificadoRef' properties to satisfy the Tool type.
    createToolWithCalculatedFields({ id: '3', tipo: 'Llave hidráulica', herramienta: 'Llave 7.6-30', detalle: '', serial: 'LH-7630-003', ultimaInspeccion: expiredDate.toISOString().split('T')[0], tipoUltimaInspeccion: 'Parcial', certificadoRef: 'REF-003' }),
    // FIX: Added missing 'detalle' and 'certificadoRef' properties to satisfy the Tool type.
    createToolWithCalculatedFields({ id: '4', tipo: 'CRT', herramienta: 'DTE', detalle: '', serial: 'CRT-DTE-004', ultimaInspeccion: sixMonthsAgo.toISOString().split('T')[0], tipoUltimaInspeccion: 'Full', certificadoRef: 'REF-004' }),
    // FIX: Added missing 'detalle' and 'certificadoRef' properties to satisfy the Tool type.
    createToolWithCalculatedFields({ id: '5', tipo: 'Bandeja', herramienta: 'Bandeja', detalle: '', serial: 'BAN-005', ultimaInspeccion: new Date(today.getFullYear(), today.getMonth() - 11, today.getDate()).toISOString().split('T')[0], tipoUltimaInspeccion: null, certificadoRef: 'REF-005' }),
];

export const INITIAL_OPERATIONS: Operation[] = [
    { 
        id: 'op1', 
        equipo: 'DLS-169', 
        operadora: 'YPF',
        diametro: '2 3/8',
        estado: 'Operando',
        tipoOperacion: 'Llave',
        yacimiento: 'AGUA AMARGA',
        fechaInicio: '2024-07-01',
        fechaFin: '2024-07-15',
        solicitud: 'SOL-2024-A1', 
        assignedTools: ['2'], 
        createdAt: new Date() 
    },
    { 
        id: 'op2', 
        equipo: 'PLUS-01', 
        operadora: 'Pampa Energia',
        diametro: '2 7/8',
        estado: 'Terminaron',
        tipoOperacion: 'Llave-Jam',
        yacimiento: 'AGUA DE AFUERA',
        fechaInicio: '2024-06-20',
        fechaFin: '2024-06-30',
        solicitud: 'SOL-2024-B2', 
        assignedTools: [], 
        createdAt: new Date() 
    },
];

export const INITIAL_COURSES: Course[] = [
    { id: 'c1', name: 'Autoelevador', description: 'Curso de manejo seguro de autoelevadores.' },
    { id: 'c2', name: 'Hidrogrúa', description: 'Operación y mantenimiento de hidrogrúas.' },
    { id: 'c3', name: 'Bandera', description: 'Curso de señalero de maniobras.' },
    { id: 'c4', name: 'Licencia de Conducir', description: 'Licencia nacional habilitante para vehículos de la empresa.' }
];

export const INITIAL_PERSONNEL: Personnel[] = [
    // Diagrama 1
    { id: 'p1', firstName: 'Marcelo', lastName: 'Fuentes', dob: '1990-01-01', sector: 'ODS', diagramStartDate: '2024-07-18', courses: [], events: [] },
    { id: 'p2', firstName: 'Giaquinto', lastName: 'Pablo', dob: '1990-01-01', sector: 'ODS', diagramStartDate: '2024-07-18', courses: [], events: [] },
    { id: 'p3', firstName: 'Guerra', lastName: 'Ruben', dob: '1990-01-01', sector: 'ODS', diagramStartDate: '2024-07-18', courses: [], events: [] },
    // Diagrama 2
    { id: 'p4', firstName: 'Andres', lastName: 'Teruel', dob: '1990-01-01', sector: 'Convencional', diagramStartDate: '2024-07-20', courses: [], events: [{ id: 'e1', type: 'Vacaciones', startDate: '2024-07-29', endDate: '2024-08-02' }] },
    { id: 'p5', firstName: 'Flores', lastName: 'Gabriel', dob: '1990-01-01', sector: 'Convencional', diagramStartDate: '2024-07-20', courses: [], events: [] },
    // Diagrama 3
    { id: 'p6', firstName: 'Rodrigo', lastName: 'Rebolledo', dob: '1990-01-01', sector: 'Mantenimiento', diagramStartDate: '2024-07-26', courses: [], events: [] },
    { id: 'p7', firstName: 'Soto', lastName: 'Azagra', dob: '1990-01-01', sector: 'Mantenimiento', diagramStartDate: '2024-07-26', courses: [], events: [] },
];

// Users for login
export const INITIAL_USERS: User[] = [
    { id: 'u1', username: 'admin', password: 'lara', role: 'Admin' },
    { id: 'u2', username: 'guest', password: 'guest', role: 'Invitado' },
];