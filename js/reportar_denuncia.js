const API_BASE = "http://localhost:3000";
const $ = (id) => document.getElementById(id);

// =================== UI MENSAJES ===================
function setMsg(text, kind = "muted") {
  const el = $("msg");
  if (!el) return;
  el.className = kind; // define en CSS: .muted .ok .error
  el.textContent = text || "";
}

// =================== SESIÓN ===================
function getSession() {
  const token = localStorage.getItem("token");
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {}
  const modo = localStorage.getItem("modo_denuncia") || (token ? "identificado" : "incognito");
  return { token, user, modo };
}

function pintarSesionUI() {
  const { token, user, modo } = getSession();

  const nombreEl = $("nombreUsuario");
  const rolEl = $("rolUsuario");
  const modoBadge = $("modoBox");
  const pillModo = $("pillModo");
  const pillUser = $("pillUser");

  if (token && user && modo === "identificado") {
    const name = user.nombre_completo || user.username || "Usuario";
    if (nombreEl) nombreEl.textContent = name;
    if (rolEl) rolEl.textContent = user.rol_id === 2 ? "Administrador" : "Ciudadano";
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

  const { user, modo } = getSession();

  const fd = new FormData();

  // Obligatorios
  fd.append("fecha_incidente", $("fecha_incidente")?.value || "");
  fd.append("categoria_id", $("categoria_id")?.value || "");
  fd.append("titulo", ($("titulo")?.value || "").trim());
  fd.append("descripcion", ($("descripcion")?.value || "").trim());

  // Ubicación textual
  fd.append("referencia_lugar", ($("referencia_lugar")?.value || "").trim());
  fd.append("distrito", ($("distrito")?.value || "").trim());
  fd.append("departamento", ($("departamento")?.value || "Cusco").trim());
  fd.append("provincia", ($("provincia")?.value || "Cusco").trim());

  // Placa
  const placaNorm = normalizePlaca($("placa")?.value);
  fd.append("placa", placaNorm);

  // Coords (para geometry ubicacion en backend)
  fd.append("lat", $("lat")?.value || "");
  fd.append("lng", $("lng")?.value || "");

  // Sesión
  fd.append("modo", modo);
  fd.append("usuario_id", user?.id ? String(user.id) : "");

  // Evidencia
  const file = $("archivo")?.files?.[0];
  if (file) fd.append("archivo", file);

  try {
    const res = await fetch(`${API_BASE}/incidencias`, {
      method: "POST",
      body: fd, // NO Content-Type manual
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      setMsg(data.message || `Error HTTP ${res.status}`, "error");
      return;
    }

    setMsg(`✅ Reporte registrado (ID: ${data.id})`, "ok");

    // opcional: refrescar consulta por placa si hay placa
    const placaConsulta = $("placaConsulta");
    if (placaConsulta && placaNorm) placaConsulta.value = placaNorm;

    // ir a lista para ver el registro
    setTimeout(() => {
      window.location.href = "lista_incidencias.html";
    }, 600);
  } catch (err) {
    console.error(err);
    setMsg("❌ No se pudo conectar con el backend. Verifica http://localhost:3000", "error");
  }
}

// =================== CONSULTA POR PLACA (DETALLE) ===================
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

  try {
    const res = await fetch(`${API_BASE}/incidencias/placa/${encodeURIComponent(placa)}`);
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      out.className = "error";
      out.textContent = data.message || `Error HTTP ${res.status}`;
      return;
    }

    if (!data.reportado) {
      out.className = "ok";
      out.textContent = `✅ La placa ${data.placa} NO tiene reportes registrados.`;
      return;
    }

    out.className = "error";
    out.innerHTML = `
      <div style="text-align:center; font-weight:900; margin-bottom:8px;">
        🚨 <span style="color:#b00020;">PLACA REPORTADA</span><br>
        <div style="margin-top:4px;">Placa: <b>${escapeHtml(data.placa)}</b> — Registros: <b>${data.total}</b></div>
      </div>

      <div style="display:grid; gap:10px; margin-top:10px;">
        ${data.incidencias.map((it) => `
          <div style="border:1px solid #eee; border-radius:12px; padding:12px; background:#fff;">
            <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap;">
              <div style="font-weight:900; color:#8b0000;">
                #${it.id} — ${escapeHtml(it.titulo || "Sin título")}
              </div>
              <div style="font-weight:800; color:#444;">
                ${fmtFecha(it.fecha_incidente)}
              </div>
            </div>

            <div style="margin-top:6px; color:#333;">
              <b>Categoría:</b> ${escapeHtml(it.categoria || "—")} &nbsp; | &nbsp;
              <b>Estado:</b> ${escapeHtml(it.estado_nombre || it.estado_codigo || "—")} &nbsp; | &nbsp;
              <b>Tipo:</b> ${escapeHtml(it.tipo_registro || "—")}
            </div>

            <div style="margin-top:6px; color:#333;">
              <b>Ubicación:</b> ${escapeHtml(it.referencia_lugar || "—")} — ${escapeHtml(it.distrito || "—")}
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
    out.textContent = "❌ Error de conexión con el servidor.";
  }
}

// =================== INIT ===================
document.addEventListener("DOMContentLoaded", () => {
  pintarSesionUI();

  // fecha por defecto
  if ($("fecha_incidente") && !$("fecha_incidente").value) $("fecha_incidente").value = hoyISO();

  // listeners
  $("formInc")?.addEventListener("submit", enviarIncidencia);
  $("btnLimpiar")?.addEventListener("click", limpiarFormulario);

  $("logoutBtn")?.addEventListener("click", () => {
    if (!confirm("¿Cerrar sesión?")) return;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.setItem("modo_denuncia", "incognito");
    window.location.href = "index.html";
  });

  $("btnConsultarPlaca")?.addEventListener("click", consultarPlaca);
});





