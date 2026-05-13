// Verificar sesión
const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario || usuario.rol !== "admin") {
    window.location.href = "login.html";
}

let selectedEventoId = null;
let filaSeleccionada = null;

// ========== CARGAR SELECTS DINÁMICOS (CREAR Y EDITAR) ==========
async function cargarSelects() {
    try {
        // Artistas
        const artistasResp = await fetch("http://localhost:3001/api/admin/artistas");
        const artistas = await artistasResp.json();
        if (artistas.success) {
            const options = artistas.data.map(a => `<option value="${a.ID_Artista}">${a.Nombre_Artista}</option>`).join("");
            document.getElementById("idArtista").innerHTML = options;
            document.getElementById("edit_idArtista").innerHTML = options;
        }

        // Ubicaciones
        const ubicacionesResp = await fetch("http://localhost:3001/api/admin/ubicaciones");
        const ubicaciones = await ubicacionesResp.json();
        if (ubicaciones.success) {
            const options = ubicaciones.data.map(u => `<option value="${u.ID_Ubicacion}">${u.Ubicacion}</option>`).join("");
            document.getElementById("idUbicacion").innerHTML = options;
            document.getElementById("edit_idUbicacion").innerHTML = options;
        }

        // Tipos de reembolso
        const reembolsosResp = await fetch("http://localhost:3001/api/admin/tipos-reembolso");
        const reembolsos = await reembolsosResp.json();
        if (reembolsos.success) {
            const options = reembolsos.data.map(r => `<option value="${r.ID_Tipo_Reembolso}">${r.Nombre_Tipo_Reembolso}</option>`).join("");
            document.getElementById("tipoReembolso").innerHTML = options;
            document.getElementById("edit_tipoReembolso").innerHTML = options;
        }

        // Estatus (solo 1-4 para creación; para edición se cargarán todos)
        const estatusResp = await fetch("http://localhost:3001/api/admin/estatus-eventos");
        const estatus = await estatusResp.json();
        if (estatus.success) {
            const options = estatus.data.map(e => `<option value="${e.ID_Estatus}">${e.Estatus}</option>`).join("");
            document.getElementById("estatusEvento").innerHTML = options;
        }
        // Para edición cargamos TODOS los estatus (incluido finalizado/cancelado)
        const todosEstatusResp = await fetch("http://localhost:3001/api/admin/estatus-todos");
        const todosEstatus = await todosEstatusResp.json();
        if (todosEstatus.success) {
            document.getElementById("edit_estatusEvento").innerHTML = todosEstatus.data.map(e => `<option value="${e.ID_Estatus}">${e.Estatus}</option>`).join("");
        }
    } catch (error) {
        console.error("Error cargando selects:", error);
    }
}

// ========== CARGAR TABLA DE EVENTOS ==========
async function cargarEventos() {
    try {
        const response = await fetch("http://localhost:3001/api/eventos");
        const json = await response.json();
        if (json.success) {
            const tbody = document.getElementById("tablaEventos");
            tbody.innerHTML = json.data.map(e => `
                <tr data-id="${e.ID_Evento}" class="fila-evento" onclick="seleccionarEvento(this, ${e.ID_Evento})" style="cursor:pointer">
                    <td>${e.Nombre_Evento}</td>
                    <td>${e.Ubicacion || e.ID_Ubicacion}</td>
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

// ========== SELECCIONAR EVENTO ==========
function seleccionarEvento(fila, id) {
    // Remover la clase 'seleccionado' de la fila anterior
    if (filaSeleccionada) {
        filaSeleccionada.classList.remove("seleccionado");
    }
    // Agregar clase a la nueva fila
    fila.classList.add("seleccionado");
    filaSeleccionada = fila;
    
    // Guardar ID y habilitar botones
    selectedEventoId = id;
    const btnEditar = document.getElementById("btnEditarEvento");
    const btnEliminar = document.getElementById("btnEliminarEvento");
    btnEditar.disabled = false;
    btnEliminar.disabled = false;
}

// ========== ABRIR MODAL DE EDICIÓN Y CARGAR DATOS ==========
async function abrirModalEditar() {
    if (!selectedEventoId) return;
    try {
        // Obtener todos los eventos y filtrar por ID
        const response = await fetch("http://localhost:3001/api/eventos");
        const json = await response.json();
        const evento = json.data.find(e => e.ID_Evento == selectedEventoId);
        if (!evento) {
            alert("No se encontraron datos del evento");
            return;
        }

        // Llenar campos del modal
        document.getElementById("edit_idEvento").value = evento.ID_Evento;
        document.getElementById("edit_nombreEvento").value = evento.Nombre_Evento || "";
        document.getElementById("edit_descripcionEvento").value = evento.Descripcion_Evento || "";
        document.getElementById("edit_fechaIniEvento").value = evento.Fecha_Evento_Ini ? evento.Fecha_Evento_Ini.slice(0, 16) : "";
        document.getElementById("edit_fechaFinEvento").value = evento.Fecha_Evento_Fin ? evento.Fecha_Evento_Fin.slice(0, 16) : "";
        document.getElementById("edit_numFilas").value = evento.Num_Filas || "";
        document.getElementById("edit_asientosPorFila").value = evento.Asientos_x_Fila || "";
        document.getElementById("edit_costoProduccion").value = evento.Costo_Produccion_Evento || "";
        
        // Seleccionar valores en los selects (por ID)
        document.getElementById("edit_tipoReembolso").value = evento.Tipo_Reembolso;
        document.getElementById("edit_estatusEvento").value = evento.Estatus_evento;
        document.getElementById("edit_idArtista").value = evento.ID_Artista;
        document.getElementById("edit_idUbicacion").value = evento.ID_Ubicacion;

        document.getElementById("modalEditar").style.display = "flex";
    } catch (error) {
        console.error("Error al cargar evento para editar:", error);
        alert("No se pudieron cargar los datos del evento");
    }
}

// ========== ACTUALIZAR EVENTO (PUT) ==========
async function actualizarEvento() {
    const id = document.getElementById("edit_idEvento").value;
    const payload = {
        nombre: document.getElementById("edit_nombreEvento").value,
        descripcion: document.getElementById("edit_descripcionEvento").value,
        fecha_ini: document.getElementById("edit_fechaIniEvento").value,
        fecha_fin: document.getElementById("edit_fechaFinEvento").value,
        num_filas: parseInt(document.getElementById("edit_numFilas").value),
        asientos_x_fila: parseInt(document.getElementById("edit_asientosPorFila").value),
        costo_produccion: parseInt(document.getElementById("edit_costoProduccion").value),
        tipo_reembolso: parseInt(document.getElementById("edit_tipoReembolso").value),
        estatus: parseInt(document.getElementById("edit_estatusEvento").value),
        id_artista: parseInt(document.getElementById("edit_idArtista").value),
        id_ubicacion: parseInt(document.getElementById("edit_idUbicacion").value),
        imagen_base64: null
    };

    try {
        const response = await fetch(`http://localhost:3001/api/admin/editar-evento/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const json = await response.json();
        if (json.success) {
            alert("✅ Evento actualizado correctamente");
            cerrarModalEditar();
            cargarEventos();
            cargarDashboard();
        } else {
            alert("❌ Error: " + json.message);
        }
    } catch (error) {
        console.error("Error al actualizar evento:", error);
        alert("Error de conexión con el servidor");
    }
}

// ========== CERRAR MODAL DE EDICIÓN ==========
function cerrarModalEditar() {
    document.getElementById("modalEditar").style.display = "none";
}

// ========== DASHBOARD ==========
async function cargarDashboard() {
    try {
        const response = await fetch("http://localhost:3001/api/admin/dashboard");
        const json = await response.json();
        if (json.success) {
            document.getElementById("eventosActivos").innerHTML = json.data.eventosActivos;
            document.getElementById("totalBoletos").innerHTML = json.data.totalBoletos;
            document.getElementById("ventasTotales").innerHTML = "$" + (json.data.ventasTotales || 0).toLocaleString("es-MX");
        }
    } catch (error) {
        console.error("Error cargando dashboard:", error);
    }
}

// ========== CREAR EVENTO (ya existente) ==========
async function crearEvento() {
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
            alert("Evento creado exitosamente");
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

// ========== FUNCIONES DE MODAL (CREAR) ==========
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
    document.getElementById("btnEditarEvento").onclick = abrirModalEditar;
    // El botón eliminar queda pendiente
});

async function eliminarEvento() {
    if (!selectedEventoId) {
        alert("Primero selecciona un evento de la tabla");
        return;
    }

    const confirmar = confirm("¿Estás seguro de eliminar este evento?\nSe moverá a histórico y se perderán los boletos no vendidos. Esta acción no se puede deshacer.");
    if (!confirmar) return;

    try {
        const response = await fetch(`http://localhost:3001/api/admin/eliminar-evento/${selectedEventoId}`, {
            method: "DELETE"
        });
        const json = await response.json();
        if (json.success) {
            alert("Evento eliminado correctamente (movido a histórico)");
            // Limpiar selección
            selectedEventoId = null;
            document.getElementById("btnEditarEvento").disabled = true;
            document.getElementById("btnEliminarEvento").disabled = true;
            // Recargar tabla y dashboard
            cargarEventos();
            cargarDashboard();
        } else {
            alert("Error: " + json.message);
        }
    } catch (error) {
        console.error("Error al eliminar evento:", error);
        alert("Error de conexión con el servidor");
    }
}