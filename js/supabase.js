// CONFIGURACIÓN DE SUPABASE
// Reemplaza estos valores con los de TU proyecto
const SUPABASE_URL = grchvnewfkakaqfkgbzy // Tu Project URL aquí
const SUPABASE_KEY = sb_publishable_bQZ1guTH9D2ByDwgMYGLfQ_g7bIsktc  // Tu anon public key aquí

// Crear y exportar el cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

// Exportar para usar en otros archivos
window.supabaseClient = supabase
console.log('✅ Supabase configurado correctamente')