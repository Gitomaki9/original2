// Frontend/js/lista_incidencias.js
const API_BASE = "http://localhost:3000";

const $ = (id) => document.getElementById(id);

function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

function getSession() {
  const token = localStorage.getItem("token");
  const userRaw = localStorage.getItem("user");
  let user = null;
  try { user = userRaw ? JSON.parse(userRaw) : null; } catch {}
  return { token, user };
}

function setEstadoCarga(text, kind = "muted") {
  const el = $("estadoCarga");
  if (!el) return;
  // kind: muted | ok | error
  el.className = `meta-pill ${kind}`;
  el.textContent = text || "";
}

function formatFecha(fechaISO) {
  if (!fechaISO) return "—";
  // soporta "2026-01-06T05:00:00.000Z" o "2026-01-06"
  const d = new Date(fechaISO);
  if (Number.isNaN(d.getTime())) return String(fechaISO);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy}`;
}

function badgeEstado(inc) {
  // Tu vista trae estado_nombre o estado_codigo
  const codigo = String(inc.estado_codigo || "").toUpperCase();
  const nombre = String(inc.estado_nombre || "").toLowerCase();

  // Compatibilidad con valores típicos
  if (codigo === "RECIBIDO" || nombre.includes("recib")) {
    return `<span class="status-badge status-reporte">Recibido</span>`;
  }
  if (codigo === "EN_PROCESO" || nombre.includes("proceso")) {
    return `<span class="status-badge status-proceso">En Proceso</span>`;
  }
  if (codigo === "SOLUCIONADO" || nombre.includes("soluc")) {
    return `<span class="status-badge status-solucionado">Solucionado</span>`;
  }
  return `<span class="status-badge status-reporte">${inc.estado_nombre || "—"}</span>`;
}

function pintarSesionUI() {
  const { token, user } = getSession();
  const nombreEl = $("nombreUsuario");
  const rolEl = $("rolUsuario");

  if (token && user) {
    const nombre =
      user.nombre_completo ||
      user.username ||
      "Usuario";

    if (nombreEl) nombreEl.textContent = nombre;

    // Ajusta según tu BD (si rol_id=2 admin)
    const rol = (user.rol_id === 2) ? "Administrador" : "Ciudadano";
    if (rolEl) rolEl.textContent = rol;

    setEstadoCarga("Sesión identificada", "ok");
  } else {
    if (nombreEl) nombreEl.textContent = "Invitado";
    if (rolEl) rolEl.textContent = "—";
    setEstadoCarga("Sesión anónima (puedes igual ver incidencias)", "muted");
  }
}

async function fetchIncidencias() {
  const desde = $("fecha-inicio")?.value || "";
  const hasta = $("fecha-fin")?.value || "";
  const estado = $("estado")?.value || "todos";

  const params = new URLSearchParams();
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);
  if (estado && estado !== "todos") params.set("estado", estado);

  const url = `${API_BASE}/incidencias${params.toString() ? "?" + params.toString() : ""}`;

  const { token } = getSession();

  setEstadoCarga("Cargando incidencias...", "muted");

  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const text = await res.text();
  const data = safeJson(text) || { ok: false, message: text };

  if (!res.ok || !data.ok) {
    throw new Error(data.message || `Error HTTP ${res.status}`);
  }

  return data.incidencias || [];
}

function renderTabla(incidencias) {
  const tbody = $("tbodyInc");
  const totalEl = $("totalInc");
  if (totalEl) totalEl.textContent = String(incidencias.length);

  if (!tbody) return;

  if (!incidencias.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="muted">No hay incidencias con los filtros seleccionados.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = incidencias.map((inc) => {
    const id = inc.id ?? "—";
    const fecha = formatFecha(inc.fecha_incidente);
    const tipo = inc.tipo_registro || "—";
    const categoria = inc.categoria || "—";
    const titulo = inc.titulo || "—";
    const ubicacion =
      (inc.referencia_lugar ? `${inc.referencia_lugar}` : "") +
      (inc.distrito ? ` / ${inc.distrito}` : "") +
      (inc.provincia ? ` / ${inc.provincia}` : "") +
      (inc.departamento ? ` / ${inc.departamento}` : "");

    return `
      <tr>
        <td>${id}</td>
        <td>${fecha}</td>
        <td>${tipo}</td>
        <td>${categoria}</td>
        <td>${titulo}</td>
        <td>${ubicacion || "—"}</td>
        <td>${badgeEstado(inc)}</td>
        <td><button class="link-btn" data-id="${id}">Ver</button></td>
      </tr>
    `;
  }).join("");

  // click handlers de "Ver"
  tbody.querySelectorAll("button.link-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const inc = incidencias.find(x => String(x.id) === String(id));
      if (inc) openModal(inc);
    });
  });
}

function openModal(inc) {
  const modal = $("modalDetalle");
  const title = $("modalTitle");
  const body = $("modalBody");

  if (!modal || !title || !body) return;

  const placaTxt = inc.placa ? String(inc.placa) : "—";

  // Ubicación preferida (como en tu screenshot)
  const ubicTxt =
    (inc.referencia_lugar ? `${inc.referencia_lugar}` : "") +
    (inc.distrito ? ` / ${inc.distrito}` : "") +
    (inc.provincia ? ` / ${inc.provincia}` : "") +
    (inc.departamento ? ` / ${inc.departamento}` : "");

  title.textContent = `Detalle de incidencia #${inc.id}`;

  body.innerHTML = `
    <div style="text-align:center;">
      <div><b>Fecha:</b> ${formatFecha(inc.fecha_incidente)}</div>
      <div><b>Título:</b> ${inc.titulo || "—"}</div>
      <div><b>Placa:</b> ${placaTxt}</div>
      <div><b>Categoría:</b> ${inc.categoria || "—"}</div>
      <div><b>Ubicación:</b> ${ubicTxt || "—"}</div>
      <br>
      <div><b>Descripción:</b></div>
      <div style="white-space:pre-wrap;">${inc.descripcion || "—"}</div>
      <br>
      <div><b>Estado:</b> ${inc.estado_nombre || "—"}</div>
    </div>
  `;

  modal.style.display = "flex";
}

function closeModal() {
  const modal = $("modalDetalle");
  if (modal) modal.style.display = "none";
}

function initModal() {
  const modal = $("modalDetalle");
  const btnClose = $("modalClose");

  if (btnClose) btnClose.addEventListener("click", closeModal);

  // cerrar clic fuera
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // ESC para cerrar
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

function initLogout() {
  const btn = $("logoutBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    if (!confirm("¿Cerrar sesión?")) return;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.setItem("modo_denuncia", "incognito");
    window.location.href = "index.html";
  });
}

function initFiltros() {
  const btnBuscar = $("btnBuscar");
  const btnLimpiar = $("btnLimpiar");

  if (btnBuscar) {
    btnBuscar.addEventListener("click", async () => {
      try {
        const incs = await fetchIncidencias();
        renderTabla(incs);
        setEstadoCarga("Listo", "ok");
      } catch (err) {
        console.error(err);
        renderTabla([]);
        setEstadoCarga(`❌ ${err.message}`, "error");
      }
    });
  }

  if (btnLimpiar) {
    btnLimpiar.addEventListener("click", () => {
      if ($("fecha-inicio")) $("fecha-inicio").value = "";
      if ($("fecha-fin")) $("fecha-fin").value = "";
      if ($("estado")) $("estado").value = "todos";
      setEstadoCarga("Listo", "muted");
      renderTabla([]);
      const totalEl = $("totalInc");
      if (totalEl) totalEl.textContent = "0";
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  pintarSesionUI();
  initModal();
  initLogout();
  initFiltros();

  // ✅ Cargar automáticamente al abrir la página
  (async () => {
    try {
      const incs = await fetchIncidencias();
      renderTabla(incs);
      setEstadoCarga("Listo", "ok");
    } catch (err) {
      console.error(err);
      renderTabla([]);
      setEstadoCarga(`❌ ${err.message}`, "error");
    }
  })();
});


