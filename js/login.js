// Frontend/js/login.js
const API_URL = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username")?.value.trim();
    const password = document.getElementById("password")?.value;

    if (!username || !password) {
      alert("Completa usuario y contraseña");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        alert(data.message || "Login inválido");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Si tu admin es rol_id = 2 (ajusta si es otro)
      if (data.user.rol_id === 2) {
        window.location.href = "panel_admin.html";
      } else {
        window.location.href = "panel.html";
      }
    } catch (err) {
      console.error("LOGIN FRONT ERROR:", err);
      alert("No se pudo conectar con la API. ¿Backend encendido?");
    }
  });
});
