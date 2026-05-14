/**
 * Maneja el envío del formulario de login.
 * 
 * @async
 * @function login
 * @param {Event} e - Evento de envío del formulario.
 * @returns {Promise<void>}
 * @throws {Error} Si falla la comunicación con el servidor.
 * 
 * @description
 * - Previene el comportamiento por defecto del formulario.
 * - Extrae username y password del formulario.
 * - Envía las credenciales al endpoint POST /api/login.
 * - Si las credenciales son incorrectas, muestra alerta y detiene el flujo.
 * - Si son correctas, guarda el objeto usuario en localStorage.
 * - Redirige según el rol:
 *   - 'admin' → admin.html
 *   - 'empleado' → empleado.html
 *   - cualquier otro (cliente) → index.html
 * 
 * @example
 * // HTML esperado:
 * // <form id="loginForm">
 * //   <input id="username" />
 * //   <input id="password" type="password" />
 * // </form>
 */
async function login(e) {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("http://localhost:3001/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const json = await response.json();
    console.log(json); // Para depuración

    if (!json.success) {
      alert("Usuario o contraseña incorrectos");
      return;
    }

    // Guardar usuario en localStorage
    localStorage.setItem("usuario", JSON.stringify(json.usuario));

    // Redirigir según el rol
    if (json.usuario.rol === "admin") {
      window.location.href = "admin.html";
    } else if (json.usuario.rol === "empleado") {
      window.location.href = "empleado.html";
    } else {
      window.location.href = "index.html"; // Cliente normal
    }
  } catch (error) {
    console.error("Error en login:", error);
    alert("Error de conexión con el servidor");
  }
}

// Asignar el manejador al formulario
document.getElementById("loginForm").addEventListener("submit", login);