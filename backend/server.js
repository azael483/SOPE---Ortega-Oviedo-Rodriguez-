const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

/* SERVIR HTML */
app.use(express.static(__dirname + "/../"));

/* MYSQL */
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "admin",
  password: process.env.DB_PASSWORD || "Azael483",
  database: process.env.DB_NAME || "SOPE",
  waitForConnections: true,
  connectionLimit: 10
});

/* TEST MYSQL */

db.getConnection((err, connection) => {

  if (err) {
    console.log(err.message);
  } else {
    console.log("MySQL conectado");
    connection.release();
  }

});

/* ROUTER */

const router = express.Router();

app.use("/api", router);

/* EVENTOS */

router.get("/eventos", (req, res) => {

  const sql = `CALL Proc_Consultar_Eventos()`;

  db.query(sql, (err, result) => {

    if (err) {

      console.log(err);

      return res.status(500).json({
        success: false,
        message: err.message
      });

    }

    res.json({
      success: true,
      data: result[0]
    });

  });

});

/* OBTENER IMAGEN DESDE MYSQL */

router.get("/eventos/imagen/:id", (req, res) => {

  const id = req.params.id;

  const sql = `
    SELECT Imagen
    FROM Eventos
    WHERE ID_Evento = ?
  `;

  db.query(sql, [id], (err, result) => {

    if (err) {

      console.log(err);

      return res.sendStatus(500);

    }

    if (result.length === 0) {

      return res.sendStatus(404);

    }

    const imagen = result[0].Imagen;

    if (!imagen) {

      return res.sendStatus(404);

    }

    /* tipo imagen */

    res.setHeader("Content-Type", "image/jpeg");

    res.send(imagen);

  });

});

/* START */

app.listen(3001, () => {

  console.log("Servidor:");
  console.log("http://localhost:3001");

});

/* LOGIN */

router.post("/login", (req, res) => {

  const { username, password } = req.body;

  /* ADMINS */

  if (
    username === "admin_Jose" &&
    password === "admin"
  ) {

    return res.json({

      success: true,

      usuario: {

        nombre: "Jose",
        rol: "admin"

      }

    });

  }

  if (
    username === "admin_Pepe" &&
    password === "admin"
  ) {

    return res.json({

      success: true,

      usuario: {

        nombre: "Pepe",
        rol: "admin"

      }

    });

  }

  /* EMPLEADOS */

  if (
    username === "empleado_Azael" &&
    password === "contraseña"
  ) {

    return res.json({

      success: true,

      usuario: {

        nombre: "Azael",
        rol: "empleado"

      }

    });

  }

  if (
    username === "empleado_Omar" &&
    password === "contraseña"
  ) {

    return res.json({

      success: true,

      usuario: {

        nombre: "Omar",
        rol: "empleado"

      }

    });

  }

  if (
    username === "empleado_Iñaky" &&
    password === "contraseña"
  ) {

    return res.json({

      success: true,

      usuario: {

        nombre: "Iñaky",
        rol: "empleado"

      }

    });

  }

  /* CLIENTE */

  if (
    username === "cliente_1" &&
    password === "1234"
  ) {

    return res.json({

      success: true,

      usuario: {

        nombre: "Cliente",
        rol: "cliente"

      }

    });

  }

  /* ERROR */

  res.json({

    success: false,
    message: "Usuario o contraseña incorrectos"

  });

});

router.get("/admin/dashboard", (req, res) => {

    const sql = `

        SELECT 
        
            COUNT(*) AS eventosActivos,

            (
                SELECT COUNT(*)
                FROM Boletos_Vendidos
            ) AS totalBoletos

        FROM Eventos

    `;

    db.query(sql, (err, result) => {

        if(err){

            console.log(err);

            return res.status(500).json({
                success:false
            });

        }

        res.json({

            success:true,
            data: result[0]

        });

    });

});

/* CREAR EVENTO */

router.post("/admin/crear-evento", (req, res) => {

    const {
    nombre,
    id_ubicacion,
    fecha
  } = req.body;

  const sql = `
    INSERT INTO Eventos (
      Nombre_Evento,
      ID_Ubicacion,
      Fecha_Evento_Ini,
      Estatus
    )
    VALUES (?, ?, ?, 'Activo')
  `;

  db.query(
    sql,
    [nombre, id_ubicacion, fecha],
    (err, result) => {

      if (err) {
        console.log(err);
        return res.status(500).json({
          success: false,
          message: err.message
        });
      }

      res.json({
        success: true
      });

    }
  );

});
router.put("/admin/editar-evento/:id", (req, res) => {
    const id = req.params.id;
    const {
        nombre,
        ubicacion, // ID_Ubicacion en tu DB
        artista,   // ID_Artista en tu DB
        fecha,
        estatus    // ID_Estatus en tu DB
    } = req.body;

    // Llamamos al procedimiento Proc_Cambiar_Evento de tu archivo sope_creacion.sql
    // El orden de parámetros es: _ID_Evento, _Nombre_Evento, _ID_Ubicacion, _ID_Artista, _Fecha_Evento_Ini, _Estatus_evento
    const sql = `CALL Proc_Cambiar_Evento(?, ?, ?, ?, ?, ?)`;

    db.query(
        sql,
        [id, nombre || null, ubicacion || null, artista || null, fecha || null, estatus || null],
        (err, result) => {
            if (err) {
                console.log("Error al ejecutar Proc_Cambiar_Evento:", err);
                return res.status(500).json({
                    success: false,
                    message: "Error en la base de datos"
                });
            }

            res.json({
                success: true,
                message: "Evento actualizado correctamente"
            });
        }
    );
});