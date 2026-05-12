const usuario = JSON.parse(
    localStorage.getItem("usuario")
);

if (!usuario) {

    window.location.href = "login.html";

}

if (usuario.rol !== "admin") {

    window.location.href = "index.html";

}

async function cargarEventos() {

    try {

        const response = await fetch(
            "http://localhost:3001/api/eventos"
        );

        const json = await response.json();

        const eventos = json.data;

        const tabla =
            document.getElementById("tablaEventos");

        tabla.innerHTML = eventos.map(e => `
    <tr>
        <td>${e.ID_Evento}</td>
        <td>${e.Nombre_Evento}</td>
        <td>${e.Ubicacion}</td>
        <td>${new Date(e.Fecha_Evento_Ini).toLocaleDateString("es-MX")}</td>

        <td>${e.Estatus ?? "Sin estatus"}</td>

        <td>${e.Tipo_Reembolso ?? "Sin tipo"}</td>
    </tr>
`).join("");

    }

    catch (error) {

        console.log(error);

    }

}

function logout() {

    localStorage.removeItem("usuario");

    window.location.href = "login.html";

}

/* ABRIR MODAL */

function abrirModalCrear() {

    document.getElementById(
        "modalCrear"
    ).style.display = "flex";

}

/* CERRAR MODAL */

function cerrarModalCrear() {

    document.getElementById(
        "modalCrear"
    ).style.display = "none";

}

/* CREAR EVENTO */

async function crearEvento() {

  const nombre = document.getElementById("nombreEvento").value;
  const id_ubicacion = document.getElementById("ubicacion").value;
  const fecha = document.getElementById("fecha").value;

  const response = await fetch("http://localhost:3001/api/eventos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      nombre,
      id_ubicacion,
      fecha
    })
  });

  const json = await response.json();

  if (json.success) {
    alert("Evento creado");
    cargarEventos();
  } else {
    alert("Error creando evento");
  }
}

cargarEventos();

async function cargarDashboard() {

    try {

        const response = await fetch(

            "http://localhost:3001/api/admin/dashboard"

        );

        const json = await response.json();

        console.log(json);

        document.getElementById(
            "eventosActivos"
        ).innerHTML =
            json.data.eventosActivos;

        document.getElementById(
            "totalBoletos"
        ).innerHTML =
            json.data.totalBoletos;



    }

    catch (error) {

        console.log(error);

    }

}

cargarDashboard();