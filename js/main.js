console.log("Cusco Reporta — Página inicial cargada correctamente");

// Para iniciar sesión:
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault(); // Evita que la página se recargue

      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value.trim();

      if (!username || !password) {
        alert("Por favor, complete ambos campos.");
        return;
      }

      alert("¡Inicio de sesión exitoso!");
      // Redirigir a una página que aún no existe
      window.location.href = "panel.html";
    });
  }
});
// Redirigir al hacer clic en "Cerrar sesión"
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.querySelector(".logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      // Aquí puedes limpiar datos de sesión si luego los usas
      alert("Sesión cerrada correctamente.");
      window.location.href = "index.html";
    });
  }
});

// PARA REGISTARA DENUNCIA: 
document.addEventListener('DOMContentLoaded', () => {
  const mapContainer = document.getElementById('mapContainer');
  const btnMapa = document.getElementById('btnMapa');
  const form = document.getElementById('formDenuncia');

  btnMapa.addEventListener('click', () => {
    mapContainer.textContent = 'Haga clic en el mapa para seleccionar ubicación';
    mapContainer.style.cursor = 'pointer';

    mapContainer.addEventListener('click', () => {
      mapContainer.textContent = 'Ubicación seleccionada ✓';
      mapContainer.style.backgroundColor = '#d4edda';
      mapContainer.style.color = '#155724';
      mapContainer.style.cursor = 'default';
    }, { once: true });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Denuncia enviada correctamente. Recibirá un número de seguimiento.');
  });

  // ==================== FUNCIONALIDAD PARA NOTIFICACIONES ====================

document.addEventListener('DOMContentLoaded', function() {
    // Agregar event listeners a los botones de marcar como leído
    document.querySelectorAll('.btn-mark-read').forEach(button => {
        button.addEventListener('click', function() {
            const notificationItem = this.closest('.notification-item');
            markAsRead(notificationItem);
        });
    });
});

function markAsRead(notificationItem) {
    // Cambiar a estado leído
    notificationItem.classList.add('read');
    
    // Cambiar el botón por texto "Leída"
    const actions = notificationItem.querySelector('.notification-actions');
    actions.innerHTML = '<span class="read-status">Leída</span>';
    
    // Actualizar contador
    updateNotificationCount();
}

function updateNotificationCount() {
    const unreadCount = document.querySelectorAll('.notification-item:not(.read)').length;
    console.log('Notificaciones no leídas:', unreadCount);
}

// Función para marcar todas como leídas
function markAllAsRead() {
    document.querySelectorAll('.notification-item:not(.read)').forEach(item => {
        markAsRead(item);
    });
}

// Función para filtrar solo no leídas
function filterUnreadOnly() {
    document.querySelectorAll('.notification-item.read').forEach(item => {
        item.style.display = 'none';
    });
}

// Función para mostrar todas
function showAll() {
    document.querySelectorAll('.notification-item').forEach(item => {
        item.style.display = 'block';
    });
}
});


// PARA PERFIL DE USUARIO: Editar / Guardar
document.addEventListener("DOMContentLoaded", function() {
  const btnEditar = document.getElementById("btnEditarPerfil");
  const inputs = document.querySelectorAll(".campo-perfil");

  if (btnEditar) { // Solo se ejecuta en la página del perfil
    let modoEdicion = false;

    btnEditar.addEventListener("click", function() {
      modoEdicion = !modoEdicion;

      inputs.forEach(input => {
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
  }
});
// ==================== GESTIÓN DE USUARIOS ====================
document.addEventListener("DOMContentLoaded", function() {
  const tabla = document.querySelector("#tablaUsuarios tbody");
  if (!tabla) return; // Solo se ejecuta en gestion_usuarios.html

  const usuarios = [
    { id: 1, nombre: "Jose Pérez", correo: "joseperez@mail.com", rol: "Ciudadano" },
    { id: 2, nombre: "Ana Torres", correo: "ana.torres@mail.com", rol: "Administrador" },
    { id: 3, nombre: "Luis Gómez", correo: "luis.gomez@mail.com", rol: "Ciudadano" },
    { id: 4, nombre: "María Vargas", correo: "maria.vargas@mail.com", rol: "Moderador" }
  ];

  function renderUsuarios() {
    tabla.innerHTML = "";
    usuarios.forEach(user => {
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
    asignarEventos();
  }

  function asignarEventos() {
    document.querySelectorAll(".btn-editar").forEach(btn => {
      btn.addEventListener("click", e => {
        const id = e.target.dataset.id;
        const user = usuarios.find(u => u.id == id);
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

    document.querySelectorAll(".btn-eliminar").forEach(btn => {
      btn.addEventListener("click", e => {
        const id = e.target.dataset.id;
        if (confirm("¿Seguro que deseas eliminar este usuario?")) {
          const index = usuarios.findIndex(u => u.id == id);
          usuarios.splice(index, 1);
          alert("🗑️ Usuario eliminado.");
          renderUsuarios();
        }
      });
    });
  }

  renderUsuarios();
});
