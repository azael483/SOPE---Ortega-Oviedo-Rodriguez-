const express = require("express");
const mysql = require("mysql2");
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

/* SERVIR HTML */
app.use(express.static(__dirname));

/* MYSQL */
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "SOPE",
  waitForConnections: true,
  connectionLimit: 10
});

/* TEST DB */
db.getConnection((err, connection) => {

  if (err) {
    console.log("Error MySQL:", err.message);
  } else {
    console.log("MySQL conectado");
    connection.release();
  }

});

/* ROUTER */
const router = express.Router();

app.use("/api", router);

/* OBTENER EVENTOS */
router.get("/eventos", (req, res) => {

  const sql = `CALL Proc_Obtener_Eventos()`;

  db.query(sql, (err, result) => {

    if (err) {
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

/* START */
app.listen(3001, () => {
  console.log("Servidor en http://localhost:3001");
});