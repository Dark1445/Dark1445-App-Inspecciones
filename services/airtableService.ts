
import type { Tool, Operation, Personnel, Course, User } from '../types';
import { calculateNextInspection, getStatus } from '../utils/dateUtils';
import { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } from '../config';

let base: any;

export const initializeAirtable = () => {
    if (AIRTABLE_API_KEY === 'REEMPLAZA_CON_TU_API_KEY' || AIRTABLE_BASE_ID === 'REEMPLAZA_CON_TU_BASE_ID') {
        throw new Error("Por favor, configura tu API Key y Base ID de Airtable en el archivo 'config.ts'.");
    }

    const Airtable = window.Airtable;
    if (!Airtable) {
        throw new Error("La librería de Airtable no se ha cargado correctamente.");
    }

    // Handle different ways the library might be exposed on the window object
    const AirtableConstructor = Airtable.default || Airtable;
    base = new AirtableConstructor({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
};

// --- Mappers ---
// Map data from Airtable record to our app's type
const mapToTool = (record: any): Tool => {
    const fields = record.fields;
    const toolData = {
        id: record.id,
        tipo: fields.tipo,
        herramienta: fields.herramienta,
        detalle: fields.detalle,
        serial: fields.serial,
        ultimaInspeccion: fields.ultimaInspeccion, // Expects YYYY-MM-DD
        tipoUltimaInspeccion: fields.tipoUltimaInspeccion,
        certificadoRef: fields.certificadoRef,
        notificationDays: fields.notificationDays,
        notificationEmails: fields.notificationEmails ? fields.notificationEmails.split(',').map((e:string) => e.trim()) : [],
    };
    const nextInspectionDate = calculateNextInspection(toolData);
    const status = getStatus(nextInspectionDate);
    return { ...toolData, nextInspectionDate, status };
};

// Map data from our app to Airtable record format
const mapFromTool = (tool: Partial<Omit<Tool, 'id' | 'nextInspectionDate' | 'status'>>) => {
    return {
        ...tool,
        notificationEmails: tool.notificationEmails?.join(', '),
    };
};

const mapToOperation = (record: any): Operation => {
    const fields = record.fields;
    return {
        id: record.id,
        equipo: fields.equipo,
        operadora: fields.operadora,
        diametro: fields.diametro,
        estado: fields.estado,
        tipoOperacion: fields.tipoOperacion,
        yacimiento: fields.yacimiento,
        fechaInicio: fields.fechaInicio,
        fechaFin: fields.fechaFin,
        solicitud: fields.solicitud,
        assignedTools: fields.assignedTools ? fields.assignedTools.split(',').map((id: string) => id.trim()) : [],
        createdAt: new Date(record.createdTime),
    };
};

const mapFromOperation = (operation: Partial<Operation>) => {
    const data: any = {...operation};
    delete data.id;
    delete data.createdAt;
    if (Array.isArray(data.assignedTools)) {
        data.assignedTools = data.assignedTools.join(', ');
    }
    return data;
};

// --- Generic Fetch/CRUD Functions ---
async function getAllRecords<T>(tableName: string, mapper: (record: any) => T): Promise<T[]> {
    if (!base) throw new Error("Airtable is not configured");
    const records = await base(tableName).select().all();
    return records.map(mapper);
}

async function createRecord<T>(tableName: string, data: T) {
    if (!base) throw new Error("Airtable is not configured");
    await base(tableName).create([{ fields: data }]);
}

async function updateRecord<T>(tableName: string, id: string, data: Partial<T>) {
    if (!base) throw new Error("Airtable is not configured");
    await base(tableName).update([{ id, fields: data }]);
}

async function deleteRecord(tableName: string, id: string) {
    if (!base) throw new Error("Airtable is not configured");
    await base(tableName).destroy([id]);
}

// --- Specific Implementations ---

// Tools
export const getTools = async (): Promise<Tool[]> => getAllRecords('Herramientas', mapToTool);
export const createTool = async (tool: any) => createRecord('Herramientas', mapFromTool(tool));
export const updateTool = async (id: string, tool: any) => updateRecord('Herramientas', id, mapFromTool(tool));
export const deleteTool = async (id: string) => deleteRecord('Herramientas', id);

// Operations
export const getOperations = async (): Promise<Operation[]> => getAllRecords('Operaciones', mapToOperation);
export const createOperation = async (op: any) => createRecord('Operaciones', mapFromOperation(op));
export const updateOperation = async (id: string, op: any) => updateRecord('Operaciones', id, mapFromOperation(op));
export const deleteOperation = async (id: string) => deleteRecord('Operaciones', id);

// Personnel
// FIX: Switched to explicit mapping for type safety and to include all fields.
const mapToPersonnel = (record: any): Personnel => {
    const fields = record.fields;
    return {
        id: record.id,
        firstName: fields.firstName,
        lastName: fields.lastName,
        dob: fields.dob,
        sector: fields.sector,
        diagramStartDate: fields.diagramStartDate,
        diagramType: fields.diagramType,
        courses: fields.courses ? JSON.parse(fields.courses) : [],
        events: fields.events ? JSON.parse(fields.events) : [],
    };
};
// FIX: Switched to explicit mapping to avoid sending extra properties like 'id' and to add diagramType logic.
const mapFromPersonnel = (p: Partial<Personnel>) => {
    const fields: any = {
        firstName: p.firstName,
        lastName: p.lastName,
        dob: p.dob,
        sector: p.sector,
        diagramStartDate: p.diagramStartDate,
        diagramType: p.diagramType,
        courses: JSON.stringify(p.courses || []),
        events: JSON.stringify(p.events || [])
    };
    if (p.sector !== 'Jerarquico') {
        fields.diagramType = null;
    }
    return fields;
};
export const getPersonnel = async (): Promise<Personnel[]> => getAllRecords('Personal', mapToPersonnel);
export const createPersonnel = async (p: any) => createRecord('Personal', mapFromPersonnel(p));
export const updatePersonnel = async (id: string, p: any) => updateRecord('Personal', id, mapFromPersonnel(p));
export const deletePersonnel = async (id: string) => deleteRecord('Personal', id);


// Courses
const mapToCourse = (record: any): Course => ({ id: record.id, ...record.fields });
export const getCourses = async (): Promise<Course[]> => getAllRecords('Cursos', mapToCourse);
export const createCourse = async (c: any) => createRecord('Cursos', { name: c.name, description: c.description });
export const updateCourse = async (id: string, c: any) => updateRecord('Cursos', id, { name: c.name, description: c.description });
export const deleteCourse = async (id: string) => deleteRecord('Cursos', id);


// Users
const mapToUser = (record: any): User => ({ id: record.id, ...record.fields });
export const getUsers = async (): Promise<User[]> => getAllRecords('Usuarios', mapToUser);
// Note: Create/Update/Delete for users can be added if needed
