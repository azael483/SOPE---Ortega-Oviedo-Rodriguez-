/**
 * @fileoverview Panel de administración de SOPEMASTER.
 * Control de eventos: listar, crear, editar, eliminar (mover a histórico) y dashboard.
 * @requires localStorage - Almacena la sesión del usuario.
 * @requires Fetch API - Comunicación con el backend en http://localhost:3001/api
 */

// ==============================
// VERIFICACIÓN DE SESIÓN Y ROL
// ==============================

/** @type {object|null} Usuario obtenido de localStorage */
const usuario = JSON.parse(localStorage.getItem("usuario"));

// Si no hay usuario o no es administrador, redirigir al login
if (!usuario || usuario.rol !== "admin") {
  window.location.href = "login.html";
}

/** @type {number|null} ID del evento seleccionado en la tabla */
let selectedEventoId = null;

/** @type {HTMLTableRowElement|null} Fila de la tabla que está resaltada */
let filaSeleccionada = null;

// ==============================
// CARGA DE SELECTORES DINÁMICOS
// ==============================

/**
 * Carga las listas desplegables (selects) para los formularios de creación y edición de eventos.
 * Los datos se obtienen de los endpoints:
 * - /api/admin/artistas
 * - /api/admin/ubicaciones
 * - /api/admin/tipos-reembolso
 * - /api/admin/estatus-eventos (solo para creación, IDs 1-4)
 * - /api/admin/estatus-todos (para edición, incluye finalizado/cancelado)
 * 
 * @async
 * @function cargarSelects
 * @returns {Promise<void>}
 * @throws {Error} Si falla alguna petición (se captura internamente y se muestra en consola).
 */
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

    // Estatus para crear evento (solo IDs 1-4)
    const estatusResp = await fetch("http://localhost:3001/api/admin/estatus-eventos");
    const estatus = await estatusResp.json();
    if (estatus.success) {
      const options = estatus.data.map(e => `<option value="${e.ID_Estatus}">${e.Estatus}</option>`).join("");
      document.getElementById("estatusEvento").innerHTML = options;
    }

    // Estatus para editar (todos, incluidos 5-Finalizado y 6-Cancelado)
    const todosEstatusResp = await fetch("http://localhost:3001/api/admin/estatus-todos");
    const todosEstatus = await todosEstatusResp.json();
    if (todosEstatus.success) {
      document.getElementById("edit_estatusEvento").innerHTML = todosEstatus.data.map(e => `<option value="${e.ID_Estatus}">${e.Estatus}</option>`).join("");
    }
  } catch (error) {
    console.error("Error cargando selects:", error);
  }
}

// ==============================
// LISTADO DE EVENTOS (TABLA)
// ==============================

/**
 * Obtiene la lista de eventos desde el backend y renderiza la tabla HTML.
 * Endpoint: GET /api/eventos
 * 
 * La respuesta esperada:
 * {
 *   success: true,
 *   data: Array<{
 *     ID_Evento: number,
 *     Nombre_Evento: string,
 *     Ubicacion: string,
 *     Fecha_Evento_Ini: string (ISO),
 *     Estatus: string,
 *     Nombre_Tipo_Reembolso: string
 *   }>
 * }
 * 
 * @async
 * @function cargarEventos
 * @returns {Promise<void>}
 * @throws {Error} Si la petición falla (se captura y muestra en consola).
 */
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

// ==============================
// SELECCIÓN DE EVENTO (FILA)
// ==============================

/**
 * Maneja el clic en una fila de la tabla de eventos.
 * Resalta la fila seleccionada, guarda su ID y habilita los botones de editar/eliminar.
 * 
 * @param {HTMLTableRowElement} fila - La fila del evento que se ha clickeado.
 * @param {number} id - ID del evento.
 */
function seleccionarEvento(fila, id) {
  // Remover resalte anterior
  if (filaSeleccionada) {
    filaSeleccionada.classList.remove("seleccionado");
  }
  // Resaltar nueva fila
  fila.classList.add("seleccionado");
  filaSeleccionada = fila;

  selectedEventoId = id;
  const btnEditar = document.getElementById("btnEditarEvento");
  const btnEliminar = document.getElementById("btnEliminarEvento");
  btnEditar.disabled = false;
  btnEliminar.disabled = false;
}

// ==============================
// MODAL DE EDICIÓN
// ==============================

/**
 * Abre el modal de edición y precarga los datos del evento seleccionado.
 * Obtiene la lista completa de eventos y filtra por ID.
 * 
 * @async
 * @function abrirModalEditar
 * @returns {Promise<void>}
 * @throws {Error} Si no se encuentra el evento o falla la petición.
 */
async function abrirModalEditar() {
  if (!selectedEventoId) return;
  try {
    const response = await fetch("http://localhost:3001/api/eventos");
    const json = await response.json();
    const evento = json.data.find(e => e.ID_Evento == selectedEventoId);
    if (!evento) {
      alert("No se encontraron datos del evento");
      return;
    }

    // Llenar campos del formulario de edición
    document.getElementById("edit_idEvento").value = evento.ID_Evento;
    document.getElementById("edit_nombreEvento").value = evento.Nombre_Evento || "";
    document.getElementById("edit_descripcionEvento").value = evento.Descripcion_Evento || "";
    document.getElementById("edit_fechaIniEvento").value = evento.Fecha_Evento_Ini ? evento.Fecha_Evento_Ini.slice(0, 16) : "";
    document.getElementById("edit_fechaFinEvento").value = evento.Fecha_Evento_Fin ? evento.Fecha_Evento_Fin.slice(0, 16) : "";
    document.getElementById("edit_numFilas").value = evento.Num_Filas || "";
    document.getElementById("edit_asientosPorFila").value = evento.Asientos_x_Fila || "";
    document.getElementById("edit_costoProduccion").value = evento.Costo_Produccion_Evento || "";

    // Seleccionar valores en los desplegables
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

/**
 * Envía los datos actualizados del evento al backend.
 * Endpoint: PUT /api/admin/editar-evento/:id
 * 
 * @async
 * @function actualizarEvento
 * @returns {Promise<void>}
 * @throws {Error} Si la petición falla.
 */
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
    imagen_base64: null, // Por ahora no se soporta imagen en edición
  };

  try {
    const response = await fetch(`http://localhost:3001/api/admin/editar-evento/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await response.json();
    if (json.success) {
      alert("Evento actualizado correctamente");
      cerrarModalEditar();
      cargarEventos();       // Refrescar tabla
      cargarDashboard();     // Refrescar métricas
    } else {
      alert("Error: " + json.message);
    }
  } catch (error) {
    console.error("Error al actualizar evento:", error);
    alert("Error de conexión con el servidor");
  }
}

/**
 * Cierra el modal de edición.
 */
function cerrarModalEditar() {
  document.getElementById("modalEditar").style.display = "none";
}

// ==============================
// DASHBOARD (MÉTRICAS)
// ==============================

/**
 * Obtiene las métricas del dashboard y las muestra en las tarjetas.
 * Endpoint: GET /api/admin/dashboard
 * 
 * La respuesta esperada:
 * {
 *   success: true,
 *   data: {
 *     eventosActivos: number,
 *     totalBoletos: number,
 *     ventasTotales: number
 *   }
 * }
 * 
 * @async
 * @function cargarDashboard
 * @returns {Promise<void>}
 */
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

// ==============================
// CREAR EVENTO (MODAL)
// ==============================

/**
 * Envía los datos del nuevo evento al backend.
 * Endpoint: POST /api/admin/crear-evento
 * 
 * @async
 * @function crearEvento
 * @returns {Promise<void>}
 * @throws {Error} Si la petición falla o faltan datos.
 */
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

  const payload = {
    nombre, descripcion, fecha_ini, fecha_fin,
    num_filas, asientos_x_fila, costo_produccion,
    tipo_reembolso, estatus, id_artista, id_ubicacion,
    imagen_base64: null
  };

  try {
    const response = await fetch("http://localhost:3001/api/admin/crear-evento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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

// ==============================
// MODAL DE CREACIÓN
// ==============================

/** Abre el modal de creación de eventos. */
function abrirModalCrear() {
  document.getElementById("modalCrear").style.display = "flex";
}

/** Cierra el modal de creación. */
function cerrarModalCrear() {
  document.getElementById("modalCrear").style.display = "none";
}

// ==============================
// ELIMINAR EVENTO (MOVER A HISTÓRICO)
// ==============================

/**
 * Elimina (mueve a histórico) el evento seleccionado.
 * Endpoint: DELETE /api/admin/eliminar-evento/:id
 * Muestra confirmación antes de ejecutar.
 * 
 * @async
 * @function eliminarEvento
 * @returns {Promise<void>}
 */
async function eliminarEvento() {
  if (!selectedEventoId) {
    alert("Primero selecciona un evento de la tabla");
    return;
  }

  const confirmar = confirm("¿Estás seguro de eliminar este evento?\nSe moverá a histórico y se perderán los boletos no vendidos. Esta acción no se puede deshacer.");
  if (!confirmar) return;

  try {
    const response = await fetch(`http://localhost:3001/api/admin/eliminar-evento/${selectedEventoId}`, {
      method: "DELETE",
    });
    const json = await response.json();
    if (json.success) {
      alert("Evento eliminado correctamente (movido a histórico)");
      // Limpiar selección
      selectedEventoId = null;
      if (filaSeleccionada) {
        filaSeleccionada.classList.remove("seleccionado");
        filaSeleccionada = null;
      }
      document.getElementById("btnEditarEvento").disabled = true;
      document.getElementById("btnEliminarEvento").disabled = true;
      // Recargar datos
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

// ==============================
// CIERRE DE SESIÓN
// ==============================

/**
 * Elimina la sesión del usuario de localStorage y redirige al login.
 */
function logout() {
  localStorage.removeItem("usuario");
  window.location.href = "login.html";
}

// ==============================
// INICIALIZACIÓN
// ==============================

/**
 * Punto de entrada: cuando el DOM está listo, carga los selectores,
 * la tabla de eventos, el dashboard y asigna el manejador del botón editar.
 * El botón eliminar ya tiene onclick en el HTML.
 */
document.addEventListener("DOMContentLoaded", () => {
  cargarSelects();
  cargarEventos();
  cargarDashboard();
  document.getElementById("btnEditarEvento").onclick = abrirModalEditar;
  // Nota: El botón eliminar ya tiene onclick="eliminarEvento()" en el HTML,
  // por lo que no es necesario asignarlo aquí.
});