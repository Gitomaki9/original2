// reportar_denuncia.js - VERSIÓN SUPABASE
const $ = (id) => document.getElementById(id);

// =================== UI MENSAJES ===================
function setMsg(text, kind = "muted") {
  const el = $("msg");
  if (!el) return;
  el.className = kind;
  el.textContent = text || "";
}

// =================== SESIÓN ===================
function getSession() {
  const session = JSON.parse(localStorage.getItem('supabase.auth.token') || '{}');
  const user = session?.user || JSON.parse(localStorage.getItem('user') || 'null');
  const modo = localStorage.getItem("modo_denuncia") || (session ? "identificado" : "incognito");
  return { session, user, modo };
}

function pintarSesionUI() {
  const { session, user, modo } = getSession();

  const nombreEl = $("nombreUsuario");
  const rolEl = $("rolUsuario");
  const modoBadge = $("modoBox");
  const pillModo = $("pillModo");
  const pillUser = $("pillUser");

  if (session && user && modo === "identificado") {
    const name = user.user_metadata?.nombre || user.email || "Usuario";
    if (nombreEl) nombreEl.textContent = name;
    if (rolEl) rolEl.textContent = user.role === "admin" ? "Administrador" : "Ciudadano";
    if (pillModo) pillModo.textContent = "Modo: Identificado";
    if (pillUser) pillUser.textContent = `Usuario: ${name}`;
    if (modoBadge) {
      modoBadge.className = "badge badge-ok";
      modoBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i><span>Sesión identificada</span>`;
    }
  } else {
    if (nombreEl) nombreEl.textContent = "Invitado";
    if (rolEl) rolEl.textContent = "—";
    if (pillModo) pillModo.textContent = "Modo: Anónimo";
    if (pillUser) pillUser.textContent = "Usuario: Invitado";
    if (modoBadge) {
      modoBadge.className = "badge badge-warn";
      modoBadge.innerHTML = `<i class="fa-solid fa-user-secret"></i><span>Sesión anónima</span>`;
    }
  }
}

// =================== HELPERS ===================
function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function normalizePlaca(p) {
  return String(p || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9-]/g, "");
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fmtFecha(fecha) {
  if (!fecha) return "—";
  return String(fecha).slice(0, 10);
}

function limpiarFormulario() {
  if ($("fecha_incidente")) $("fecha_incidente").value = hoyISO();
  ["placa", "titulo", "referencia_lugar", "distrito", "descripcion"].forEach((id) => {
    const el = $(id);
    if (el) el.value = "";
  });
  if ($("categoria_id")) $("categoria_id").value = "";
  if ($("departamento")) $("departamento").value = "Cusco";
  if ($("provincia")) $("provincia").value = "Cusco";
  if ($("archivo")) $("archivo").value = "";
  setMsg("", "muted");
}

// =================== SUBMIT INCIDENCIA ===================
async function enviarIncidencia(e) {
  e.preventDefault();
  setMsg("Enviando reporte...", "muted");

  // Verificar que Supabase esté disponible
  if (!window.supabase || window.supabase._mode === 'error') {
    setMsg("❌ Error: Supabase no está disponible. Recarga la página.", "error");
    return;
  }

  const { user, modo } = getSession();

  // Preparar datos para Supabase
  const datosDenuncia = {
    fecha_incidente: $("fecha_incidente")?.value || hoyISO(),
    categoria: $("categoria_id")?.value || "otros",
    titulo: ($("titulo")?.value || "").trim(),
    descripcion: ($("descripcion")?.value || "").trim(),
    referencia_lugar: ($("referencia_lugar")?.value || "").trim(),
    distrito: ($("distrito")?.value || "").trim(),
    departamento: ($("departamento")?.value || "Cusco").trim(),
    provincia: ($("provincia")?.value || "Cusco").trim(),
    placa_vehiculo: normalizePlaca($("placa")?.value),
    latitud: $("lat")?.value ? parseFloat($("lat").value) : null,
    longitud: $("lng")?.value ? parseFloat($("lng").value) : null,
    es_anonimo: modo === "incognito",
    usuario_id: user?.id || null,
    estado: 'pendiente',
    prioridad: 'media',
    tipo_formulario: 'denuncia',
    creado_en: new Date().toISOString()
  };

  // Validar campos obligatorios
  if (!datosDenuncia.titulo) {
    setMsg("❌ El título es obligatorio", "error");
    return;
  }

  if (!datosDenuncia.descripcion) {
    setMsg("❌ La descripción es obligatoria", "error");
    return;
  }

  try {
    console.log('📤 Enviando a Supabase:', datosDenuncia);

    // 1. Guardar la denuncia en la tabla
    const { data, error } = await window.supabase
      .from('denuncias')
      .insert([datosDenuncia])
      .select();

    if (error) {
      console.error('❌ Error Supabase:', error);
      setMsg(`❌ Error: ${error.message}`, "error");
      return;
    }

    const denunciaId = data[0]?.id;
    console.log('✅ Denuncia guardada, ID:', denunciaId);

    // 2. Si hay archivo, subirlo a Supabase Storage
    const file = $("archivo")?.files?.[0];
    if (file && denunciaId) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${denunciaId}_${Date.now()}.${fileExt}`;
        
        const { data: storageData, error: storageError } = await window.supabase
          .storage
          .from('evidencias')
          .upload(fileName, file);

        if (storageError) {
          console.warn('⚠️ Error subiendo archivo:', storageError);
        } else {
          console.log('✅ Archivo subido:', storageData);
          
          // Actualizar denuncia con URL de la imagen
          const { data: publicURL } = window.supabase
            .storage
            .from('evidencias')
            .getPublicUrl(fileName);

          await window.supabase
            .from('denuncias')
            .update({ imagen_url: publicURL.publicUrl })
            .eq('id', denunciaId);
        }
      } catch (fileError) {
        console.warn('⚠️ Error procesando archivo:', fileError);
      }
    }

    setMsg(`✅ Reporte registrado (ID: ${denunciaId})`, "ok");

    // Limpiar formulario
    setTimeout(() => {
      limpiarFormulario();
      
      // Redirigir si se desea
      if (confirm('¿Deseas ver el estado de tu reporte?')) {
        window.location.href = `Estado_Reporte.html?id=${denunciaId}`;
      }
    }, 1500);

  } catch (err) {
    console.error('❌ Error inesperado:', err);
    setMsg("❌ Error inesperado. Intenta de nuevo.", "error");
  }
}

// =================== CONSULTA POR PLACA (SUPABASE) ===================
async function consultarPlaca() {
  const placaInput = $("placaConsulta");
  const out = $("resultadoPlaca");

  if (!placaInput || !out) return;

  const placa = normalizePlaca(placaInput.value);
  if (!placa) {
    out.className = "error";
    out.textContent = "⚠️ Ingresa una placa válida.";
    return;
  }

  out.className = "muted";
  out.textContent = "Consultando...";

  // Verificar Supabase
  if (!window.supabase) {
    out.className = "error";
    out.textContent = "❌ Supabase no disponible";
    return;
  }

  try {
    // Consultar denuncias por placa
    const { data: denuncias, error } = await window.supabase
      .from('denuncias')
      .select('*')
      .ilike('placa_vehiculo', `%${placa}%`)
      .order('creado_en', { ascending: false });

    if (error) {
      out.className = "error";
      out.textContent = `❌ Error: ${error.message}`;
      return;
    }

    if (!denuncias || denuncias.length === 0) {
      out.className = "ok";
      out.textContent = `✅ La placa ${placa} NO tiene reportes registrados.`;
      return;
    }

    out.className = "error";
    out.innerHTML = `
      <div style="text-align:center; font-weight:900; margin-bottom:8px;">
        🚨 <span style="color:#b00020;">PLACA REPORTADA</span><br>
        <div style="margin-top:4px;">Placa: <b>${escapeHtml(placa)}</b> — Registros: <b>${denuncias.length}</b></div>
      </div>

      <div style="display:grid; gap:10px; margin-top:10px;">
        ${denuncias.map((it) => `
          <div style="border:1px solid #eee; border-radius:12px; padding:12px; background:#fff;">
            <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap;">
              <div style="font-weight:900; color:#8b0000;">
                #${it.id} — ${escapeHtml(it.titulo || "Sin título")}
              </div>
              <div style="font-weight:800; color:#444;">
                ${fmtFecha(it.fecha_incidente || it.creado_en)}
              </div>
            </div>

            <div style="margin-top:6px; color:#333;">
              <b>Categoría:</b> ${escapeHtml(it.categoria || "—")} &nbsp; | &nbsp;
              <b>Estado:</b> ${escapeHtml(it.estado || "pendiente")} &nbsp; | &nbsp;
              <b>Tipo:</b> ${escapeHtml(it.tipo_formulario || "denuncia")}
            </div>

            <div style="margin-top:6px; color:#333;">
              <b>Ubicación:</b> ${escapeHtml(it.ubicacion || it.referencia_lugar || "—")} — ${escapeHtml(it.distrito || "—")}
              (${escapeHtml(it.departamento || "—")}/${escapeHtml(it.provincia || "—")})
            </div>

            <div style="margin-top:6px; color:#555;">
              <b>Descripción:</b> ${escapeHtml(it.descripcion || "—")}
            </div>

            <div style="margin-top:6px; color:#666; font-size:.9rem;">
              <b>Coords:</b> ${it.latitud ?? "—"}, ${it.longitud ?? "—"}
            </div>
          </div>
        `).join("")}
      </div>
    `;
  } catch (err) {
    console.error(err);
    out.className = "error";
    out.textContent = "❌ Error consultando la base de datos.";
  }
}

// =================== LOGOUT ===================
async function logout() {
  if (!confirm("¿Cerrar sesión?")) return;
  
  try {
    if (window.supabase) {
      await window.supabase.auth.signOut();
    }
    
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('user');
    localStorage.setItem('modo_denuncia', 'incognito');
    
    window.location.href = "index.html";
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    window.location.href = "index.html";
  }
}

// =================== INIT ===================
document.addEventListener("DOMContentLoaded", () => {
  console.log('📝 Inicializando formulario de denuncia...');
  
  // Verificar Supabase
  if (!window.supabase || window.supabase._mode === 'error') {
    console.warn('⚠️ Supabase no está disponible en este momento');
    setMsg('⚠️ Modo offline activado. Los datos se guardarán localmente.', 'muted');
  }

  pintarSesionUI();

  // Fecha por defecto
  if ($("fecha_incidente") && !$("fecha_incidente").value) {
    $("fecha_incidente").value = hoyISO();
  }

  // Listeners
  $("formInc")?.addEventListener("submit", enviarIncidencia);
  $("btnLimpiar")?.addEventListener("click", limpiarFormulario);
  $("logoutBtn")?.addEventListener("click", logout);
  $("btnConsultarPlaca")?.addEventListener("click", consultarPlaca);

  // Modo anónimo/identificado toggle
  $("toggleModo")?.addEventListener("click", () => {
    const { modo } = getSession();
    const nuevoModo = modo === "identificado" ? "incognito" : "identificado";
    localStorage.setItem("modo_denuncia", nuevoModo);
    pintarSesionUI();
    alert(`Modo cambiado a: ${nuevoModo === "identificado" ? "Identificado" : "Anónimo"}`);
  });

  // Botón para probar conexión
  $("testConnection")?.addEventListener("click", async () => {
    if (!window.supabase) {
      alert('❌ Supabase no disponible');
      return;
    }
    
    try {
      const { data, error } = await window.supabase
        .from('denuncias')
        .select('count')
        .limit(1);
      
      if (error) {
        alert(`❌ Error: ${error.message}`);
      } else {
        alert('✅ Conexión a Supabase exitosa');
      }
    } catch (err) {
      alert('❌ Error de conexión');
    }
  });
});

// Función para debug
window.debugSupabase = async () => {
  console.log('🔍 Debug Supabase:');
  console.log('- Cliente:', window.supabase);
  
  if (window.supabase) {
    const { data, error } = await window.supabase.auth.getSession();
    console.log('- Sesión:', data?.session ? 'Activa' : 'Inactiva');
    console.log('- Error:', error);
  }
};
