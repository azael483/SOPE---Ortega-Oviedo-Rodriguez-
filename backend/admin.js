// Verificar sesión
const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario || usuario.rol !== "admin") {
    window.location.href = "login.html";
}

// ========== CARGAR SELECTS DINÁMICOS ==========
async function cargarSelects() {
    try {
        // Artistas
        const artistasResp = await fetch("http://localhost:3001/api/admin/artistas");
        const artistas = await artistasResp.json();
        if (artistas.success) {
            const select = document.getElementById("idArtista");
            select.innerHTML = '<option value="">Seleccione un artista</option>' + 
                artistas.data.map(a => `<option value="${a.ID_Artista}">${a.Nombre_Artista}</option>`).join("");
        } else console.error("Error cargando artistas:", artistas.error);

        // Ubicaciones
        const ubicacionesResp = await fetch("http://localhost:3001/api/admin/ubicaciones");
        const ubicaciones = await ubicacionesResp.json();
        if (ubicaciones.success) {
            const select = document.getElementById("idUbicacion");
            select.innerHTML = '<option value="">Seleccione una ubicación</option>' + 
                ubicaciones.data.map(u => `<option value="${u.ID_Ubicacion}">${u.Ubicacion}</option>`).join("");
        }

        // Tipos de reembolso
        const reembolsosResp = await fetch("http://localhost:3001/api/admin/tipos-reembolso");
        const reembolsos = await reembolsosResp.json();
        if (reembolsos.success) {
            const select = document.getElementById("tipoReembolso");
            select.innerHTML = reembolsos.data.map(r => `<option value="${r.ID_Tipo_Reembolso}">${r.Nombre_Tipo_Reembolso}</option>`).join("");
        }

        // Estatus (solo los que aplican al crear)
        const estatusResp = await fetch("http://localhost:3001/api/admin/estatus-eventos");
        const estatus = await estatusResp.json();
        if (estatus.success) {
            const select = document.getElementById("estatusEvento");
            select.innerHTML = estatus.data.map(e => `<option value="${e.ID_Estatus}">${e.Estatus}</option>`).join("");
        }
    } catch (error) {
        console.error("Error en cargarSelects:", error);
        alert("No se pudieron cargar las listas de opciones. Verifica que el servidor esté corriendo.");
    }
}

// ========== CARGAR TABLA DE EVENTOS ==========
async function cargarEventos() {
    try {
        const response = await fetch("http://localhost:3001/api/eventos");
        const json = await response.json();
        if (json.success) {
            const tabla = document.getElementById("tablaEventos");
            tabla.innerHTML = json.data.map(e => `
                <tr>
                    <td>${e.ID_Evento}</td>
                    <td>${e.Nombre_Evento || ""}</td>
                    <td>${e.Ubicacion || ""}</td>
                    <td>${new Date(e.Fecha_Evento_Ini).toLocaleString()}</td>
                    <td>${e.Estatus || "Sin estatus"}</td>
                    <td>${e.Nombre_Tipo_Reembolso || "Sin tipo"}</td>
                </tr>
            `).join("");
        }
    } catch (error) {
        console.error("Error cargando eventos:", error);
    }
}
async function cargarEventos() {
  try {
    const response = await fetch("http://localhost:3001/api/eventos");
    const json = await response.json();
    if (json.success && json.data.length > 0) {
      const tbody = document.getElementById("tablaEventos");
      tbody.innerHTML = json.data.map(e => `
        <tr>
          <td>${e.Nombre_Evento}</td>
          <td>${e.Ubicacion}</td>
          <td>${new Date(e.Fecha_Evento_Ini).toLocaleString()}</td>
          <td>${e.Estatus}</td>
          <td>${e.Nombre_Tipo_Reembolso}</td>
        </tr>
      `).join("");
    } else {
      // Si no hay datos, muestra un mensaje
      const tbody = document.getElementById("tablaEventos");
      tbody.innerHTML = '<tr><td colspan="6">No hay eventos registrados</td></tr>';
    }
  } catch (error) {
    console.error("Error cargando eventos:", error);
    const tbody = document.getElementById("tablaEventos");
    tbody.innerHTML = '<tr><td colspan="6">Error al cargar eventos</td></tr>';
  }
}

// ========== CARGAR DASHBOARD ==========
async function cargarDashboard() {
    try {
        const response = await fetch("http://localhost:3001/api/admin/dashboard");
        const json = await response.json();
        if (json.success) {
            document.getElementById("eventosActivos").innerHTML = json.data.eventosActivos;
            document.getElementById("totalBoletos").innerHTML = json.data.totalBoletos;
        }
    } catch (error) {
        console.error("Error cargando dashboard:", error);
    }
}

// ========== CREAR EVENTO ==========
async function crearEvento() {
    // Obtener valores
    const nombre = document.getElementById("nombreEvento").value;
    const descripcion = document.getElementById("descripcionEvento").value;
    const fecha_ini = document.getElementById("fechaIniEvento").value;
    const fecha_fin = document.getElementById("fechaFinEvento").value;
    const num_filas = parseInt(document.getElementById("numFilas").value);
    const asientos_x_fila = parseInt(document.getElementById("asientosPorFila").value);
    const costo_produccion = parseInt(document.getElementById("costoProduccion").value);
    const tipo_reembolso = parseInt(document.getElementById("tipoReembolso").value);
    const estatus = parseInt(document.getElementById("estatusEvento").value);
    const id_artista = parseInt(document.getElementById("idArtista").value);
    const id_ubicacion = parseInt(document.getElementById("idUbicacion").value);

    // Validar campos obligatorios
    if (!nombre || !fecha_ini || !fecha_fin || !num_filas || !asientos_x_fila || !tipo_reembolso || !estatus || !id_artista || !id_ubicacion) {
        alert("Por favor completa todos los campos obligatorios.");
        return;
    }

    const payload = { nombre, descripcion, fecha_ini, fecha_fin, num_filas, asientos_x_fila, costo_produccion, tipo_reembolso, estatus, id_artista, id_ubicacion, imagen_base64: null };

    try {
        const response = await fetch("http://localhost:3001/api/admin/crear-evento", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const json = await response.json();
        if (json.success) {
            alert("x    vento creado exitosamente");
            cerrarModalCrear();
            cargarEventos();
            cargarDashboard();
        } else {
            alert("Error: " + json.message);
        }
    } catch (error) {
        console.error("Error al crear evento:", error);
        alert("Error de conexión con el servidor.");
    }
}

// ========== FUNCIONES DE MODAL ==========
function abrirModalCrear() {
    document.getElementById("modalCrear").style.display = "flex";
}
function cerrarModalCrear() {
    document.getElementById("modalCrear").style.display = "none";
}
function logout() {
    localStorage.removeItem("usuario");
    window.location.href = "login.html";
}

// ========== INICIALIZAR ==========
document.addEventListener("DOMContentLoaded", () => {
    cargarSelects();
    cargarEventos();
    cargarDashboard();
});