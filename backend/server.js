const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API SOPE",
      version: "1.0.0",
      description: "Documentación de la API del sistema SOPE"
    },
    servers: [
      {
        url: "http://localhost:3001"
      }
    ]
  },
  apis: ["./server.js"]
};

const specs = swaggerJsdoc(options);

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs)
);

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.getConnection((err, connection) => {
  if (err) {
    console.log("Error conectando a MySQL:", err);
  } else {
    console.log("Base de datos SOPE conectada");
    connection.release();
  }
});

/*
====================================
RUTA: OBTENER TODOS LOS EVENTOS
GET /eventos
====================================
*/

app.get("/eventos", (req, res) => {
  const sql = `CALL Proc_Obtener_Eventos()`;

  db.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        error: "Error al consultar eventos"
      });
    }

    console.log(result[0]);

    res.json(result[0]);
  });
});

/*
====================================
RUTA: CONSULTAR BOLETO
POST /consultar-boleto
usa:
CALL Proc_Consultar_Boleto(asiento, evento)
====================================
*/

app.post("/consultar-boleto", (req, res) => {
  const { asiento, evento } = req.body;

  if (!asiento || !evento) {
    return res.status(400).json({
      error: "Debes enviar asiento y evento"
    });
  }

  const sql = `CALL Proc_Consultar_Boleto(?, ?)`;

  db.query(sql, [asiento, evento], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        error: err.sqlMessage || "Error al consultar boleto"
      });
    }

    res.json(result[0][0]);
  });
});

/*
====================================
RUTA: CREAR BOLETOS
POST /crear-boletos
usa:
CALL Proc_Crear_Boletos(evento)
====================================
*/

app.post("/crear-boletos", (req, res) => {
  const { evento } = req.body;

  if (!evento) {
    return res.status(400).json({
      error: "Debes enviar el ID del evento"
    });
  }

  const sql = `CALL Proc_Crear_Boletos(?)`;

  db.query(sql, [evento], (err) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        error: err.sqlMessage || "Error al crear boletos"
      });
    }

    res.json({
      mensaje: "Boletos creados correctamente"
    });
  });
});

/*
====================================
RUTA: GENERAR VENTAS RANDOM
POST /ventas-random
usa:
CALL Proc_Random_Ventas(evento)
====================================
*/

app.post("/ventas-random", (req, res) => {
  const { evento } = req.body;

  if (!evento) {
    return res.status(400).json({
      error: "Debes enviar el ID del evento"
    });
  }

  const sql = `CALL Proc_Random_Ventas(?)`;

  db.query(sql, [evento], (err) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        error: err.sqlMessage || "Error al generar ventas"
      });
    }

    res.json({
      mensaje: "Ventas aleatorias generadas correctamente"
    });
  });
});

/*
====================================
RUTA: OBTENER SECCIONES DE UN EVENTO
GET /secciones/:idEvento
====================================
*/

app.get("/secciones/:idEvento", (req, res) => {
  const { idEvento } = req.params;

  const sql = `
    SELECT *
    FROM Secciones
    WHERE ID_Evento = ?
    ORDER BY Fila_Inicio ASC
  `;

  db.query(sql, [idEvento], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        error: "Error al consultar secciones"
      });
    }

    res.json(result);
  });
});

app.get("/", (req, res) => {
  res.send("API SOPE funcionando correctamente");
});


app.listen(3001, () => {
  console.log("Servidor corriendo en puerto 3001");
  console.log("Swagger disponible en:");
  console.log("http://localhost:3001/api-docs");
});