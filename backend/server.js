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
  user: process.env.DB_USER || "admin",
  password: process.env.DB_PASSWORD || "Azael483",
  database: process.env.DB_NAME || "SOPE",
  waitForConnections: true,
  connectionLimit: 10,
  multipleStatements: true 
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
  // 1. Eventos activos
  const sqlActivos = `
    SELECT COUNT(*) AS activos
    FROM Eventos e
    WHERE e.Fecha_Evento_Fin >= NOW()
      AND e.Estatus_evento NOT IN (5, 6)
  `;
  
  // 2. Boletos vendidos (cantidad)
  const sqlCantidadVendidos = `
    SELECT 
      (SELECT IFNULL(SUM(Vendido), 0) FROM Boletos_Vendidos) +
      (SELECT COUNT(*) FROM Boletos_Vendidos_Historico) AS total
  `;
  
  // 3. Ventas totales en dinero (usando la función de precio)
  // Para boletos activos vendidos
  const sqlVentasActivas = `
    SELECT IFNULL(SUM(Func_Precio_Boleto(Asiento, ID_Evento)), 0) AS total
    FROM Boletos_Vendidos
    WHERE Vendido = 1
  `;
  // Para boletos históricos (todos están vendidos)
  const sqlVentasHistorico = `
    SELECT IFNULL(SUM(Func_Precio_Boleto(Asiento, ID_Evento)), 0) AS total
    FROM Boletos_Vendidos_Historico
  `;
  
  // Ejecutar consultas en paralelo (usando Promise o anidamiento)
  db.query(sqlActivos, (err, active) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    
    db.query(sqlCantidadVendidos, (err2, cantidad) => {
      if (err2) return res.status(500).json({ success: false, message: err2.message });
      
      db.query(sqlVentasActivas, (err3, ventasAct) => {
        if (err3) return res.status(500).json({ success: false, message: err3.message });
        
        db.query(sqlVentasHistorico, (err4, ventasHist) => {
          if (err4) return res.status(500).json({ success: false, message: err4.message });
          
          const totalVentas = (ventasAct[0]?.total || 0) + (ventasHist[0]?.total || 0);
          
          res.json({
            success: true,
            data: {
              eventosActivos: active[0]?.activos || 0,
              totalBoletos: cantidad[0]?.total || 0,
              ventasTotales: totalVentas
            }
          });
        });
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

router.get("/admin/estatus-todos", (req, res) => {
  db.query("SELECT ID_Estatus, Estatus FROM Estatus", (err, results) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, data: results });
  });
});

router.put("/admin/editar-evento/:id", (req, res) => {
  const id = req.params.id;
  const {
    nombre, descripcion, fecha_ini, fecha_fin,
    num_filas, asientos_x_fila, costo_produccion,
    tipo_reembolso, estatus, id_artista, id_ubicacion,
    imagen_base64
  } = req.body;

  let imagenBuffer = null;
  if (imagen_base64) imagenBuffer = Buffer.from(imagen_base64.split(",")[1], "base64");

  const sql = `CALL Proc_Cambiar_Evento(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.query(sql, [
    id, nombre, descripcion, fecha_ini, fecha_fin,
    num_filas, asientos_x_fila, costo_produccion,
    tipo_reembolso, estatus, id_artista, id_ubicacion,
    imagenBuffer
  ], (err, result) => {
    if (err) {
      console.error("Error al editar evento:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
    res.json({ success: true, message: "Evento actualizado" });
  });
});

router.delete("/admin/eliminar-evento/:id", (req, res) => {
  const eventoId = req.params.id;
  console.log(`Intentando eliminar evento ID: ${eventoId}`);

  // Obtener una conexión del pool para manejar la transacción
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Error al obtener conexión:", err);
      return res.status(500).json({ success: false, message: "Error de conexión a BD" });
    }

    // Iniciar transacción
    connection.beginTransaction(err => {
      if (err) {
        console.error("Error al iniciar transacción:", err);
        connection.release();
        return res.status(500).json({ success: false, message: "Error al iniciar transacción" });
      }

      // 1. Insertar evento en histórico
      const sqlEvento = `
        INSERT INTO Eventos_Historico (
          ID_Evento, Nombre_Evento, Descripcion_Evento, Fecha_Evento_Ini, Fecha_Evento_Fin,
          Num_Filas, Asientos_x_Fila, Costo_Produccion_Evento, Tipo_Reembolso,
          Estatus_evento, ID_Artista, ID_Ubicacion, Imagen
        )
        SELECT 
          ID_Evento, Nombre_Evento, Descripcion_Evento, Fecha_Evento_Ini, Fecha_Evento_Fin,
          Num_Filas, Asientos_x_Fila, Costo_Produccion_Evento, Tipo_Reembolso,
          6, ID_Artista, ID_Ubicacion, Imagen
        FROM Eventos
        WHERE ID_Evento = ?
      `;
      connection.query(sqlEvento, [eventoId], (err, result) => {
        if (err) {
          console.error("Error al insertar evento en histórico:", err);
          return connection.rollback(() => {
            connection.release();
            res.status(500).json({ success: false, message: err.message });
          });
        }
        console.log(`Evento ${eventoId} insertado en histórico, filas afectadas: ${result.affectedRows}`);

        // 2. Mover secciones a histórico
        const sqlSecciones = `INSERT INTO Secciones_Historico SELECT * FROM Secciones WHERE ID_Evento = ?`;
        connection.query(sqlSecciones, [eventoId], (err, result) => {
          if (err) {
            console.error("Error al mover secciones:", err);
            return connection.rollback(() => {
              connection.release();
              res.status(500).json({ success: false, message: err.message });
            });
          }
          console.log(`Secciones movidas: ${result.affectedRows}`);

          // 3. Mover boletos vendidos a histórico
          const sqlBoletosVendidos = `
            INSERT INTO Boletos_Vendidos_Historico (ID_Reserva, ID_Evento, Asiento)
            SELECT ID_Reserva, ID_Evento, Asiento
            FROM Boletos_Vendidos
            WHERE ID_Evento = ? AND Vendido = 1
          `;
          connection.query(sqlBoletosVendidos, [eventoId], (err, result) => {
            if (err) {
              console.error("Error al mover boletos vendidos:", err);
              return connection.rollback(() => {
                connection.release();
                res.status(500).json({ success: false, message: err.message });
              });
            }
            console.log(`Boletos vendidos movidos: ${result.affectedRows}`);

            // 4. Eliminar todos los boletos del evento (incluidos no vendidos)
            const sqlDeleteBoletos = `DELETE FROM Boletos_Vendidos WHERE ID_Evento = ?`;
            connection.query(sqlDeleteBoletos, [eventoId], (err, result) => {
              if (err) {
                console.error("Error al eliminar boletos:", err);
                return connection.rollback(() => {
                  connection.release();
                  res.status(500).json({ success: false, message: err.message });
                });
              }
              console.log(`Boletos eliminados de la tabla activa: ${result.affectedRows}`);

              // 5. Eliminar secciones
              const sqlDeleteSecciones = `DELETE FROM Secciones WHERE ID_Evento = ?`;
              connection.query(sqlDeleteSecciones, [eventoId], (err, result) => {
                if (err) {
                  console.error("Error al eliminar secciones:", err);
                  return connection.rollback(() => {
                    connection.release();
                    res.status(500).json({ success: false, message: err.message });
                  });
                }
                console.log(`Secciones eliminadas: ${result.affectedRows}`);

                // 6. Eliminar evento
                const sqlDeleteEvento = `DELETE FROM Eventos WHERE ID_Evento = ?`;
                connection.query(sqlDeleteEvento, [eventoId], (err, result) => {
                  if (err) {
                    console.error("Error al eliminar evento:", err);
                    return connection.rollback(() => {
                      connection.release();
                      res.status(500).json({ success: false, message: err.message });
                    });
                  }
                  console.log(`Evento eliminado de tabla activa: ${result.affectedRows}`);

                  // Confirmar transacción
                  connection.commit(err => {
                    if (err) {
                      console.error("Error al hacer commit:", err);
                      return connection.rollback(() => {
                        connection.release();
                        res.status(500).json({ success: false, message: "Error al guardar cambios" });
                      });
                    }
                    connection.release();
                    res.json({ success: true, message: "Evento movido a histórico correctamente" });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

app.listen(3001, () => console.log("Servidor corriendo en http://localhost:3001"));