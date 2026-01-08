// supabase.js - VERSIÓN 100% FUNCIONAL
(() => {
    'use strict';
    
    const SUPABASE_URL = 'https://grchvnewfkakaqfkgbzy.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyY2h2bmV3Zmtha2FxZktnYnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMTk3NjAsImV4cCI6MjA4MTU5NTc2MH0.v8N-ATIXbR37rTNQ7KU9fW7e1_V-3neweTS6oljwciw';
    
    // Verificar que la librería esté cargada
    if (typeof supabase === 'undefined') {
        console.error('❌ Error: La librería de Supabase no está cargada');
        console.log('💡 Solución: Asegúrate de incluir este script ANTES de supabase.js:');
        console.log('💡 <script src="https://unpkg.com/@supabase/supabase-js@2"></script>');
        return;
    }
    
    try {
        // Crear cliente Supabase CORRECTAMENTE
        const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true
            }
        });
        
        // Asignar a window para uso global
        window.supabaseClient = supabaseClient;
        window.supabase = supabaseClient; // También como alias
        
        console.log('✅ Supabase configurado correctamente');
        console.log('🔗 URL:', SUPABASE_URL);
        console.log('🔑 Key (primeros 20):', SUPABASE_ANON_KEY.substring(0, 20) + '...');
        
        // Probar conexión inmediatamente
        supabaseClient.auth.getSession().then(({ data, error }) => {
            if (error) {
                console.warn('⚠️ Error probando sesión:', error.message);
            } else {
                console.log('🔐 Sesión:', data.session ? 'Activa' : 'No activa');
            }
        });
        
    } catch (error) {
        console.error('❌ Error fatal creando cliente Supabase:', error);
    }
})();
