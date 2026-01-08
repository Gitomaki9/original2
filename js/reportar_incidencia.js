(() => {
  const API = "http://localhost:3000";

  const form = document.getElementById("formIncidencia");
  const msg = document.getElementById("msg");
  const infoUsuario = document.getElementById("infoUsuario");

  let usuario = null;

  // 🔍 Detectar usuario logueado
  try {
    const u = localStorage.getItem("user");
    if (u) {
      usuario = JSON.parse(u);
      infoUsuario.innerHTML = `
        Modo: <strong>Usuario identificado</strong><br>
        Usuario: ${usuario.username}
      `;
    }
  } catch {}

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";
    msg.className = "msg";

    const data = {
      titulo: document.getElementById("titulo").value.trim(),
      categoria: document.getElementById("categoria").value,
      descripcion: document.getElementById("descripcion").value.trim(),
      referencia_lugar: document.getElementById("referencia").value.trim(),

      // 👇 si está logueado se envía el ID, si no → null
      usuario_id: usuario ? usuario.id : null,
      tipo_registro: usuario ? "USUARIO" : "ANONIMO"
    };

    try {
      const res = await fetch(`${API}/incidencias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        msg.textContent = json.message || "Error al registrar incidencia";
        msg.classList.add("err");
        return;
      }

      msg.textContent = "✅ Incidencia registrada correctamente";
      msg.classList.add("ok");
      form.reset();

    } catch (err) {
      console.error(err);
      msg.textContent = "❌ No se pudo conectar con el servidor";
      msg.classList.add("err");
    }
  });
})();
