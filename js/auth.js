// ============================================
// CONFIGURACIÓN SUPABASE AUTHENTICATION
// ============================================

// 1. CONFIGURACIÓN
const SUPABASE_URL = 'https://grchvnewfkakaqfkgbzy.supabase.co';
const SUPABASE_KEY = 'TU_ANON_KEY_AQUI'; // Reemplaza con tu clave

// 2. CREAR CLIENTE
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================

/**
 * REGISTRAR NUEVO USUARIO
 */
async function registrarUsuario(email, password, datosExtra = {}) {
  try {
    console.log('📝 Registrando usuario:', email);
    
    // 1. Registrar en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          nombre_completo: datosExtra.nombre || '',
          dni: datosExtra.dni || '',
          telefono: datosExtra.telefono || '',
          // Estos datos se guardan en user_metadata
        }
      }
    });

    if (error) {
      console.error('❌ Error registro auth:', error);
      throw error;
    }

    console.log('✅ Usuario registrado en Auth:', data.user.id);

    // 2. Guardar en tu tabla personalizada 'usuarios' (opcional)
    if (data.user) {
      try {
        const { error: dbError } = await supabase
          .from('usuarios')
          .insert([
            {
              id: data.user.id, // Mismo ID que auth
              email: email,
              nombre_completo: datosExtra.nombre || '',
              password_hash: password, // Temporal, en producción no guardes esto
              dni: datosExtra.dni || null,
              telefono: datosExtra.telefono || null,
              tipo_usuario: 'ciudadano',
              estado: 'pendiente',
              verificado: false
            }
          ]);

        if (dbError) {
          console.warn('⚠️ No se pudo guardar en tabla usuarios:', dbError.message);
          // No lanzamos error, porque el usuario ya está en auth
        }
      } catch (dbErr) {
        console.warn('⚠️ Error tabla usuarios:', dbErr);
      }
    }

    return {
      success: true,
      user: data.user,
      message: 'Usuario registrado. Verifica tu email.'
    };

  } catch (error) {
    console.error('❌ Error completo registro:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * INICIAR SESIÓN
 */
async function iniciarSesion(email, password) {
  try {
    console.log('🔐 Intentando login:', email);
    
    // 1. Autenticar con Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      console.error('❌ Error login:', error);
      throw error;
    }

    console.log('✅ Login exitoso:', data.user.email);

    // 2. Obtener datos adicionales de tu tabla 'usuarios'
    let usuarioData = {};
    try {
      const { data: dbData, error: dbError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (!dbError && dbData) {
        usuarioData = dbData;
      }
    } catch (dbErr) {
      console.warn('⚠️ No se pudo obtener datos adicionales:', dbErr);
    }

    // 3. Guardar en sessionStorage
    sessionStorage.setItem('supabase_token', data.session.access_token);
    sessionStorage.setItem('supabase_user', JSON.stringify(data.user));
    sessionStorage.setItem('usuario_data', JSON.stringify(usuarioData));

    // 4. Actualizar último login en tabla usuarios
    try {
      await supabase
        .from('usuarios')
        .update({ ultimo_login: new Date().toISOString() })
        .eq('id', data.user.id);
    } catch (updateErr) {
      console.warn('⚠️ No se pudo actualizar último login:', updateErr);
    }

    return {
      success: true,
      user: data.user,
      usuarioData: usuarioData,
      session: data.session
    };

  } catch (error) {
    console.error('❌ Error completo login:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * CERRAR SESIÓN
 */
async function cerrarSesion() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) throw error;
    
    // Limpiar sessionStorage
    sessionStorage.removeItem('supabase_token');
    sessionStorage.removeItem('supabase_user');
    sessionStorage.removeItem('usuario_data');
    
    console.log('✅ Sesión cerrada');
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error cerrando sesión:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * VERIFICAR SI HAY SESIÓN ACTIVA
 */
async function verificarSesion() {
  try {
    // Obtener sesión actual
    const { data, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    
    if (data.session) {
      console.log('✅ Sesión activa:', data.session.user.email);
      return {
        isAuthenticated: true,
        user: data.session.user,
        session: data.session
      };
    } else {
      console.log('ℹ️ No hay sesión activa');
      return {
        isAuthenticated: false
      };
    }
    
  } catch (error) {
    console.error('❌ Error verificando sesión:', error);
    return {
      isAuthenticated: false,
      error: error.message
    };
  }
}

/**
 * OBTENER USUARIO ACTUAL
 */
function obtenerUsuarioActual() {
  try {
    const userStr = sessionStorage.getItem('supabase_user');
    const usuarioDataStr = sessionStorage.getItem('usuario_data');
    
    if (!userStr) return null;
    
    const user = JSON.parse(userStr);
    const usuarioData = usuarioDataStr ? JSON.parse(usuarioDataStr) : {};
    
    return {
      ...user,
      ...usuarioData,
      tipo: usuarioData.tipo_usuario || 'ciudadano'
    };
    
  } catch (error) {
    console.error('❌ Error obteniendo usuario:', error);
    return null;
  }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * MOSTRAR NOTIFICACIÓN
 */
function mostrarNotificacion(mensaje, tipo = 'info') {
  // Crear elemento de notificación
  const notificacion = document.createElement('div');
  notificacion.className = `auth-notificacion ${tipo}`;
  notificacion.innerHTML = `
    <i class="fas ${
      tipo === 'success' ? 'fa-check-circle' :
      tipo === 'error' ? 'fa-exclamation-circle' :
      'fa-info-circle'
    }"></i>
    <span>${mensaje}</span>
  `;
  
  // Estilos
  notificacion.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 25px;
    border-radius: 10px;
    color: white;
    font-weight: 600;
    z-index: 10000;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    animation: slideInAuth 0.3s ease-out;
    background: ${
      tipo === 'success' ? '#28a745' :
      tipo === 'error' ? '#dc3545' :
      '#17a2b8'
    };
    display: flex;
    align-items: center;
    gap: 10px;
    max-width: 400px;
  `;
  
  // Agregar al DOM
  document.body.appendChild(notificacion);
  
  // Auto-eliminar después de 4 segundos
  setTimeout(() => {
    notificacion.style.animation = 'slideOutAuth 0.3s ease-out forwards';
    setTimeout(() => notificacion.remove(), 300);
  }, 4000);
}

/**
 * AGREGAR ESTILOS CSS PARA NOTIFICACIONES
 */
function agregarEstilosAuth() {
  if (document.getElementById('auth-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'auth-styles';
  style.textContent = `
    @keyframes slideInAuth {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutAuth {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    
    /* Loading spinner */
    .auth-loading {
      display: inline-block;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  
  document.head.appendChild(style);
}

// ============================================
// INICIALIZACIÓN
// ============================================

// Agregar estilos cuando se cargue la página
document.addEventListener('DOMContentLoaded', function() {
  agregarEstilosAuth();
  
  // Verificar sesión automáticamente
  verificarSesion().then(session => {
    if (session.isAuthenticated) {
      console.log('👤 Usuario autenticado:', session.user.email);
    }
  });
});

// ============================================
// EXPORTAR FUNCIONES (para usar en otros archivos)
// ============================================
window.supabaseAuth = {
  registrarUsuario,
  iniciarSesion,
  cerrarSesion,
  verificarSesion,
  obtenerUsuarioActual,
  mostrarNotificacion,
  supabase // Exportar cliente también
};
