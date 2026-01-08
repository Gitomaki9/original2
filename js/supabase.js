// CONFIGURACIÓN DE SUPABASE
// ¡¡¡REEMPLAZA CON TUS CREDENCIALES EXACTAS!!!

// 1. URL COMPLETA con https://
const SUPABASE_URL = 'https://grchvnewfkakaqfkgbzy.supabase.co'

// 2. ANON KEY (la que empieza con eyJhbGciOiJ...)
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...TU_CLAVE_AQUI_COMPLETA...'

// 3. Crear cliente CORRECTAMENTE
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

// 4. Exportar para usar en otros archivos
window.supabaseClient = supabase

console.log('✅ Supabase configurado correctamente')
console.log('🔗 URL:', SUPABASE_URL)
console.log('🔑 Key (primeros 10):', SUPABASE_KEY.substring(0, 10) + '...')
