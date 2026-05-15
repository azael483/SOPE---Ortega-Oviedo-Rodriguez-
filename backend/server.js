const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname + "/../"));

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "952008",
  database: process.env.DB_NAME || "SOPE",
  waitForConnections: true,
  connectionLimit: 10
});

// Test conexión (opcional, para depurar)
db.getConnection((err, conn) => {
  if (err) console.error("Error conectando a MySQL:", err.message);
  else {
    console.log("MySQL conectado");
    conn.release();
  }
});

const router = express.Router();
app.use("/api", router);

// ========== 1. LISTAR EVENTOS (usan VIEW_VER_EVENTOS_TODOS) ==========
router.get("/eventos", (req, res) => {
  // Usar la vista que ya tiene los JOINs y agregar boletos disponibles con la función
  const sql = `
    SELECT 
      ID_Evento,
      Nombre_Evento,
      Ubicacion,
      Fecha_Evento_Ini,
      Estatus,
      Nombre_Tipo_Reembolso,
      Func_Num_Asientos_Disponibles(ID_Evento) AS Boletos_Disponibles
    FROM View_Ver_Eventos_Todos
    ORDER BY Fecha_Evento_Ini DESC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error en /eventos:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
    res.json({ success: true, data: results });
  });
});

// ========== 2. DASHBOARD (usa funciones y vistas) ==========
router.get("/admin/dashboard", (req, res) => {
  // Eventos activos (usando tu vista View_Ver_Eventos_Actuales)
  const sqlActivos = `SELECT COUNT(*) AS activos FROM View_Ver_Eventos_Actuales WHERE Origen = 'Activo'`;
  // Boletos vendidos totales (activos + histórico)
  const sqlVendidos = `
    SELECT 
      (SELECT IFNULL(SUM(Func_Num_Asientos_Vendidos(ID_Evento)), 0) FROM Eventos) +
      (SELECT COUNT(*) FROM Boletos_Vendidos_Historico) AS total
  `;
  db.query(sqlActivos, (err, active) => {
    if (err) {
      console.error("Error en dashboard activos:", err);
      return res.status(500).json({ success: false });
    }
    db.query(sqlVendidos, (err2, vend) => {
      if (err2) {
        console.error("Error en dashboard vendidos:", err2);
        return res.status(500).json({ success: false });
      }
      res.json({
        success: true,
        data: {
          eventosActivos: active[0]?.activos || 0,
          totalBoletos: vend[0]?.total || 0
        }
      });
    });
  });
});

// ========== 3. CREAR EVENTO (llamando a Proc_Añadir_Evento) ==========
router.post("/admin/crear-evento", (req, res) => {
  const {
    nombre, descripcion, fecha_ini, fecha_fin,
    num_filas, asientos_x_fila, costo_produccion,
    tipo_reembolso, estatus, id_artista, id_ubicacion,
    imagen_base64
  } = req.body;

  let imagenBuffer = null;
  if (imagen_base64) {
    imagenBuffer = Buffer.from(imagen_base64.split(",")[1], "base64");
  }

  const sql = `CALL Proc_Añadir_Evento(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.query(sql, [
    nombre,
    descripcion,
    fecha_ini,
    fecha_fin,
    parseInt(num_filas) || 10,
    parseInt(asientos_x_fila) || 20,
    parseInt(costo_produccion) || 0,
    parseInt(tipo_reembolso) || 1,
    parseInt(estatus) || 1,        // estatus del evento (ID_Estatus)
    parseInt(id_artista) || 1,
    parseInt(id_ubicacion),
    imagenBuffer
  ], (err, result) => {
    if (err) {
      console.error("Error al crear evento:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
    res.json({ success: true, message: "Evento creado correctamente" });
  });
});

// ========== 4. LOGIN (sin cambios) ==========
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  const admins = { admin_Jose: "admin", admin_Pepe: "admin" };
  const empleados = { empleado_Azael: "contraseña", empleado_Omar: "contraseña", empleado_Iñaky: "contraseña" };
  if (admins[username] && admins[username] === password) {
    return res.json({ success: true, usuario: { nombre: username.split("_")[1], rol: "admin" } });
  }
  if (empleados[username] && empleados[username] === password) {
    return res.json({ success: true, usuario: { nombre: username.split("_")[1], rol: "empleado" } });
  }
  if (username === "cliente_1" && password === "1234") {
    return res.json({ success: true, usuario: { nombre: "Cliente", rol: "cliente" } });
  }
  res.json({ success: false, message: "Credenciales inválidas" });
});

router.get("/eventos", (req, res) => {
  const sql = "SELECT * FROM Eventos";  // Consulta directa
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, data: results });
  });
});

// ========== OBTENER LISTAS PARA SELECTS ==========
router.get("/admin/artistas", (req, res) => {
  db.query("SELECT ID_Artista, Nombre_Artista FROM Artistas", (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: results });
  });
});

router.get("/admin/ubicaciones", (req, res) => {
  db.query("SELECT ID_Ubicacion, Ubicacion FROM Ubicaciones", (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: results });
  });
});

router.get("/admin/tipos-reembolso", (req, res) => {
  db.query("SELECT ID_Tipo_Reembolso, Nombre_Tipo_Reembolso FROM Tipos_Reembolso", (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: results });
  });
});

router.get("/admin/estatus-eventos", (req, res) => {
  db.query("SELECT ID_Estatus, Estatus FROM Estatus WHERE ID_Estatus IN (1,2,3,4)", (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: results });
  });
});

app.listen(3001, () => console.log("Servidor corriendo en http://localhost:3001"));