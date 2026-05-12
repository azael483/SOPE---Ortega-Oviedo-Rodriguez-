document
    .getElementById("loginForm")
    .addEventListener("submit", login);

async function login(e) {

    e.preventDefault();

    const username =
        document.getElementById("username").value;

    const password =
        document.getElementById("password").value;

    try {

        const response = await fetch(

            "http://localhost:3001/api/login",

            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    username,
                    password

                })

            }

        );

        const json = await response.json();

        console.log(json);

        if (!json.success) {

            alert("Usuario incorrecto");
            return;

        }

        /* GUARDAR USUARIO */

        localStorage.setItem(

            "usuario",

            JSON.stringify(json.usuario)

        );

        /* REDIRECCION POR ROL */

        if (json.usuario.rol === "admin") {

            window.location.href = "admin.html";

        }
        else if (json.usuario.rol === "empleado") {

            window.location.href = "empleado.html";

        }
        else {

            window.location.href = "index.html";

        }

    }

    catch (error) {

        console.log(error);

        alert("Error servidor");

    }

}