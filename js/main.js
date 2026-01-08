console.log("Cusco Reporta — JS cargado");

// ========= UTIL =========
function onReady(fn) {
  document.addEventListener("DOMContentLoaded", fn);
}

// ========= LOGIN (solo si existe #formLogin) =========
onReady(() => {
  const formLogin = document.getElementById("formLogin");
  if (!formLogin) return;

  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username")?.value.trim();
    const password = document.getElementById("password")?.value.trim();

    if (!username || !password) {
      alert("Por favor, complete ambos campos.");
      return;
    }

    // ✅ Aquí luego conectas con tu API real (/auth/login)
    // Por ahora solo redirige (o comenta esto cuando ya uses login.js)
    alert("¡Inicio de sesión enviado!");
    window.location.href = "panel.html";
  });
});

// ========= LOGOUT (solo si existe .logout-btn) =========
onReady(() => {
  const logoutBtn = document.querySelector(".logout-btn");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    alert("Sesión cerrada correctamente.");
    window.location.href = "index.html";
  });
});

// ========= REGISTRAR DENUNCIA (solo si existen los 3 elementos) =========
onReady(() => {
  const mapContainer = document.getElementById("mapContainer");
  const btnMapa = document.getElementById("btnMapa");
  const formDenuncia = document.getElementById("formDenuncia");

  if (!mapContainer || !btnMapa || !formDenuncia) return;

  btnMapa.addEventListener("click", () => {
    mapContainer.textContent = "Haga clic en el mapa para seleccionar ubicación";
    mapContainer.style.cursor = "pointer";

    mapContainer.addEventListener(
      "click",
      () => {
        mapContainer.textContent = "Ubicación seleccionada ✓";
        mapContainer.style.backgroundColor = "#d4edda";
        mapContainer.style.color = "#155724";
        mapContainer.style.cursor = "default";
      },
      { once: true }
    );
  });

  formDenuncia.addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Denuncia enviada correctamente. Recibirá un número de seguimiento.");
  });
});

// ========= NOTIFICACIONES (solo si hay .notification-item) =========
onReady(() => {
  const items = document.querySelectorAll(".notification-item");
  if (!items.length) return;

  document.querySelectorAll(".btn-mark-read").forEach((button) => {
    button.addEventListener("click", function () {
      const notificationItem = this.closest(".notification-item");
      if (!notificationItem) return;
      markAsRead(notificationItem);
    });
  });

  function markAsRead(notificationItem) {
    notificationItem.classList.add("read");
    const actions = notificationItem.querySelector(".notification-actions");
    if (actions) actions.innerHTML = '<span class="read-status">Leída</span>';
    updateNotificationCount();
  }

  function updateNotificationCount() {
    const unreadCount = document.querySelectorAll(".notification-item:not(.read)").length;
    console.log("Notificaciones no leídas:", unreadCount);
  }

  // Si usas estos botones en tu HTML, les puedes dar id y enlazarlos aquí
  window.markAllAsRead = function () {
    document.querySelectorAll(".notification-item:not(.read)").forEach(markAsRead);
  };

  window.filterUnreadOnly = function () {
    document.querySelectorAll(".notification-item.read").forEach((item) => {
      item.style.display = "none";
    });
  };

  window.showAll = function () {
    document.querySelectorAll(".notification-item").forEach((item) => {
      item.style.display = "block";
    });
  };
});

// ========= PERFIL (solo si existe #btnEditarPerfil) =========
onReady(() => {
  const btnEditar = document.getElementById("btnEditarPerfil");
  const inputs = document.querySelectorAll(".campo-perfil");

  if (!btnEditar) return;

  let modoEdicion = false;

  btnEditar.addEventListener("click", () => {
    modoEdicion = !modoEdicion;

    inputs.forEach((input) => {
      input.disabled = !modoEdicion;
    });

    if (modoEdicion) {
      btnEditar.textContent = "Guardar Cambios";
      btnEditar.style.backgroundColor = "#004aad";
    } else {
      btnEditar.textContent = "Editar Perfil";
      btnEditar.style.backgroundColor = "#b22222";
      alert("Cambios guardados correctamente ✅");
    }
  });
});

// ========= GESTIÓN USUARIOS (solo si existe #tablaUsuarios tbody) =========
onReady(() => {
  const tabla = document.querySelector("#tablaUsuarios tbody");
  if (!tabla) return;

  const usuarios = [
    { id: 1, nombre: "Jose Pérez", correo: "joseperez@mail.com", rol: "Ciudadano" },
    { id: 2, nombre: "Ana Torres", correo: "ana.torres@mail.com", rol: "Administrador" },
    { id: 3, nombre: "Luis Gómez", correo: "luis.gomez@mail.com", rol: "Ciudadano" },
    { id: 4, nombre: "María Vargas", correo: "maria.vargas@mail.com", rol: "Moderador" }
  ];

  function renderUsuarios() {
    tabla.innerHTML = "";
    usuarios.forEach((user) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td style="padding:10px; border-bottom:1px solid #eee;">${user.id}</td>
        <td style="padding:10px; border-bottom:1px solid #eee;">${user.nombre}</td>
        <td style="padding:10px; border-bottom:1px solid #eee;">${user.correo}</td>
        <td style="padding:10px; border-bottom:1px solid #eee;">${user.rol}</td>
        <td style="padding:10px; border-bottom:1px solid #eee;">
          <button class="btn btn-editar" data-id="${user.id}" style="margin-right:8px; background-color:#004aad;">Editar</button>
          <button class="btn btn-eliminar" data-id="${user.id}" style="background-color:#8b0000;">Eliminar</button>
        </td>
      `;
      tabla.appendChild(fila);
    });

    document.querySelectorAll(".btn-editar").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = e.target.dataset.id;
        const user = usuarios.find((u) => String(u.id) === String(id));
        if (!user) return;

        const nuevoNombre = prompt("Editar nombre:", user.nombre);
        const nuevoRol = prompt("Editar rol:", user.rol);
        if (nuevoNombre && nuevoRol) {
          user.nombre = nuevoNombre;
          user.rol = nuevoRol;
          alert("Usuario actualizado correctamente.");
          renderUsuarios();
        }
      });
    });

    document.querySelectorAll(".btn-eliminar").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = e.target.dataset.id;
        const index = usuarios.findIndex((u) => String(u.id) === String(id));
        if (index === -1) return;

        if (confirm("¿Seguro que deseas eliminar este usuario?")) {
          usuarios.splice(index, 1);
          alert("🗑️ Usuario eliminado.");
          renderUsuarios();
        }
      });
    });
  }

  renderUsuarios();
});
