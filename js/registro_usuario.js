const API_BASE = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formRegistro");
  const msg = document.getElementById("msg");

  const $ = (id) => document.getElementById(id);
  const clean = (v) => String(v || "").trim();

  function setMsg(text, type = "muted") {
    msg.className = "msg " + type;
    msg.textContent = text;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMsg("Registrando usuario...", "muted");

    const password = $("password").value;
    const password2 = $("password2").value;

    if (password !== password2) {
      setMsg("Las contraseñas no coinciden.", "error");
      return;
    }

    const payload = {
      nombre_completo: clean($("nombre_completo").value),
      dni: clean($("dni").value),
      email: clean($("email").value),
      telefono: clean($("telefono").value),
      direccion: clean($("direccion").value),
      username: clean($("username").value),
      password: password,
      rol_id: Number($("rol_id").value || 1)
    };

    // Validación real
    for (const [k, v] of Object.entries(payload)) {
      if (!v && k !== "rol_id") {
        setMsg(`Falta completar: ${k}`, "error");
        return;
      }
    }

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setMsg(data.message || "Error al registrar usuario.", "error");
        return;
      }

      // 🔥 GUARDAR SESIÓN DIRECTA
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("modo_denuncia", "identificado");

      setMsg("Usuario registrado correctamente. Redirigiendo...", "ok");

      setTimeout(() => {
        window.location.href = "reportar_denuncia.html";
      }, 800);

    } catch (err) {
      console.error(err);
      setMsg("No se pudo conectar con el backend.", "error");
    }
  });
});


