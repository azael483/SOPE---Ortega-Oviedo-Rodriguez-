const usuario = JSON.parse(

    localStorage.getItem("usuario")

);

if(!usuario){

    window.location.href =
        "login.html";

}

if(usuario.Rol !== "empleado"){

    window.location.href =
        "index.html";

}

async function cargarEventos(){

    try{

        const response = await fetch(
            "http://localhost:3001/api/eventos"
        );

        const json = await response.json();

        const eventos = json.data;

        const tabla =
            document.getElementById("tablaEventos");

        tabla.innerHTML =
            eventos.map(e => `

                <tr>

                    <td>
                        ${e.Nombre_Evento}
                    </td>

                    <td>
                        ${Math.floor(
                            Math.random() * 300
                        )}
                    </td>

                </tr>

            `).join("");

    }

    catch(error){

        console.log(error);

    }

}

function validarBoleto(){

    const boleto =
        document.getElementById("boleto").value;

    const resultado =
        document.getElementById("resultado");

    if(boleto === ""){

        resultado.innerHTML =
            "Ingresa un ID";

        return;

    }

    resultado.innerHTML =
        `Boleto ${boleto} validado`;

}

function logout(){

    localStorage.removeItem("usuario");

    window.location.href =
        "login.html";

}

cargarEventos();