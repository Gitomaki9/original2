// lista_incidencias.js - VERSIÓN COMPLETA Y CORREGIDA
(function() {
    'use strict';
    
    // ================================
    // VARIABLES GLOBALES Y CONFIGURACIÓN
    // ================================
    let incidencias = [];
    let esAdmin = false;
    let usuarioId = null;
    let supabase = null;
    
    // ================================
    // FUNCIONES AUXILIARES
    // ================================
    function $(id) {
        return document.getElementById(id);
    }
    
    function setEstadoCarga(text, kind = "muted") {
        const el = $("estadoCarga");
        if (!el) return;
        
        el.textContent = text;
        el.className = `meta-pill`;
        
        if (kind === "error") {
            el.style.color = "#dc3545";
            el.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> ${text}`;
        } else if (kind === "ok") {
            el.style.color = "#28a745";
            el.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${text}`;
        } else {
            el.innerHTML = `<i class="fa-solid fa-circle-info"></i> ${text}`;
        }
    }
    
    function formatFecha(fechaISO) {
        if (!fechaISO) return "—";
        const d = new Date(fechaISO);
        if (isNaN(d.getTime())) return fechaISO;
        return d.toLocaleDateString('es-PE');
    }
    
    function badgeEstado(inc) {
        const estado = String(inc.estado || "").toLowerCase();
        if (estado === 'pendiente') return '<span class="status-badge status-reporte">Reportado</span>';
        if (estado === 'en_proceso' || estado === 'en proceso') return '<span class="status-badge status-proceso">En Proceso</span>';
        if (estado === 'solucionado') return '<span class="status-badge status-solucionado">Solucionado</span>';
        if (estado === 'cancelado') return '<span class="status-badge status-cancelado">Cancelado</span>';
        return `<span class="status-badge status-reporte">${inc.estado || "Pendiente"}</span>`;
    }
    
    function actualizarUIporPermisos() {
        const btnBuscarTermino = document.getElementById('btnBuscarTermino');
        const campoBusqueda = document.getElementById('busqueda');
        
        // Si hay usuario, mostrar funcionalidades completas
        if (usuarioId) {
            if (campoBusqueda) {
                campoBusqueda.placeholder = "Buscar por placa, nombre, ID o título...";
            }
        } else {
            // Usuario anónimo - mensaje informativo
            if (campoBusqueda) {
                campoBusqueda.placeholder = "Buscar (solo verás reportes anónimos)...";
            }
        }
    }
    
    // ================================
    // FUNCIONES PRINCIPALES
    // ================================
    async function verificarSesionYPermisos() {
        if (!supabase) {
            console.error('Supabase no está disponible');
            return { loggedIn: false, esAdmin: false, nombre: null };
        }
        
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
                console.warn('Error obteniendo sesión:', error);
                return { loggedIn: false, esAdmin: false, nombre: null };
            }
            
            if (session?.user) {
                usuarioId = session.user.id;
                
                // Verificar si es administrador
                const { data: usuario } = await supabase
                    .from('usuarios')
                    .select('tipo_usuario, nombre_completo')
                    .eq('id', usuarioId)
                    .single();
                
                if (usuario) {
                    esAdmin = usuario.tipo_usuario === 'admin';
                    return { 
                        loggedIn: true, 
                        esAdmin, 
                        nombre: usuario.nombre_completo || session.user.email 
                    };
                }
            }
            
            return { loggedIn: false, esAdmin: false, nombre: null };
            
        } catch (error) {
            console.error('Error verificando sesión:', error);
            return { loggedIn: false, esAdmin: false, nombre: null };
        }
    }
    
    async function cargarIncidencias() {
        if (!supabase) {
            throw new Error('Supabase no está configurado');
        }
        
        const desde = $("fecha-inicio")?.value || "";
        const hasta = $("fecha-fin")?.value || "";
        const estado = $("estado")?.value || "todos";
        
        setEstadoCarga("Cargando...", "muted");
        
        try {
            let query = supabase
                .from('denuncias')
                .select('*')
                .order('creado_en', { ascending: false });
            
            // Aplicar filtros
            if (desde) query = query.gte('fecha_incidente', desde);
            if (hasta) query = query.lte('fecha_incidente', hasta);
            
            if (estado !== 'todos') {
                let estadoBD = estado;
                if (estado === 'reporte') estadoBD = 'pendiente';
                if (estado === 'proceso') estadoBD = 'en_proceso';
                query = query.eq('estado', estadoBD);
            }
            
            // Si hay usuario y no es admin, filtrar
            if (usuarioId && !esAdmin) {
                query = query.or(`user_id.eq.${usuarioId},es_anonimo.eq.true`);
            } else if (!usuarioId) {
                // Usuario anónimo solo ve denuncias anónimas
                query = query.eq('es_anonimo', true);
            }
            
            const { data, error } = await query;
            
            if (error) {
                console.error('Error en consulta:', error);
                
                // Manejo específico de errores
                if (error.code === '42P01') {
                    throw new Error('La tabla "denuncias" no existe en la base de datos');
                } else if (error.message.includes('JWT')) {
                    throw new Error('Error de autenticación. Por favor, recarga la página');
                } else if (error.message.includes('permission denied')) {
                    throw new Error('No tienes permisos para ver estas incidencias');
                }
                
                throw error;
            }
            
            incidencias = data || [];
            mostrarIncidencias(incidencias);
            setEstadoCarga(`Cargado: ${incidencias.length} registros`, "ok");
            
        } catch (error) {
            console.error('Error cargando incidencias:', error);
            setEstadoCarga(`❌ ${error.message}`, "error");
            mostrarIncidencias([]);
        }
    }
    
    function mostrarIncidencias(data) {
        const tbody = $("tbodyInc");
        const totalEl = $("totalInc");
        
        if (totalEl) totalEl.textContent = data.length;
        
        if (!tbody) return;
        
        if (!data.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
                        <i class="fa-solid fa-inbox"></i><br>
                        No se encontraron incidencias con los filtros aplicados.
                        ${!usuarioId ? '<br><small>Inicia sesión para ver más reportes</small>' : ''}
                    </td>
                </tr>
            `;
            return;
        }
        
        const rows = data.map(inc => `
            <tr>
                <td><strong>#${inc.id}</strong></td>
                <td>${formatFecha(inc.fecha_incidente)}</td>
                <td>${inc.tipo_formulario === 'reporte' ? 'Reporte' : 'Denuncia'}</td>
                <td>${inc.categoria || '—'}</td>
                <td>${inc.titulo || '—'}</td>
                <td>${(inc.distrito || inc.ubicacion || '—').substring(0, 30)}${(inc.distrito || inc.ubicacion || '').length > 30 ? '...' : ''}</td>
                <td>${badgeEstado(inc)}</td>
                <td>
                    <button class="link-btn btn-detalle" data-id="${inc.id}">
                        <i class="fa-solid fa-eye"></i> Ver
                    </button>
                </td>
            </tr>
        `).join('');
        
        tbody.innerHTML = rows;
        
        // Agregar event listeners
        tbody.querySelectorAll('.btn-detalle').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const inc = data.find(i => i.id == id);
                if (inc) mostrarDetalleModal(inc);
            });
        });
    }
    
    function mostrarDetalleModal(inc) {
        const modal = $("modalDetalle");
        const title = $("modalTitle");
        const body = $("modalBody");
        
        if (!modal || !title || !body) return;
        
        // Construir contenido del modal
        const contenido = `
            <div style="display: grid; gap: 15px;">
                <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 200px;">
                        <h4 style="color: #8b0000; margin-bottom: 8px;">Información Básica</h4>
                        <p><strong>ID:</strong> ${inc.id}</p>
                        <p><strong>Tipo:</strong> ${inc.tipo_formulario === 'reporte' ? 'Reporte' : 'Denuncia'}</p>
                        <p><strong>Estado:</strong> ${badgeEstado(inc)}</p>
                        <p><strong>Categoría:</strong> ${inc.categoria || '—'}</p>
                        <p><strong>Prioridad:</strong> ${inc.prioridad || 'Normal'}</p>
                        <p><strong>Fecha Incidente:</strong> ${formatFecha(inc.fecha_incidente)}</p>
                        <p><strong>Fecha Reporte:</strong> ${new Date(inc.creado_en).toLocaleString('es-PE')}</p>
                    </div>
                    
                    <div style="flex: 1; min-width: 200px;">
                        <h4 style="color: #8b0000; margin-bottom: 8px;">Ubicación</h4>
                        ${inc.departamento ? `<p><strong>Departamento:</strong> ${inc.departamento}</p>` : ''}
                        ${inc.provincia ? `<p><strong>Provincia:</strong> ${inc.provincia}</p>` : ''}
                        ${inc.distrito ? `<p><strong>Distrito:</strong> ${inc.distrito}</p>` : ''}
                        ${inc.ubicacion ? `<p><strong>Dirección:</strong> ${inc.ubicacion}</p>` : ''}
                        ${inc.coordenadas ? `<p><strong>Coordenadas:</strong> ${inc.coordenadas}</p>` : ''}
                    </div>
                </div>
                
                <div>
                    <h4 style="color: #8b0000; margin-bottom: 8px;">Descripción</h4>
                    <div style="background: #f8f9fa; padding: 12px; border-radius: 5px; border-left: 4px solid #b22222;">
                        <p style="margin: 0; white-space: pre-wrap;">${inc.descripcion || 'Sin descripción'}</p>
                    </div>
                </div>
                
                ${inc.placa_vehiculo ? `
                <div>
                    <h4 style="color: #8b0000; margin-bottom: 8px;">Información del Vehículo</h4>
                    <p><strong>Placa:</strong> ${inc.placa_vehiculo}</p>
                </div>
                ` : ''}
                
                ${(inc.victima_nombre || inc.denunciado_nombre) ? `
                <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                    ${inc.victima_nombre ? `
                    <div style="flex: 1; min-width: 200px;">
                        <h4 style="color: #8b0000; margin-bottom: 8px;">Víctima</h4>
                        <p><strong>Nombre:</strong> ${inc.victima_nombre}</p>
                        ${inc.victima_dni ? `<p><strong>DNI:</strong> ${inc.victima_dni}</p>` : ''}
                        ${inc.victima_telefono ? `<p><strong>Teléfono:</strong> ${inc.victima_telefono}</p>` : ''}
                    </div>
                    ` : ''}
                    
                    ${inc.denunciado_nombre ? `
                    <div style="flex: 1; min-width: 200px;">
                        <h4 style="color: #8b0000; margin-bottom: 8px;">Denunciado</h4>
                        <p><strong>Nombre:</strong> ${inc.denunciado_nombre}</p>
                        ${inc.denunciado_dni ? `<p><strong>DNI:</strong> ${inc.denunciado_dni}</p>` : ''}
                        ${inc.denunciado_telefono ? `<p><strong>Teléfono:</strong> ${inc.denunciado_telefono}</p>` : ''}
                    </div>
                    ` : ''}
                </div>
                ` : ''}
                
                ${esAdmin ? `
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee;">
                    <h4 style="color: #8b0000; margin-bottom: 8px;">Información del Sistema</h4>
                    <p><strong>Usuario ID:</strong> ${inc.user_id || 'Anónimo'}</p>
                    <p><strong>Email:</strong> ${inc.usuario_email || 'No especificado'}</p>
                    <p><strong>Es Anónimo:</strong> ${inc.es_anonimo ? 'Sí' : 'No'}</p>
                </div>
                ` : ''}
            </div>
        `;
        
        title.textContent = `Detalle: ${inc.titulo || 'Incidencia'}`;
        body.innerHTML = contenido;
        modal.style.display = "flex";
    }
    
    async function buscarIncidencias() {
        const termino = document.getElementById('busqueda')?.value?.trim();
        
        if (!termino) {
            return cargarIncidencias();
        }
        
        setEstadoCarga("Buscando...", "muted");
        
        try {
            let query = supabase
                .from('denuncias')
                .select('*')
                .or(`placa_vehiculo.ilike.%${termino}%,victima_nombre.ilike.%${termino}%,denunciado_nombre.ilike.%${termino}%,titulo.ilike.%${termino}%,id::text.ilike.%${termino}%`)
                .order('creado_en', { ascending: false });
            
            // Aplicar filtros de usuario
            if (usuarioId && !esAdmin) {
                query = query.or(`user_id.eq.${usuarioId},es_anonimo.eq.true`);
            } else if (!usuarioId) {
                query = query.eq('es_anonimo', true);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            incidencias = data || [];
            mostrarIncidencias(incidencias);
            setEstadoCarga(`Encontrados: ${incidencias.length}`, "ok");
            
        } catch (error) {
            console.error("Error en búsqueda:", error);
            setEstadoCarga(`❌ ${error.message}`, "error");
        }
    }
    
    function agregarCampoBusqueda() {
        const dateFilters = document.querySelector('.date-filters');
        if (!dateFilters) return;
        
        // Verificar si ya existe
        if (document.getElementById('busqueda')) return;
        
        const campoBusqueda = document.createElement('div');
        campoBusqueda.className = 'filter-group';
        campoBusqueda.innerHTML = `
            <label for="busqueda">Buscar (placa, nombre, ID)</label>
            <div style="display: flex; gap: 5px;">
                <input type="text" id="busqueda" placeholder="Buscar..." style="flex: 1;">
                <button id="btnBuscarTermino" class="btn btn-outline" style="white-space: nowrap;">
                    <i class="fa-solid fa-search"></i>
                </button>
            </div>
        `;
        
        dateFilters.appendChild(campoBusqueda);
        
        // Eventos de búsqueda
        document.getElementById('btnBuscarTermino')?.addEventListener('click', buscarIncidencias);
        document.getElementById('busqueda')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') buscarIncidencias();
        });
    }
    
    // ================================
    // INICIALIZACIÓN PRINCIPAL
    // ================================
    document.addEventListener('DOMContentLoaded', async function() {
        console.log('🚀 Iniciando lista_incidencias.js');
        
        // Obtener cliente de Supabase
        supabase = window.supabaseClient;
        
        if (!supabase) {
            console.error('❌ Error: window.supabaseClient no está definido');
            setEstadoCarga('Error: Supabase no configurado', 'error');
            alert('Error de configuración: Supabase no está configurado correctamente.');
            return;
        }
        
        console.log('✅ Supabase disponible:', supabase);
        
        // Verificar sesión y permisos
        const sesion = await verificarSesionYPermisos();
        
        // Actualizar UI de sesión
        const nombreEl = $("nombreUsuario");
        const rolEl = $("rolUsuario");
        
        if (sesion?.loggedIn) {
            if (nombreEl) nombreEl.textContent = sesion.nombre || 'Usuario';
            if (rolEl) rolEl.textContent = sesion.esAdmin ? 'Administrador' : 'Ciudadano';
        } else {
            if (nombreEl) nombreEl.textContent = 'Invitado';
            if (rolEl) rolEl.textContent = '—';
        }
        
        // Configurar eventos
        $('btnBuscar')?.addEventListener('click', cargarIncidencias);
        $('btnLimpiar')?.addEventListener('click', () => {
            $('fecha-inicio').value = '';
            $('fecha-fin').value = '';
            $('estado').value = 'todos';
            $('busqueda').value = '';
            cargarIncidencias();
        });
        
        // Modal
        $('modalClose')?.addEventListener('click', () => {
            $('modalDetalle').style.display = 'none';
        });
        
        $('modalDetalle')?.addEventListener('click', (e) => {
            if (e.target === $('modalDetalle')) {
                $('modalDetalle').style.display = 'none';
            }
        });
        
        // Logout
        $('logoutBtn')?.addEventListener('click', async () => {
            if (confirm('¿Cerrar sesión?')) {
                await supabase.auth.signOut();
                window.location.href = 'index.html';
            }
        });
        
        // Agregar campo de búsqueda (si no existe en HTML)
        agregarCampoBusqueda();
        actualizarUIporPermisos();
        
        // Cargar incidencias iniciales
        await cargarIncidencias();
        
        console.log('✅ Aplicación inicializada correctamente');
    });
    
})(); // Fin de la IIFE
