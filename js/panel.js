// Frontend/js/panel.js
document.addEventListener("DOMContentLoaded", () => {
  // 1) Leer sesión
  const userRaw = localStorage.getItem("user");
  if (!userRaw) {
    // No hay sesión -> vuelve al login
    window.location.href = "iniciar-sesion.html";
    return;
  }

  let user;
  try {
    user = JSON.parse(userRaw);
  } catch (e) {
    // Sesión corrupta
    localStorage.removeItem("user");
    window.location.href = "iniciar-sesion.html";
    return;
  }

  // 2) Pintar datos en el panel
  const nombreEl = document.getElementById("nombreUsuario");
  const rolEl = document.getElementById("rolUsuario");
  const tituloEl = document.getElementById("tituloBienvenida");

  const nombre = user.nombre_completo || user.username || "Usuario";
  const rolId = Number(user.rol_id);

  // Si tu API todavía NO manda rol_id, esto evitará que se rompa
  let rolTexto = "Ciudadano";
  if (!Number.isNaN(rolId)) {
    // Ajusta si en tu BD admin es otro número
    rolTexto = (rolId === 2) ? "Administrador" : "Ciudadano";
  }

  if (nombreEl) nombreEl.textContent = nombre;
  if (rolEl) rolEl.textContent = rolTexto;
  if (tituloEl) tituloEl.textContent = `¡Bienvenido, ${nombre}!`;

  // 3) Logout correcto
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("user");
      // Si guardas token después, también se borra aquí
      window.location.href = "index.html";
    });
  }

  // 4) (Opcional) Protección por rol
  // Si este panel fuera SOLO de ciudadanos, puedes forzar:
  // if (rolId === 2) window.location.href = "panel_admin.html";
});
