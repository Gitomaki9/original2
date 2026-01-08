// CONFIGURACIÓN SUPABASE
const SUPABASE_URL = 'https://grchvnewfkakaqfkgbzy.supabase.co';
const SUPABASE_KEY = 'TU_ANON_KEY_AQUI'; // Reemplaza con tu clave

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ============ FUNCIÓN DE REGISTRO ============
async function registrarUsuario(event) {
  event.preventDefault();
  
  const nombre = document.getElementById('regNombre').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirmPassword = document.getElementById('regConfirmPassword').value;
  const dni = document.getElementById('regDni')?.value.trim() || '';
  const telefono = document.getElementById('regTelefono')?.value.trim() || '';
  
  // Validaciones
  if (!nombre || !email || !password) {
    mostrarError('Por favor completa todos los campos obligatorios');
    return;
  }
  
  if (password !== confirmPassword) {
    mostrarError('Las contraseñas no coinciden');
    return;
  }
  
  if (password.length < 6) {
    mostrarError('La contraseña debe tener al menos 6 caracteres');
    return;
  }
  
  // Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    mostrarError('Por favor ingresa un email válido');
    return;
  }
  
  // Mostrar loading
  const btn = event.target.querySelector('button[type="submit"]');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
  btn.disabled = true;
  
  try {
    // 1. Hash de la contraseña (en producción usa bcrypt en el backend)
    // Para demo, enviaremos directo pero en producción DEBES usar Supabase Auth
    
    // 2. Insertar usuario en la tabla
    const { data, error } = await supabase
      .from('usuarios')
      .insert([
        {
          email: email,
          nombre_completo: nombre,
          password_hash: password, // ⚠️ En producción usa Supabase Auth o bcrypt
          dni: dni || null,
          telefono: telefono || null,
          tipo_usuario: 'ciudadano',
          estado: 'pendiente', // Requiere verificación por email
          token_verificacion: generarToken(32),
          verificado: false
        }
      ])
      .select();
    
    if (error) {
      if (error.code === '23505') { // Unique violation
        if (error.message.includes('email')) {
          throw new Error('Este email ya está registrado');
        } else if (error.message.includes('dni')) {
          throw new Error('Este DNI ya está registrado');
        }
      }
      throw error;
    }
    
    // 3. Registrar intento de login exitoso
    await supabase.rpc('registrar_intento_login', {
      p_email: email,
      p_exito: true,
      p_ip: await obtenerIP(),
      p_user_agent: navigator.userAgent
    });
    
    // 4. Mostrar éxito
    mostrarExito(`¡Registro exitoso ${nombre}!<br>Revisa tu email para verificar tu cuenta.`);
    
    // 5. Limpiar formulario
    event.target.reset();
    
    // 6. Redirigir a login después de 3 segundos
    setTimeout(() => {
      window.location.href = 'iniciar-sesion.html?registro=exitoso&email=' + encodeURIComponent(email);
    }, 3000);
    
  } catch (error) {
    // Registrar intento fallido
    await supabase.rpc('registrar_intento_login', {
      p_email: email,
      p_exito: false,
      p_motivo: error.message,
      p_ip: await obtenerIP(),
      p_user_agent: navigator.userAgent
    });
    
    mostrarError(error.message || 'Error en el registro. Intenta nuevamente.');
    
  } finally {
    // Restaurar botón
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// ============ FUNCIÓN DE LOGIN ============
async function iniciarSesion(event) {
  event.preventDefault();
  
  const email = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  
  if (!email || !password) {
    mostrarError('Por favor ingresa email y contraseña');
    return;
  }
  
  const btn = event.target.querySelector('button[type="submit"]');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
  btn.disabled = true;
  
  try {
    // 1. Buscar usuario por email
    const { data: usuarios, error: searchError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .limit(1);
    
    if (searchError) throw searchError;
    
    if (!usuarios || usuarios.length === 0) {
      throw new Error('Usuario no encontrado');
    }
    
    const usuario = usuarios[0];
    
    // 2. Verificar estado
    if (usuario.estado === 'inactivo') {
      throw new Error('Tu cuenta está desactivada');
    }
    
    if (!usuario.verificado && usuario.estado === 'pendiente') {
      throw new Error('Por favor verifica tu email antes de iniciar sesión');
    }
    
    // 3. Verificar contraseña (en producción usa Supabase Auth o bcrypt compare)
    if (usuario.password_hash !== password) { // ⚠️ Esto es solo para demo
      throw new Error('Contraseña incorrecta');
    }
    
    // 4. Crear sesión
    const tokenSesion = generarToken(64);
    const sesionId = await supabase.rpc('crear_sesion_usuario', {
      p_usuario_id: usuario.id,
      p_token: tokenSesion,
      p_ip: await obtenerIP(),
      p_user_agent: navigator.userAgent,
      p_dispositivo: detectarDispositivo(),
      p_sistema_operativo: detectarSistemaOperativo()
    });
    
    // 5. Guardar en sessionStorage
    sessionStorage.setItem('token_sesion', tokenSesion);
    sessionStorage.setItem('usuario', JSON.stringify({
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre_completo,
      tipo: usuario.tipo_usuario,
      avatar: usuario.avatar_url
    }));
    
    // 6. Registrar intento exitoso
    await supabase.rpc('registrar_intento_login', {
      p_email: email,
      p_exito: true,
      p_ip: await obtenerIP(),
      p_user_agent: navigator.userAgent
    });
    
    // 7. Mostrar éxito y redirigir
    mostrarExito(`¡Bienvenido ${usuario.nombre_completo}!`);
    
    setTimeout(() => {
      // Redirigir según tipo de usuario
      switch(usuario.tipo_usuario) {
        case 'administrador':
          window.location.href = 'admin/dashboard.html';
          break;
        case 'policia':
          window.location.href = 'policia/dashboard.html';
          break;
        default:
          window.location.href = 'ciudadano/dashboard.html';
      }
    }, 1500);
    
  } catch (error) {
    // Registrar intento fallido
    await supabase.rpc('registrar_intento_login', {
      p_email: email,
      p_exito: false,
      p_motivo: error.message,
      p_ip: await obtenerIP(),
      p_user_agent: navigator.userAgent
    });
    
    mostrarError(error.message || 'Error al iniciar sesión');
    
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// ============ FUNCIONES AUXILIARES ============
function generarToken(longitud) {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < longitud; i++) {
    token += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return token;
}

async function obtenerIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return null;
  }
}

function detectarDispositivo() {
  const userAgent = navigator.userAgent;
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

function detectarSistemaOperativo() {
  const userAgent = navigator.userAgent;
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/macintosh|mac os x/i.test(userAgent)) return 'MacOS';
  if (/linux/i.test(userAgent)) return 'Linux';
  if (/android/i.test(userAgent)) return 'Android';
  if (/ios|iphone|ipad|ipod/i.test(userAgent)) return 'iOS';
  return 'Desconocido';
}

function mostrarError(mensaje) {
  alert('❌ ' + mensaje); // En producción usa un modal bonito
}

function mostrarExito(mensaje) {
  alert('✅ ' + mensaje); // En producción usa un modal bonito
}

// ============ INICIALIZAR EVENTOS ============
document.addEventListener('DOMContentLoaded', function() {
  // Formulario de login
  const formLogin = document.getElementById('formLogin');
  if (formLogin) {
    formLogin.addEventListener('submit', iniciarSesion);
  }
  
  // Formulario de registro (si existe en esta página)
  const formRegistro = document.getElementById('formRegistro');
  if (formRegistro) {
    formRegistro.addEventListener('submit', registrarUsuario);
  }
  
  // Verificar si viene de registro exitoso
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('registro') === 'exitoso') {
    const email = urlParams.get('email');
    mostrarExito(`¡Registro exitoso!<br>Puedes iniciar sesión con: ${email}`);
    if (document.getElementById('username')) {
      document.getElementById('username').value = email || '';
    }
  }
  
  // Verificar si ya está logueado
  const token = sessionStorage.getItem('token_sesion');
  if (token) {
    // Redirigir al dashboard correspondiente
    const usuario = JSON.parse(sessionStorage.getItem('usuario') || '{}');
    if (usuario.tipo === 'administrador') {
      window.location.href = 'admin/dashboard.html';
    } else {
      window.location.href = 'ciudadano/dashboard.html';
    }
  }
});
