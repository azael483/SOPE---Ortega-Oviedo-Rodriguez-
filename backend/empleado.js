// ─────────────────────────────────────────────────────────────
//  empleado.js
// ─────────────────────────────────────────────────────────────

const API = "http://localhost:3001/api";

// ── Protección de ruta ────────────────────────────────────────
const usuario = JSON.parse(localStorage.getItem("usuario"));

if (!usuario) {
    window.location.href = "login.html";
}

if (usuario.rol !== "empleado") {
    window.location.href = "index.html";
}

// ── Inventario de eventos ─────────────────────────────────────
async function cargarEventos() {

    const tabla = document.getElementById("tablaEventos");

    tabla.innerHTML = `
        <tr>
            <td colspan="5" style="text-align:center; color:#aaa; padding:20px;">
                Cargando eventos...
            </td>
        </tr>
    `;

    try {

        const response = await fetch(`${API}/eventos`);
        const json     = await response.json();
        const eventos  = json.data;

        if (!eventos || eventos.length === 0) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; color:#aaa; padding:20px;">
                        No hay eventos activos
                    </td>
                </tr>
            `;
            return;
        }

        tabla.innerHTML = eventos.map(e => {

            // Color del estatus
            const estatusColor = {
                "Venta de boletos":    "#2dbd6e",
                "Preventa de boletos": "#ffc832",
                "Anunciado":           "#60b0ff",
                "Cancelado":           "#e03030",
                "Finalizado":          "#aaa",
            };

            const color = estatusColor[e.Estatus] || "#aaa";

            // Disponibilidad como barra visual
            const pct = e.Boletos_Disponibles !== null
                ? Math.round((e.Boletos_Disponibles / (e.Boletos_Disponibles + 1)) * 100)
                : null;

            return `
                <tr>
                    <td>${e.Nombre_Evento}</td>
                    <td>${e.Nombre_Artista}</td>
                    <td>
                        <span style="
                            background: ${color}22;
                            color: ${color};
                            padding: 3px 10px;
                            border-radius: 4px;
                            font-size: 12px;
                            font-weight: bold;
                        ">
                            ${e.Estatus}
                        </span>
                    </td>
                    <td style="font-weight:bold; color:#2dbd6e;">
                        ${
                            e.Boletos_Disponibles !== null
                                ? Number(e.Boletos_Disponibles).toLocaleString("es-MX")
                                : "—"
                        }
                    </td>
                    <td style="color:#aaa; font-size:13px;">
                        ${formatearFecha(e.Fecha_Evento_Ini)}
                    </td>
                </tr>
            `;

        }).join("");

    } catch (error) {
        console.error("Error al cargar eventos:", error);
        tabla.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; color:#e03030; padding:20px;">
                    Error al cargar eventos. Verifica que el servidor esté corriendo.
                </td>
            </tr>
        `;
    }

}

// ── Validar boleto ────────────────────────────────────────────
async function validarBoleto() {

    const input     = document.getElementById("boleto");
    const resultado = document.getElementById("resultado");
    const idReserva = input.value.trim();

    resultado.innerHTML = "";

    if (idReserva === "") {
        mostrarResultado("warning", "⚠️", "Ingresa un número de reserva");
        return;
    }

    if (isNaN(idReserva) || parseInt(idReserva) <= 0) {
        mostrarResultado("warning", "⚠️", "El número de reserva debe ser un número válido");
        return;
    }

    resultado.innerHTML = `<span style="color:#aaa; font-size:13px;">Validando...</span>`;

    try {

        const response = await fetch(`${API}/boletos/reserva/${idReserva}`);

        // Protección: si el servidor devuelve HTML en vez de JSON, no explotar
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
            mostrarResultado("error", "!", "Error del servidor",
                `El servidor respondió con estado ${response.status}. Verifica que el backend esté corriendo en ${API}.`
            );
            return;
        }

        const json = await response.json();

        if (!response.ok || !json.ok) {
            mostrarResultado("invalido", "✗",
                `Boleto #${idReserva} — NO ENCONTRADO`,
                "Este número de reserva no existe en el sistema."
            );
            return;
        }

        const boleto = json.data;

        if (boleto.Vendido === true || boleto.Vendido === 1) {
            mostrarResultado(
                "valido", "✓",
                `Boleto #${idReserva} — VÁLIDO`,
                `
                    <strong>Evento:</strong> ${boleto.Titulo || "—"}<br>
                    <strong>Artista:</strong> ${boleto.Artista || "—"}<br>
                    <strong>Sección:</strong> ${boleto.Seccion || "—"}<br>
                    <strong>Asiento:</strong> ${boleto["Asiento particular"] || "—"}<br>
                    <strong>Precio:</strong> $${boleto.Precio ? Number(boleto.Precio).toLocaleString("es-MX") : "—"} MXN
                `
            );
        } else {
            mostrarResultado(
                "invalido", "✗",
                `Boleto #${idReserva} — INVÁLIDO`,
                "Este asiento no ha sido comprado."
            );
        }

    } catch (error) {
        console.error("Error al validar boleto:", error);
        mostrarResultado("error", "!", "Error de conexión",
            `No se pudo contactar al servidor en ${API}. Verifica que esté corriendo.`
        );
    }

}

// ── Helper: renderiza la caja de resultado ────────────────────
function mostrarResultado(tipo, icono, titulo, detalle = "") {

    const colores = {
        valido:  { bg: "#0d3320", border: "#2dbd6e", texto: "#2dbd6e" },
        invalido: { bg: "#3a1212", border: "#e03030", texto: "#e03030" },
        warning:  { bg: "#3a2800", border: "#ffc832", texto: "#ffc832" },
        error:    { bg: "#2a1a2a", border: "#b050ff", texto: "#b050ff" },
    };

    const c = colores[tipo] || colores.error;

    document.getElementById("resultado").innerHTML = `
        <div style="
            background: ${c.bg};
            border: 1px solid ${c.border};
            border-radius: 8px;
            padding: 14px 16px;
            margin-top: 10px;
        ">
            <div style="
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: ${detalle ? "10px" : "0"};
            ">
                <span style="
                    background: ${c.border};
                    color: #fff;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 15px;
                    font-weight: bold;
                    flex-shrink: 0;
                ">${icono}</span>
                <strong style="color: ${c.texto}; font-size: 14px;">${titulo}</strong>
            </div>
            ${detalle ? `<div style="color: #ccc; font-size: 13px; line-height: 1.7; padding-left: 38px;">${detalle}</div>` : ""}
        </div>
    `;

}

// ── Validar también con Enter ─────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {

    const input = document.getElementById("boleto");
    if (input) {
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") validarBoleto();
        });
    }

});

// ── Logout ────────────────────────────────────────────────────
function logout() {
    localStorage.removeItem("usuario");
    window.location.href = "login.html";
}

// ── Helpers ───────────────────────────────────────────────────
function formatearFecha(str) {
    if (!str) return "—";
    return new Date(str).toLocaleString("es-MX", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

// ── Arrancar ──────────────────────────────────────────────────
cargarEventos();