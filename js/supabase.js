// supabase.js - CONFIGURACIÓN CORRECTA CON TU ANON KEY
const SUPABASE_URL = 'https://grchvnewfkakaqfkgbzy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyY2h2bmV3Zmtha2FxZmtnYnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMTk3NjAsImV4cCI6MjA4MTU5NTc2MH0.v8N-ATIXbR37rTNQ7KU9fW7e1_V-3neweTS6oljwciw';

// Crear cliente Supabase
let supabase;
try {
  if (window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = supabase;
    console.log('✅ Supabase configurado correctamente');
    console.log('🔗 URL:', SUPABASE_URL);
    console.log('🔑 Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');
  } else {
    console.error('❌ Error: La librería de Supabase no está cargada');
  }
} catch (error) {
  console.error('❌ Error creando cliente Supabase:', error);
}
