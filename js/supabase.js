// supabase.js - VERSIÓN CORREGIDA
(() => {
    'use strict';
    
    console.log('🔧 Inicializando Supabase...');
    
    const SUPABASE_URL = 'https://grchvnewfkakaqfkgbzy.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyY2h2bmV3Zmtha2FxZmtnYnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMTk3NjAsImV4cCI6MjA4MTU5NTc2MH0.v8N-ATIXbR37rTNQ7KU9W7e1_V-3neweTS6oljwciw';
    
    // Verificar si Supabase está disponible globalmente
    if (typeof supabase === 'undefined') {
        console.error('❌ Error: La librería de Supabase no está cargada');
        console.log('⚠️  Asegúrate de incluir este script en tu HTML:');
        console.log('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
        
        // Cliente de respaldo
        window.supabase = {
            _mode: 'error',
            auth: {
                getSession: () => Promise.resolve({ 
                    data: { session: null }, 
                    error: { message: 'Supabase no cargado' } 
                }),
                signOut: () => Promise.resolve({ error: null }),
                signUp: (credentials) => Promise.resolve({ 
                    data: { user: null, session: null }, 
                    error: { message: 'Supabase no cargado' }
                }),
                signInWithPassword: (credentials) => Promise.resolve({ 
                    data: { user: null, session: null }, 
                    error: { message: 'Supabase no cargado' }
                })
            },
            from: () => ({
                select: () => ({
                    eq: () => ({
                        or: () => Promise.resolve({ 
                            data: [], 
                            error: { message: 'Supabase no configurado' } 
                        })
                    }),
                    insert: () => Promise.resolve({ 
                        data: null, 
                        error: { message: 'Supabase no configurado' } 
                    })
                })
            })
        };
        return;
    }
    
    try {
        // Crear cliente con la configuración correcta
        const supabaseClient = supabase.createClient(
            SUPABASE_URL, 
            SUPABASE_ANON_KEY,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: false
                },
                db: {
                    schema: 'public'
                }
            }
        );
        
        // Asignar a window para acceso global
        window.supabase = supabaseClient;
        
        console.log('✅ Cliente Supabase creado exitosamente');
        console.log('🔗 URL:', SUPABASE_URL);
        
        // Probar conexión
        setTimeout(async () => {
            try {
                const { data, error } = await supabaseClient.auth.getSession();
                if (error) {
                    console.warn('⚠️ Advertencia sesión:', error.message);
                } else {
                    console.log('🔐 Estado sesión:', data.session ? 'Activa' : 'No activa');
                    
                    // Probar consulta a la base de datos
                    const { data: testData, error: testError } = await supabaseClient
                        .from('denuncias')
                        .select('count')
                        .limit(1);
                        
                    if (testError) {
                        console.warn('⚠️ Error consultando denuncias:', testError.message);
                    } else {
                        console.log('✅ Conexión a BD establecida');
                    }
                }
            } catch (err) {
                console.warn('⚠️ Error en prueba de conexión:', err.message);
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error crítico creando cliente:', error);
        
        // Datos de demo para modo fallback
        function getDatosDemo(table) {
            const datos = {
                'denuncias': [
                    {
                        id: 1001,
                        titulo: 'Bache peligroso en Av. El Sol',
                        descripcion: 'Bache de aproximadamente 50cm de diámetro',
                        categoria: 'Infraestructura',
                        estado: 'pendiente',
                        fecha_incidente: '2024-01-15',
                        creado_en: new Date().toISOString(),
                        tipo_formulario: 'reporte',
                        distrito: 'Cusco',
                        ubicacion: 'Av. El Sol 500',
                        es_anonimo: true,
                        prioridad: 'Alta'
                    },
                    {
                        id: 1002,
                        titulo: 'Mal estacionamiento en zona escolar',
                        descripcion: 'Vehículo obstruyendo entrada de colegio',
                        categoria: 'Tránsito',
                        estado: 'en_proceso',
                        fecha_incidente: '2024-01-10',
                        creado_en: new Date().toISOString(),
                        tipo_formulario: 'denuncia',
                        distrito: 'San Sebastián',
                        ubicacion: 'Calle Garcilaso 200',
                        placa_vehiculo: 'ABC-123',
                        es_anonimo: true,
                        prioridad: 'Media'
                    }
                ],
                'usuarios': [
                    {
                        id: 1,
                        email: 'demo@cusco.com',
                        nombre: 'Usuario Demo',
                        tipo_usuario: 'ciudadano'
                    }
                ]
            };
            return datos[table] || [];
        }
        
        // Cliente de respaldo
        window.supabase = {
            _mode: 'fallback',
            auth: {
                getSession: () => Promise.resolve({ 
                    data: { session: null }, 
                    error: null 
                }),
                signOut: () => Promise.resolve({ error: null }),
                signUp: (credentials) => Promise.resolve({ 
                    data: { 
                        user: { 
                            id: 999, 
                            email: credentials.email,
                            user_metadata: { nombre: credentials.nombre }
                        }, 
                        session: { 
                            access_token: 'demo-token',
                            user: { id: 999, email: credentials.email }
                        } 
                    }, 
                    error: null 
                }),
                signInWithPassword: (credentials) => Promise.resolve({ 
                    data: { 
                        user: { 
                            id: 999, 
                            email: credentials.email
                        }, 
                        session: { 
                            access_token: 'demo-token',
                            user: { id: 999, email: credentials.email }
                        } 
                    }, 
                    error: null 
                })
            },
            from: (table) => ({
                select: (columns = '*') => ({
                    eq: (col, val) => ({
                        or: () => Promise.resolve({ 
                            data: getDatosDemo(table).filter(item => item[col] === val), 
                            error: null 
                        })
                    }),
                    then: (callback) => {
                        const result = { data: getDatosDemo(table), error: null };
                        return Promise.resolve(result).then(callback);
                    }
                }),
                insert: (data) => Promise.resolve({ 
                    data: [{ id: Date.now(), ...data }], 
                    error: null 
                })
            }),
            storage: {
                from: () => ({
                    upload: () => Promise.resolve({ 
                        data: { path: 'demo-upload.jpg' }, 
                        error: null 
                    }),
                    getPublicUrl: () => ({ data: { publicUrl: 'https://demo.com/image.jpg' } })
                })
            }
        };
        
        console.log('🔄 Modo demo activado - Usando datos de ejemplo');
    }
})();