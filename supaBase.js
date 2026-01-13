// supaBase.js - en la RAÍZ del proyecto
(() => {
  console.log('🔧 Inicializando Supabase...');
  
  const SUPABASE_URL = 'https://grchvnewfkakaqfkgbzy.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyY2h2bmV3Zmtha2FxZmtnYnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMTk3NjAsImV4cCI6MjA4MTU5NTc2MH0.v8N-ATIXbR37rTNQ7KU9fW7e1_V-3neweTS6oljwciw';
  
  // Verificar CDN
  if (typeof supabase === 'undefined') {
    console.error('❌ CDN de Supabase no cargado');
    window.supabase = {
      _mode: 'error',
      error: 'CDN no cargado'
    };
    return;
  }
  
  try {
    // Crear cliente
    window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true }
    });
    
    console.log('✅ Supabase inicializado');
    
    // Probar conexión
    setTimeout(async () => {
      try {
        const { data, error } = await window.supabase.auth.getSession();
        if (error) console.warn('⚠️ Sesión:', error.message);
        else console.log('🔐 Sesión:', data.session ? 'Activa' : 'No activa');
      } catch (e) {}
    }, 500);
    
  } catch (error) {
    console.error('❌ Error:', error);
    window.supabase = { _mode: 'error', error: error.message };
  }
})();
