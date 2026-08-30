// ATENCIÓN: Reemplaza estos valores con tus propias credenciales de Airtable.
// Cómo obtenerlos:
// 1. AIRTABLE_API_KEY (Personal Access Token):
//    - Ve a https://airtable.com/create/tokens
//    - Crea un nuevo token con los scopes: data.records:read, data.records:write, schema.bases:read
//    - Dale acceso a la base de datos correcta.
//    - El token empieza con "pat...".
// 2. AIRTABLE_BASE_ID:
//    - Abre tu base de Airtable.
//    - La URL será algo como https://airtable.com/appXXXXXXXXXXXXXX/
//    - El Base ID es la parte que empieza con "app...".

// FIX: Add explicit string types to prevent TypeScript from inferring too-narrow literal types,
// which causes comparison errors in other files when checking for placeholder values.
export const AIRTABLE_API_KEY: string = 'patIshtnXSDvL3yxP.d773df77e1dc5604c5af70e915f283123ab4fe1b4eb7a034480118ba8cea23d9';
export const AIRTABLE_BASE_ID: string = 'appjucmYXjnwIiUmD';
