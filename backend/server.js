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
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "SOPE",
  waitForConnections: true,
  connectionLimit: 10
});

/* TEST MYSQL */

db.getConnection((err, connection) => {

  if(err){
    console.log(err.message);
  } else {
    console.log("✅ MySQL conectado");
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

    if(err){

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

    if(err){

      console.log(err);

      return res.sendStatus(500);

    }

    if(result.length === 0){

      return res.sendStatus(404);

    }

    const imagen = result[0].Imagen;

    if(!imagen){

      return res.sendStatus(404);

    }

    /* tipo imagen */

    res.setHeader("Content-Type", "image/jpeg");

    res.send(imagen);

  });

});

/* START */

app.listen(3001, () => {

  console.log("🚀 Servidor:");
  console.log("http://localhost:3001");

});