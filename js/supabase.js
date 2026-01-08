// supabase.js - VERSIÓN MEJORADA CON MANEJO DE ERRORES
(() => {
    'use strict';
    
    console.log('🔧 Inicializando Supabase...');
    
    const SUPABASE_URL = 'https://grchvnewfkakaqfkgbzy.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyY2h2bmV3Zmtha2FxZmtnYnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMTk3NjAsImV4cCI6MjA4MTU5NTc2MH0.v8N-ATIXbR37rTNQ7KU9fW7e1_V-3neweTS6oljwciw';
    
    // Verificar si Supabase está cargado
    if (typeof createCLient === 'undefined') {
        console.error('❌ Error: La librería de Supabase no está cargada');
        window.supabaseClient = {
            _mode: 'error',
            auth: {
                getSession: () => Promise.resolve({ 
                    data: { session: null }, 
                    error: { message: 'Supabase no cargado' } 
                }),
                signOut: () => Promise.resolve({ error: null })
            },
            from: () => ({
                select: () => Promise.resolve({ 
                    data: [], 
                    error: { message: 'Supabase no configurado' } 
                })
            })
        };
        return;
    }
    
    try {
        // Crear cliente con configuración robusta
        const supabaseClient = supabase.createClient(
            SUPABASE_URL, 
            SUPABASE_ANON_KEY,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: false
                },
                global: {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                    }
                },
                db: {
                    schema: 'public'
                }
            }
        );
        
        // Asignar a window
        window.supabaseClient = supabaseClient;
        window.supabase = supabaseClient; // Alias por compatibilidad
        
        console.log('✅ Cliente Supabase creado');
        console.log('🔗 URL:', SUPABASE_URL);
        
        // Probar conexión silenciosamente
        setTimeout(() => {
            supabaseClient.auth.getSession()
                .then(({ data, error }) => {
                    if (error) {
                        console.warn('⚠️ Advertencia sesión:', error.message);
                    } else {
                        console.log('🔐 Estado sesión:', data.session ? 'Activa' : 'No activa');
                    }
                })
                .catch(() => {}); // Ignorar errores silenciosamente
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error crítico creando cliente:', error);
        
        // Cliente de respaldo
        window.supabaseClient = {
            _mode: 'fallback',
            auth: {
                getSession: () => Promise.resolve({ 
                    data: { session: null }, 
                    error: null 
                }),
                signOut: () => Promise.resolve({ error: null })
            },
            from: (table) => ({
                select: (columns) => ({
                    eq: () => ({
                        or: () => ({
                            order: () => Promise.resolve({ 
                                data: getDatosDemo(table), 
                                error: { 
                                    message: 'API Key inválida - Modo demo activado',
                                    hint: 'Obtén nueva key en Supabase Dashboard'
                                }
                            })
                        })
                    }),
                    gte: (col, val) => ({
                        lte: (col2, val2) => ({
                            eq: (col3, val3) => ({
                                order: () => Promise.resolve({ 
                                    data: getDatosDemo(table).filter(d => {
                                        if (val3 === 'pendiente') return d.estado === 'pendiente';
                                        if (val3 === 'en_proceso') return d.estado === 'en_proceso';
                                        if (val3 === 'solucionado') return d.estado === 'solucionado';
                                        return true;
                                    }), 
                                    error: { message: 'Modo demo activado' }
                                })
                            })
                        })
                    }),
                    order: () => Promise.resolve({ 
                        data: getDatosDemo(table), 
                        error: { message: 'API Key inválida' }
                    })
                })
            })
        };
        
        console.log('🔄 Modo fallback activado - Mostrando datos demo');
    }
    
    // Datos de demo para modo fallback
    function getDatosDemo(table) {
        if (table === 'denuncias') {
            return [
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
                },
                {
                    id: 1003,
                    titulo: 'Alumbrado público dañado',
                    descripcion: 'Poste de luz sin funcionar',
                    categoria: 'Servicios Públicos',
                    estado: 'solucionado',
                    fecha_incidente: '2024-01-05',
                    creado_en: new Date().toISOString(),
                    tipo_formulario: 'reporte',
                    distrito: 'San Jerónimo',
                    ubicacion: 'Calle Saphy 300',
                    es_anonimo: false,
                    prioridad: 'Baja'
                }
            ];
        }
        return [];
    }
    
})();

