/**
 * Script para el panel de empleados.
 * 
 * Verifica autenticación y rol de empleado, carga una tabla simple de eventos
 * (solo muestra nombre y un número aleatorio de ventas) y permite validar boletos.
 * 
 * @module empleadoPanel
 */

// Obtener usuario desde localStorage
const usuario = JSON.parse(localStorage.getItem("usuario"));

// Si no hay usuario, redirigir al login
if (!usuario) {
  window.location.href = "login.html";
}

/**
 * ⚠️ POSIBLE ERROR: El rol en el objeto `usuario` viene como "rol" (minúscula) desde el login.
 * Aquí se compara con "Rol" (mayúscula), lo que puede causar una redirección incorrecta.
 * Se recomienda cambiar a `usuario.rol !== "empleado"`.
 */
if (usuario.Rol !== "empleado") {
  window.location.href = "index.html";
}

/**
 * Carga la lista de eventos desde el backend y renderiza una tabla básica.
 * 
 * @async
 * @function cargarEventos
 * @returns {Promise<void>}
 * @throws {Error} Si falla la petición fetch o el parseo de JSON.
 * 
 * @description
 * Consume el endpoint:
 * - GET /api/eventos → espera `{ success: boolean, data: Array<{ Nombre_Evento: string }> }`
 * 
 * Para cada evento, genera una fila de tabla con:
 * - Nombre del evento
 * - Un número aleatorio (simula ventas, no es real)
 */
async function cargarEventos() {
  try {
    const response = await fetch("http://localhost:3001/api/eventos");
    const json = await response.json();
    const eventos = json.data;

    const tabla = document.getElementById("tablaEventos");
    tabla.innerHTML = eventos.map(e => `
      <tr>
        <td>${e.Nombre_Evento}</td>
        <td>${Math.floor(Math.random() * 300)}</td>
      </tr>
    `).join("");
  } catch (error) {
    console.error("Error al cargar eventos:", error);
  }
}

/**
 * Valida un ID de boleto ingresado por el usuario.
 * 
 * @function validarBoleto
 * @returns {void}
 * 
 * @description
 * Lee el valor del input con id "boleto". Si está vacío, muestra un mensaje.
 * En caso contrario, muestra "Boleto X validado" (simulación).
 * 
 * @todo Implementar validación real contra la base de datos.
 */
function validarBoleto() {
  const boleto = document.getElementById("boleto").value;
  const resultado = document.getElementById("resultado");

  if (boleto === "") {
    resultado.innerHTML = "Ingresa un ID";
    return;
  }

  resultado.innerHTML = `Boleto ${boleto} validado`;
}

/**
 * Cierra la sesión del usuario y redirige al login.
 * 
 * @function logout
 * @returns {void}
 */
function logout() {
  localStorage.removeItem("usuario");
  window.location.href = "login.html";
}

// Cargar eventos al iniciar
cargarEventos();