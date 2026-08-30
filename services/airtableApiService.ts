
import type { Tool, Operation, Personnel, Course, User, Vehicle, VehicleType, VehicleNovedad } from '../types';
import { calculateNextInspection, getStatus, getDaysUntilExpiry, calculateToolInspections } from '../utils/dateUtils';
import { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } from '../config';

// --- Base Request Function ---
const airtableRequest = async (endpoint: string, options: RequestInit = {}) => {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${endpoint}`;
    const headers = {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
        let errorMessage = `Error: ${response.status} ${response.statusText}`;
        try {
            const errorData = await response.json();
            if (errorData.error) {
                errorMessage = `Error de Airtable: ${errorData.error.message || errorData.error.type}`;
            }
        } catch (e) {
            // Could not parse JSON error body
        }
        throw new Error(errorMessage);
    }
    // For DELETE requests which might not have a body
    if (response.status === 200 && options.method === 'DELETE') {
        return { success: true };
    }

    return response.json();
};


// --- Initialization and Connection Test ---
export const initializeAirtable = () => {
    if (!AIRTABLE_API_KEY || AIRTABLE_API_KEY === 'REEMPLAZA_CON_TU_API_KEY' || !AIRTABLE_BASE_ID || AIRTABLE_BASE_ID === 'REEMPLAZA_CON_TU_BASE_ID') {
        throw new Error("Por favor, configura tu API Key y Base ID de Airtable en el archivo 'config.ts'.");
    }
    // Validation of format
    if (!AIRTABLE_API_KEY.startsWith('pat')) {
        throw new Error("El formato de la API Key (Personal Access Token) es inválido. Debe comenzar con 'pat'.");
    }
     if (!AIRTABLE_BASE_ID.startsWith('app')) {
        throw new Error("El formato del Base ID es inválido. Debe comenzar con 'app'.");
    }
};

export const testAirtableConnection = async (): Promise<boolean> => {
    try {
        // Fetch just one record from a table to confirm connection and credentials.
        await airtableRequest('Herramientas?maxRecords=1&fields[]=serial');
        return true;
    } catch (error) {
        console.error("Prueba de conexión con Airtable fallida:", error);
        // We throw the error so App.tsx can catch the specific message
        if (error instanceof Error) {
           throw new Error(`Prueba de conexión fallida: ${error.message}`);
        }
        throw new Error('Prueba de conexión fallida por un error desconocido.');
    }
};


// --- Mappers ---
const mapToTool = (record: any): Tool => {
    const fields = record.fields;
    
    // Extract serialized partial/full inspection dates if they exist in certificadoRef
    const rawCert = fields.certificadoRef || '';
    let cleanCert = rawCert;
    let uip = '';
    let uif = '';
    let xoverPin = '';
    let xoverBox = '';
    let xoverLargo = '';
    let xoverCuelloPesca = false;
    let xoverPinInspected = false;
    let xoverBoxInspected = false;
    
    const uipMatch = rawCert.match(/\[UIP:([\d-]+)\]/);
    if (uipMatch) {
        uip = uipMatch[1];
        cleanCert = cleanCert.replace(/\[UIP:[\d-]+\]/g, '');
    }
    const uifMatch = rawCert.match(/\[UIF:([\d-]+)\]/);
    if (uifMatch) {
        uif = uifMatch[1];
        cleanCert = cleanCert.replace(/\[UIF:[\d-]+\]/g, '');
    }

    // Parse Xover specific fields
    const xpinMatch = rawCert.match(/\[XPIN:([^\]]*)\]/);
    if (xpinMatch) {
        xoverPin = xpinMatch[1];
        cleanCert = cleanCert.replace(/\[XPIN:[^\]]*\]/g, '');
    }
    const xboxMatch = rawCert.match(/\[XBOX:([^\]]*)\]/);
    if (xboxMatch) {
        xoverBox = xboxMatch[1];
        cleanCert = cleanCert.replace(/\[XBOX:[^\]]*\]/g, '');
    }
    const xlargoMatch = rawCert.match(/\[XLARGO:([^\]]*)\]/);
    if (xlargoMatch) {
        xoverLargo = xlargoMatch[1];
        cleanCert = cleanCert.replace(/\[XLARGO:[^\]]*\]/g, '');
    }
    const xcuelloMatch = rawCert.match(/\[XCUELLO:([01]+)\]/);
    if (xcuelloMatch) {
        xoverCuelloPesca = xcuelloMatch[1] === '1';
        cleanCert = cleanCert.replace(/\[XCUELLO:[01]+\]/g, '');
    }
    const xpininsMatch = rawCert.match(/\[XPININS:([01]+)\]/);
    if (xpininsMatch) {
        xoverPinInspected = xpininsMatch[1] === '1';
        cleanCert = cleanCert.replace(/\[XPININS:[01]+\]/g, '');
    }
    const xboxinsMatch = rawCert.match(/\[XBOXINS:([01]+)\]/);
    if (xboxinsMatch) {
        xoverBoxInspected = xboxinsMatch[1] === '1';
        cleanCert = cleanCert.replace(/\[XBOXINS:[01]+\]/g, '');
    }

    let reactionBracketOption: 'Paleta' | 'Cuerpo' | 'Brazo' | null = null;
    let cabezaElevadoraConexion = '';
    let sdeDiametro = '';
    let sdeCapacidad = '';

    const rbOptionMatch = rawCert.match(/\[RB_OPTION:([^\]]*)\]/);
    if (rbOptionMatch) {
        reactionBracketOption = rbOptionMatch[1] as any;
        cleanCert = cleanCert.replace(/\[RB_OPTION:[^\]]*\]/g, '');
    }
    const ceConexionMatch = rawCert.match(/\[CE_CONEXION:([^\]]*)\]/);
    if (ceConexionMatch) {
        cabezaElevadoraConexion = ceConexionMatch[1];
        cleanCert = cleanCert.replace(/\[CE_CONEXION:[^\]]*\]/g, '');
    }
    const sdeDiamMatch = rawCert.match(/\[SDE_DIAM:([^\]]*)\]/);
    if (sdeDiamMatch) {
        sdeDiametro = sdeDiamMatch[1];
        cleanCert = cleanCert.replace(/\[SDE_DIAM:[^\]]*\]/g, '');
    }
    const sdeCapMatch = rawCert.match(/\[SDE_CAP:([^\]]*)\]/);
    if (sdeCapMatch) {
        sdeCapacidad = sdeCapMatch[1];
        cleanCert = cleanCert.replace(/\[SDE_CAP:[^\]]*\]/g, '');
    }

    // Fallback extraction for Elevador SDE from detalle if tags were not present
    if (!sdeDiametro && (fields.herramienta === 'Elevador SDE') && fields.detalle) {
        const capMatch = fields.detalle.match(/(100\s*TN|150\s*TN|250\s*TN)/i);
        if (capMatch) {
            if (!sdeCapacidad) sdeCapacidad = capMatch[1].toUpperCase();
            const rest = fields.detalle.replace(capMatch[0], '').trim();
            if (rest) sdeDiametro = rest;
        } else if (!fields.detalle.toLowerCase().includes('tn')) {
            sdeDiametro = fields.detalle.trim();
        }
    }
    
    cleanCert = cleanCert.trim();

    const toolData: any = {
        id: record.id,
        tipo: fields.tipo || '',
        herramienta: fields.herramienta || '',
        detalle: fields.detalle || '',
        serial: fields.serial || '',
        ultimaInspeccion: fields.ultimaInspeccion || '',
        tipoUltimaInspeccion: fields.tipoUltimaInspeccion || null,
        certificadoRef: cleanCert,
        notificationDays: fields.notificationDays,
        notificationEmails: fields.notificationEmails ? fields.notificationEmails.split(',').map((e:string) => e.trim()) : [],
        ultimaInspeccionParcial: uip || undefined,
        ultimaInspeccionFull: uif || undefined,
        xoverPin: xoverPin || undefined,
        xoverBox: xoverBox || undefined,
        xoverLargo: xoverLargo || undefined,
        xoverCuelloPesca,
        xoverPinInspected,
        xoverBoxInspected,
        reactionBracketOption: reactionBracketOption || undefined,
        cabezaElevadoraConexion: cabezaElevadoraConexion || undefined,
        sdeDiametro: sdeDiametro || undefined,
        sdeCapacidad: sdeCapacidad || undefined,
    };

    const inspections = calculateToolInspections(toolData);
    
    return { 
        ...toolData, 
        ...inspections 
    };
};

const mapFromTool = (tool: Partial<Tool>) => {
    // Backwards-compatible inspection date determination
    let lastInspectionStr = tool.ultimaInspeccion || '';
    let lastInspectionType = tool.tipoUltimaInspeccion || null;
    
    if (tool.ultimaInspeccionParcial || tool.ultimaInspeccionFull) {
        if (tool.ultimaInspeccionParcial && tool.ultimaInspeccionFull) {
            const pDate = new Date(tool.ultimaInspeccionParcial + 'T00:00:00');
            const fDate = new Date(tool.ultimaInspeccionFull + 'T00:00:00');
            if (!isNaN(pDate.getTime()) && !isNaN(fDate.getTime())) {
                if (fDate >= pDate) {
                    lastInspectionStr = tool.ultimaInspeccionFull;
                    lastInspectionType = 'Full';
                } else {
                    lastInspectionStr = tool.ultimaInspeccionParcial;
                    lastInspectionType = 'Parcial';
                }
            }
        } else if (tool.ultimaInspeccionParcial) {
            lastInspectionStr = tool.ultimaInspeccionParcial;
            lastInspectionType = 'Parcial';
        } else if (tool.ultimaInspeccionFull) {
            lastInspectionStr = tool.ultimaInspeccionFull;
            lastInspectionType = 'Full';
        }
    }

    // Serialize dual dates and Xover fields into certificadoRef
    let serializedCert = (tool.certificadoRef || '')
        .replace(/\[UIP:[\d-]+\]/g, '')
        .replace(/\[UIF:[\d-]+\]/g, '')
        .replace(/\[XPIN:[^\]]*\]/g, '')
        .replace(/\[XBOX:[^\]]*\]/g, '')
        .replace(/\[XLARGO:[^\]]*\]/g, '')
        .replace(/\[XCUELLO:[01]+\]/g, '')
        .replace(/\[XPININS:[01]+\]/g, '')
        .replace(/\[XBOXINS:[01]+\]/g, '')
        .replace(/\[RB_OPTION:[^\]]*\]/g, '')
        .replace(/\[CE_CONEXION:[^\]]*\]/g, '')
        .replace(/\[SDE_DIAM:[^\]]*\]/g, '')
        .replace(/\[SDE_CAP:[^\]]*\]/g, '')
        .trim();
        
    if (tool.ultimaInspeccionParcial) {
        serializedCert += ` [UIP:${tool.ultimaInspeccionParcial}]`;
    }
    if (tool.ultimaInspeccionFull) {
        serializedCert += ` [UIF:${tool.ultimaInspeccionFull}]`;
    }
    if (tool.xoverPin) {
        serializedCert += ` [XPIN:${tool.xoverPin}]`;
    }
    if (tool.xoverBox) {
        serializedCert += ` [XBOX:${tool.xoverBox}]`;
    }
    if (tool.xoverLargo) {
        serializedCert += ` [XLARGO:${tool.xoverLargo}]`;
    }
    if (tool.xoverCuelloPesca !== undefined) {
        serializedCert += ` [XCUELLO:${tool.xoverCuelloPesca ? '1' : '0'}]`;
    }
    if (tool.xoverPinInspected !== undefined) {
        serializedCert += ` [XPININS:${tool.xoverPinInspected ? '1' : '0'}]`;
    }
    if (tool.xoverBoxInspected !== undefined) {
        serializedCert += ` [XBOXINS:${tool.xoverBoxInspected ? '1' : '0'}]`;
    }
    if (tool.reactionBracketOption) {
        serializedCert += ` [RB_OPTION:${tool.reactionBracketOption}]`;
    }
    if (tool.cabezaElevadoraConexion) {
        serializedCert += ` [CE_CONEXION:${tool.cabezaElevadoraConexion}]`;
    }
    if (tool.sdeDiametro) {
        serializedCert += ` [SDE_DIAM:${tool.sdeDiametro}]`;
    }
    if (tool.sdeCapacidad) {
        serializedCert += ` [SDE_CAP:${tool.sdeCapacidad}]`;
    }

    let calculatedDetalle = tool.detalle;
    if (tool.herramienta === 'Elevador SDE') {
        calculatedDetalle = tool.detalle || [tool.sdeDiametro, tool.sdeCapacidad].filter(Boolean).join(' ');
    }

    const fields: any = {
        tipo: tool.tipo,
        herramienta: tool.herramienta,
        detalle: calculatedDetalle,
        serial: tool.serial,
        ultimaInspeccion: lastInspectionStr || null,
        tipoUltimaInspeccion: lastInspectionType || null,
        certificadoRef: serializedCert,
        notificationDays: tool.notificationDays,
        notificationEmails: tool.notificationEmails,
    };
    
    if (fields.notificationEmails && Array.isArray(fields.notificationEmails)) {
        fields.notificationEmails = fields.notificationEmails.join(', ');
    }

    if (fields.notificationDays === undefined || fields.notificationDays === null || isNaN(parseInt(fields.notificationDays as string))) {
       fields.notificationDays = null;
    }
    
    return fields;
};

// FIX: Added 'buidsheet' and 'DT' fields to the operation mapper.
const mapToOperation = (record: any): Operation => {
    const fields = record.fields;
    return {
        id: record.id,
        equipo: fields.equipo || '',
        operadora: fields.operadora || '',
        diametro: fields.diametro || '',
        estado: fields.estado || '',
        tipoOperacion: fields.tipoOperacion || '',
        yacimiento: fields.yacimiento || '',
        fechaInicio: fields.fechaInicio || '',
        fechaFin: fields.fechaFin || '',
        solicitud: fields.solicitud || '',
        assignedTools: fields.assignedTools || [], // A "Link" field returns an array of IDs or is undefined
        createdAt: new Date(record.createdTime),
        buidsheet: fields.buidsheet || '',
        DT: fields.DT || '',
    };
};

// FIX: Added 'buidsheet' and 'DT' fields to the operation mapper.
const mapFromOperation = (operation: Partial<Operation>) => {
    const fields: any = {
        equipo: operation.equipo,
        operadora: operation.operadora,
        diametro: operation.diametro,
        estado: operation.estado,
        tipoOperacion: operation.tipoOperacion,
        yacimiento: operation.yacimiento,
        fechaInicio: operation.fechaInicio,
        fechaFin: operation.fechaFin,
        solicitud: operation.solicitud,
        assignedTools: operation.assignedTools, // Pass the array directly
        buidsheet: operation.buidsheet,
        DT: operation.DT,
    };
    
    if (!fields.fechaInicio) fields.fechaInicio = null;
    if (!fields.fechaFin) fields.fechaFin = null;

    return fields;
};

const mapToPersonnel = (record: any): Personnel => {
    const fields = record.fields;
    return {
        id: record.id,
        firstName: fields.firstName || '',
        lastName: fields.lastName || '',
        dob: fields.dob || '',
        sector: fields.sector || 'Mantenimiento',
        diagramStartDate: fields.diagramStartDate,
        diagramType: fields.diagramType,
        courses: fields.courses && typeof fields.courses === 'string' ? JSON.parse(fields.courses) : [],
        events: fields.events && typeof fields.events === 'string' ? JSON.parse(fields.events) : [],
    }
};

const mapFromPersonnel = (p: Partial<Personnel>) => {
    const fields: any = {
        firstName: p.firstName,
        lastName: p.lastName,
        dob: p.dob,
        sector: p.sector,
        diagramStartDate: p.diagramStartDate,
        diagramType: p.diagramType,
        courses: JSON.stringify(p.courses || []),
        events: JSON.stringify(p.events || []),
    };

    if (!fields.dob) fields.dob = null;
    if (!fields.diagramStartDate) fields.diagramStartDate = null;
    
    // Set diagramType to a default if Jerarquico and not set, otherwise null if not Jerarquico
    if (p.sector === 'Jerarquico') {
        fields.diagramType = p.diagramType || '10x5';
    } else {
        fields.diagramType = null;
    }
    
    return fields;
};

const mapToVehicle = (record: any): Vehicle => {
    const fields = record.fields;
    const vtvVencimientoDate = fields.vtvVencimiento ? new Date(fields.vtvVencimiento + 'T00:00:00') : null;
    const hidrogruaVencimientoDate = fields.vencimientoHidrogrua ? new Date(fields.vencimientoHidrogrua + 'T00:00:00') : null;
    
    return {
        id: record.id,
        numeroUnidad: fields.numeroUnidad || '',
        patente: fields.patente || '',
        tipo: fields.tipo || 'Pick up',
        ultimoServiceFecha: fields.ultimoServiceFecha || '',
        ultimoServiceKm: fields.ultimoServiceKm ?? null,
        vtvVencimiento: fields.vtvVencimiento || '',
        vtvStatus: getStatus(vtvVencimientoDate),
        vencimientoHidrogrua: fields.vencimientoHidrogrua || '',
        hidrogruaStatus: getStatus(hidrogruaVencimientoDate),
        novedades: [], // Will be populated separately or via link if configured
        ruedaAuxilio: fields.ruedaAuxilio === true || fields.ruedaAuxilio === 'true' || fields.RuedaAuxilio === true || fields['Rueda Auxilio'] === true,
    };
};

const mapFromVehicle = (vehicle: Partial<Vehicle>) => {
    const fields: any = {
        numeroUnidad: vehicle.numeroUnidad,
        patente: vehicle.patente,
        tipo: vehicle.tipo,
        ultimoServiceFecha: vehicle.ultimoServiceFecha || null,
        ultimoServiceKm: vehicle.ultimoServiceKm ?? null,
        vtvVencimiento: vehicle.vtvVencimiento || null,
        vencimientoHidrogrua: vehicle.vencimientoHidrogrua || null,
        ruedaAuxilio: vehicle.ruedaAuxilio || false,
    };
    // Ensure hidrogrua is only set for Camion
    if (vehicle.tipo !== 'Camion') {
        fields.vencimientoHidrogrua = null;
    }
    return fields;
};

const mapToVehicleNovedad = (record: any): VehicleNovedad => {
    const fields = record.fields;
    
    // Handle possible field name variations
    const vIdField = fields.vehicleId || fields.Vehiculo || fields.Vehiculos || fields.Unidad || fields['N° de Unidad'] || [];
    const vId = Array.isArray(vIdField) ? vIdField[0] : vIdField;

    return {
        id: record.id,
        vehicleId: vId || '',
        descripcion: fields.descripcion || fields.Descripcion || fields.Descripción || '',
        fechaCreacion: fields.fechaCreacion || fields.FechaCreacion || fields['Fecha Creacion'] || fields['Fecha de Creación'] || fields['Fecha de Creacion'] || '',
        fechaCierre: fields.fechaCierre || fields.FechaCierre || fields['Fecha Cierre'] || fields['Fecha de Cierre'] || '',
        estado: fields.estado || fields.Estado || 'Pendiente',
    };
};

const mapFromVehicleNovedad = (n: Partial<VehicleNovedad>) => {
    // We use the exact field names requested in the instructions, 
    // but if the user used different names, they might need to adjust them in Airtable.
    const fields: any = {
        vehicleId: n.vehicleId ? [n.vehicleId] : undefined,
        descripcion: n.descripcion,
        fechaCreacion: n.fechaCreacion,
        fechaCierre: n.fechaCierre || null,
        estado: n.estado,
    };
    return fields;
};

const mapToCourse = (record: any): Course => ({ id: record.id, name: record.fields.name || '', description: record.fields.description || '' });
const mapToUser = (record: any): User => ({ id: record.id, username: record.fields.username || '', password: record.fields.password || '', role: record.fields.role || 'Invitado' });


// --- Cache ---
const cache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 60000; // 1 minute

// --- Generic CRUD Functions ---
async function getAllRecords<T>(tableName: string, mapper: (record: any) => T): Promise<T[]> {
    if (cache[tableName] && (Date.now() - cache[tableName].timestamp < CACHE_TTL)) {
        return cache[tableName].data;
    }

    let allRawRecords: any[] = [];
    let offset: string | undefined;

    do {
        let endpoint = tableName;
        if (offset) {
            endpoint = `${tableName}?offset=${offset}`;
        }
        
        const data = await airtableRequest(endpoint);
        
        if (data.records) {
            allRawRecords = allRawRecords.concat(data.records);
        }
        
        offset = data.offset;

    } while (offset);

    const data = allRawRecords.map(mapper);
    cache[tableName] = { data, timestamp: Date.now() };
    return data;
}

async function createRecord<T>(tableName: string, data: any) {
    const response = await airtableRequest(tableName, { method: 'POST', body: JSON.stringify({ records: [{ fields: data }] }) });
    delete cache[tableName];
    return response;
}

async function updateRecord<T>(tableName: string, id: string, data: any) {
    const response = await airtableRequest(tableName, { method: 'PATCH', body: JSON.stringify({ records: [{ id, fields: data }] }) });
    delete cache[tableName];
    return response;
}

async function deleteRecord(tableName: string, id: string) {
    const response = await airtableRequest(`${tableName}?records[]=${id}`, { method: 'DELETE' });
    delete cache[tableName];
    return response;
}


// --- API Exports ---
export const getTools = async (): Promise<Tool[]> => getAllRecords('Herramientas', mapToTool);
export const createTool = async (tool: any) => createRecord('Herramientas', mapFromTool(tool));
export const updateTool = async (id: string, tool: any) => updateRecord('Herramientas', id, mapFromTool(tool));
export const deleteTool = async (id: string) => deleteRecord('Herramientas', id);

export const getOperations = async (): Promise<Operation[]> => getAllRecords('Operaciones', mapToOperation);
export const createOperation = async (op: any) => createRecord('Operaciones', mapFromOperation(op));
export const updateOperation = async (id: string, op: any) => updateRecord('Operaciones', id, mapFromOperation(op));
export const deleteOperation = async (id: string) => deleteRecord('Operaciones', id);

export const getPersonnel = async (): Promise<Personnel[]> => getAllRecords('Personal', mapToPersonnel);
export const createPersonnel = async (p: any) => createRecord('Personal', mapFromPersonnel(p));
export const updatePersonnel = async (id: string, p: any) => updateRecord('Personal', id, mapFromPersonnel(p));
export const deletePersonnel = async (id: string) => deleteRecord('Personal', id);

export const getCourses = async (): Promise<Course[]> => getAllRecords('Cursos', mapToCourse);
export const createCourse = async (c: any) => createRecord('Cursos', { name: c.name, description: c.description });
export const updateCourse = async (id: string, c: any) => updateRecord('Cursos', id, { name: c.name, description: c.description });
export const deleteCourse = async (id: string) => deleteRecord('Cursos', id);

export const getUsers = async (): Promise<User[]> => getAllRecords('Usuarios', mapToUser);
export const createUser = async (u: any) => createRecord('Usuarios', { username: u.username, password: u.password, role: u.role });
export const updateUser = async (id: string, u: any) => updateRecord('Usuarios', id, { username: u.username, password: u.password, role: u.role });
export const deleteUser = async (id: string) => deleteRecord('Usuarios', id);

export const getVehicles = async (): Promise<Vehicle[]> => {
    let vehicles: Vehicle[] = [];
    let novedades: VehicleNovedad[] = [];
    
    try {
        vehicles = await getAllRecords('Vehiculos', mapToVehicle);
    } catch (error) {
        throw error;
    }
    
    try {
        novedades = await getAllRecords('NovedadesVehiculos', mapToVehicleNovedad);
    } catch (error) {
        console.warn("Could not fetch NovedadesVehiculos. Table might not exist yet.");
    }
    
    return vehicles.map(v => ({
        ...v,
        novedades: novedades.filter(n => n.vehicleId === v.id)
    }));
};
export const createVehicle = async (v: any) => createRecord('Vehiculos', mapFromVehicle(v));
export const updateVehicle = async (id: string, v: any) => updateRecord('Vehiculos', id, mapFromVehicle(v));
export const deleteVehicle = async (id: string) => deleteRecord('Vehiculos', id);

export const getVehicleNovedades = async (vehicleId?: string): Promise<VehicleNovedad[]> => {
    const allNovedades = await getAllRecords('NovedadesVehiculos', mapToVehicleNovedad);
    if (vehicleId) {
        return allNovedades.filter(n => n.vehicleId === vehicleId);
    }
    return allNovedades;
};
export const createVehicleNovedad = async (n: Partial<VehicleNovedad>) => createRecord('NovedadesVehiculos', mapFromVehicleNovedad(n));
export const updateVehicleNovedad = async (id: string, n: Partial<VehicleNovedad>) => updateRecord('NovedadesVehiculos', id, mapFromVehicleNovedad(n));
export const deleteVehicleNovedad = async (id: string) => deleteRecord('NovedadesVehiculos', id);
