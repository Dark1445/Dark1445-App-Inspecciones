
// FIX: Imported PersonnelSector for better type safety and clarity.
import type { ToolDefinitions, PersonnelSector } from './types';

export const TOOL_DEFINITIONS: ToolDefinitions = {
    "Llave hidráulica": {
        "Llave 7.6-30": { partial: 6, full: 12 }, "Llave 5.5-15": { partial: 6, full: 12 },
        "Llave Eckel": { partial: 6, full: 12 }, "Llave 16-25": { partial: 6, full: 12 },
        "Llave 14-50": { partial: 6, full: 12 }, "Llave 24-50": { partial: 6, full: 12 },
        "Colgador Mecanico": { standard: 6 }, "Colgador Hidraulico": { standard: 6 }
    },
    "Handling tool": {
        "Spider": { partial: 6, full: 12, details: ["350 TN", "500 TN", "BJ", "VARCO"] },
        "FMS": { partial: 6, full: 12, details: ["375 TN", "275 TN"] },
        "Cuña Neumatica": { standard: 6, details: ["120 TN", "175 TN"] },
        "Cuña Manual": { standard: 6, details: ["3 cuerpos", "SMDXL"] },
        "Elevador YT": { standard: 6 }, "Elevador HYT": { standard: 6 }, "Elevador YC": { standard: 6 },
        "Elevador HYC": { standard: 6, details: ["150 TN", "200 TN"] },
        "Elevador SDE": { standard: 6, details: ["100 TN", "150 TN", "250 TN"] },
        "Elevador SJE": { standard: 6 }, "Collarin": { standard: 6 },
        "Amela": { standard: 6, details: ["Largas", "Extension"] }, "Bowl": { standard: 6 },
        "Llave Petol": { standard: 6, details: ["10-20H", "5-16"] }, "Llave HT": { standard: 6, details: ["HT-35", "HT-55"] }, "Swivel": { standard: 6 },
        "Slip Cuña": { standard: 6 }, "Slip Spider": { standard: 6 }, "Slip FMS": { standard: 6 }, "Slip Elevador": { standard: 6 }
    },
    "Bandeja": { "Bandeja": { standard: 12 } },
    "CRT": {
        "Elevador Hidraulico": { standard: 6, hasDetailField: true }, "Service Loop": { standard: 6 }, "Panel de control": { standard: 6 },
        "DTE": { partial: 6, full: 12 }, "TorkRunner": { partial: 6, full: 12 }, "DTI": { partial: 6, full: 12 }, "VOLANT": { partial: 6, full: 12 },
        "Xover": { standard: 6 }, "Link de Elevador": { standard: 6 }, "Campana": { standard: 6 },
        "Fill-up": { standard: 6 }, "Cabeza Elevadora": { standard: 6 }, "Pasteca": { standard: 6 },
        "Reaction Bracket": { standard: 6 }, "Slip DT": { standard: 6 }
    },
    "JAM": {
        "Torquimetro": { standard: 12, hasDetailField: true },
        "JAM PRO": { standard: 12, hasDetailField: true },
        "Celda Electronica": { standard: 12, hasDetailField: true }
    },
    "Fuente": {
        "Fuente Diesel": {},
        "Electrica": {}
    },
    "TEID": {
        "TEID": {}
    }
};

export const OPERADORAS = ["YPF", "Pampa Energia", "Pluspetrol", "Capex", "Shell", "Tecpetrol", "Total"];
export const SDE_DIAMETROS = ['2 3/8"', '2 7/8"', '3 1/2"', '4"', '4 1/2"', '5"', '5 1/2"', '7"', '7 5/8"', '9 5/8"'];
export const SDE_CAPACIDADES = ["100 TN", "150 TN", "250 TN"];
export const ESTADOS_OPERACION = ["Programada", "Operando", "En viaje a Locacion", "Regresando a Base", "Terminaron", "Op. Cancelada", "De espera en Loc."];
export const TIPOS_OPERACION = ["Llave", "Llave-Jam", "ODS", "Llave-ODS", "Volant", "Llave-Volant", "Llave-Volant-Jam", "Llave-BH"];
export const YACIMIENTOS = [
    "AGUA AMARGA", "AGUA DE AFUERA", "AGUA DEL CHAÑAR", "AGUADA AMARGA", "AGUADA BAGUALES", 
    "AGUADA BARROSA", "AGUADA CASTRO", "AGUADA CHIVATO", "AGUADA DE ABAJO", "AGUADA DEL CAJON", 
    "AGUADA DEL INDIO", "AGUADA DEL PONCHO", "AGUADA EL CAJON SALITRAL", "AGUADA EL CHAÑAR", 
    "AGUADA FEDERAL", "AGUADA LA ARENA", "AGUADA LOS LOROS", "AGUADA PICHANA", "AGUADA PICHANA NORTE", 
    "AGUADA SAN ROQUE", "AGUADA TOLEDO", "AGUILA MORA", "AL SUR DE LA DORSAL", "ALTO VERDE", 
    "ALTO VERDE NORTE", "AMARGA CHICA", "ANGOSTURA", "ANTICLINAL", "AUCA MAHUIDA", "BAJADA DE AÑELO",
    "BAJO DE LOS TOROS", "BANDURRIA", "BARDA GONZALES", "BARROSA", "BLANCO LOS OLIVOS", "BORDO COLORADO",
    "CENTRO OESTE", "CERRO ARENA", "CERRO BANDERA", "CHACHAHUEN", "CHAÑARES HERRADOS", "CHARCO BAYO",
    "CHIUUIDO DE LA SIERRA NEGRA", "COIRON AMARGO", "CONFLUENCIA", "CORCOVO", "CRUZ DE LORENA", 
    "EL CORCOVO", "EL MEDANITO", "ENTRE LOMAS", "ESTACION FERNANDEZ ORO", "FORTIN DE PIEDRA", 
    "JARILLA QUEMADA", "LA AMARGA CHICA", "LA CALERA", "LOMA CAMPANA", "LOMA LA LATA", "LOS TOLDOS",
    "MEDANITO", "NEUQUEN DEL MEDIO", "PASO DE LAS YEGUAS", "PUESTO HERNANDEZ", "RINCON DE LOS SAUCES",
    "SIERRA BLANCA", "VALLE AVANZADA VERDE", "VOLCAN AUCA MAHUIDA", "ZONA CENTRAL"
];

// FIX: Used the exported PersonnelSector type directly.
export const PERSONNEL_SECTORS: PersonnelSector[] = ['ODS', 'Convencional', 'Mantenimiento', 'Laboratorio', 'Jerarquico'];