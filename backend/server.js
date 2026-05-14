const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require("dotenv").config();

// 1. Crear la app
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname + "/../"));

// 2. Configuración de Swagger (después de app)
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API SOPEMASTER',
      version: '1.0.0',
      description: 'Documentación de la API para el sistema de venta de boletos',
    },
    servers: [{ url: 'http://localhost:3001/api', description: 'Servidor local' }],
  },
  apis: [__filename], // escanea este mismo archivo
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ==============================
// Base de datos
// ==============================
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "admin",
  password: process.env.DB_PASSWORD || "Azael483",
  database: process.env.DB_NAME || "SOPE",
  waitForConnections: true,
  connectionLimit: 10,
  multipleStatements: true,
});

db.getConnection((err, conn) => {
  if (err) console.error("Error conectando a MySQL:", err.message);
  else {
    console.log("MySQL conectado");
    conn.release();
  }
});

const router = express.Router();
app.use("/api", router);

// ========== 1. LISTAR EVENTOS (vista) ==========
/**
 * @swagger
 * /eventos:
 *   get:
 *     summary: Obtiene todos los eventos (activos + históricos) con detalles
 *     tags: [Eventos]
 *     responses:
 *       200:
 *         description: Lista de eventos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ID_Evento:
 *                         type: integer
 *                       Nombre_Evento:
 *                         type: string
 *                       Ubicacion:
 *                         type: string
 *                       Fecha_Evento_Ini:
 *                         type: string
 *                         format: date-time
 *                       Estatus:
 *                         type: string
 *                       Nombre_Tipo_Reembolso:
 *                         type: string
 *                       Boletos_Disponibles:
 *                         type: integer
 *       500:
 *         description: Error del servidor
 */
router.get("/eventos", (req, res) => {
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

// ========== DASHBOARD ==========
/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Métricas del panel administrativo
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Datos del dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     eventosActivos:
 *                       type: integer
 *                     totalBoletos:
 *                       type: integer
 *                     ventasTotales:
 *                       type: integer
 *       500:
 *         description: Error del servidor
 */
router.get("/admin/dashboard", (req, res) => {
  const sqlActivos = `
    SELECT COUNT(*) AS activos
    FROM Eventos e
    WHERE e.Fecha_Evento_Fin >= NOW()
      AND e.Estatus_evento NOT IN (5, 6)
  `;
  const sqlCantidadVendidos = `
    SELECT 
      (SELECT IFNULL(SUM(Vendido), 0) FROM Boletos_Vendidos) +
      (SELECT COUNT(*) FROM Boletos_Vendidos_Historico) AS total
  `;
  const sqlVentasActivas = `
    SELECT IFNULL(SUM(Func_Precio_Boleto(Asiento, ID_Evento)), 0) AS total
    FROM Boletos_Vendidos
    WHERE Vendido = 1
  `;
  const sqlVentasHistorico = `
    SELECT IFNULL(SUM(Func_Precio_Boleto(Asiento, ID_Evento)), 0) AS total
    FROM Boletos_Vendidos_Historico
  `;

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
              ventasTotales: totalVentas,
            },
          });
        });
      });
    });
  });
});

// ========== CREAR EVENTO ==========
/**
 * @swagger
 * /admin/crear-evento:
 *   post:
 *     summary: Crea un nuevo evento
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - fecha_ini
 *               - fecha_fin
 *               - num_filas
 *               - asientos_x_fila
 *               - tipo_reembolso
 *               - estatus
 *               - id_artista
 *               - id_ubicacion
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               fecha_ini:
 *                 type: string
 *                 format: date-time
 *               fecha_fin:
 *                 type: string
 *                 format: date-time
 *               num_filas:
 *                 type: integer
 *               asientos_x_fila:
 *                 type: integer
 *               costo_produccion:
 *                 type: integer
 *               tipo_reembolso:
 *                 type: integer
 *               estatus:
 *                 type: integer
 *               id_artista:
 *                 type: integer
 *               id_ubicacion:
 *                 type: integer
 *               imagen_base64:
 *                 type: string
 *     responses:
 *       200:
 *         description: Evento creado exitosamente
 *       500:
 *         description: Error del servidor
 */
router.post("/admin/crear-evento", (req, res) => {
  const {
    nombre,
    descripcion,
    fecha_ini,
    fecha_fin,
    num_filas,
    asientos_x_fila,
    costo_produccion,
    tipo_reembolso,
    estatus,
    id_artista,
    id_ubicacion,
    imagen_base64,
  } = req.body;

  let imagenBuffer = null;
  if (imagen_base64) {
    imagenBuffer = Buffer.from(imagen_base64.split(",")[1], "base64");
  }

  const sql = `CALL Proc_Añadir_Evento(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.query(
    sql,
    [
      nombre,
      descripcion,
      fecha_ini,
      fecha_fin,
      parseInt(num_filas) || 10,
      parseInt(asientos_x_fila) || 20,
      parseInt(costo_produccion) || 0,
      parseInt(tipo_reembolso) || 1,
      parseInt(estatus) || 1,
      parseInt(id_artista) || 1,
      parseInt(id_ubicacion),
      imagenBuffer,
    ],
    (err, result) => {
      if (err) {
        console.error("Error al crear evento:", err);
        return res.status(500).json({ success: false, message: err.message });
      }
      res.json({ success: true, message: "Evento creado correctamente" });
    }
  );
});

// ========== LOGIN ==========
/**
 * @swagger
 * /login:
 *   post:
 *     summary: Autenticación de usuarios
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     nombre:
 *                       type: string
 *                     rol:
 *                       type: string
 *       401:
 *         description: Credenciales inválidas
 */
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  const admins = { admin_Jose: "admin", admin_Pepe: "admin" };
  const empleados = {
    empleado_Azael: "contraseña",
    empleado_Omar: "contraseña",
    empleado_Iñaky: "contraseña",
  };
  if (admins[username] && admins[username] === password) {
    return res.json({
      success: true,
      usuario: { nombre: username.split("_")[1], rol: "admin" },
    });
  }
  if (empleados[username] && empleados[username] === password) {
    return res.json({
      success: true,
      usuario: { nombre: username.split("_")[1], rol: "empleado" },
    });
  }
  if (username === "cliente_1" && password === "1234") {
    return res.json({
      success: true,
      usuario: { nombre: "Cliente", rol: "cliente" },
    });
  }
  res.json({ success: false, message: "Credenciales inválidas" });
});

// NOTA: Este segundo endpoint /eventos SOBRESCRIBE al primero.
// Se mantiene para compatibilidad (devuelve todos los campos de Eventos)
/**
 * @swagger
 * /eventos:
 *   get:
 *     summary: Obtiene todos los eventos (solo tabla Eventos)
 *     tags: [Eventos]
 *     responses:
 *       200:
 *         description: Lista de eventos sin JOINs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Error del servidor
 */
router.get("/eventos", (req, res) => {
  const sql = "SELECT * FROM Eventos";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, data: results });
  });
});

// ========== CATÁLOGOS PARA SELECTS ==========
/**
 * @swagger
 * /admin/artistas:
 *   get:
 *     summary: Lista de artistas
 *     tags: [Catálogos]
 *     responses:
 *       200:
 *         description: Lista de artistas
 */
router.get("/admin/artistas", (req, res) => {
  db.query("SELECT ID_Artista, Nombre_Artista FROM Artistas", (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: results });
  });
});

/**
 * @swagger
 * /admin/ubicaciones:
 *   get:
 *     summary: Lista de ubicaciones
 *     tags: [Catálogos]
 */
router.get("/admin/ubicaciones", (req, res) => {
  db.query("SELECT ID_Ubicacion, Ubicacion FROM Ubicaciones", (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: results });
  });
});

/**
 * @swagger
 * /admin/tipos-reembolso:
 *   get:
 *     summary: Tipos de reembolso disponibles
 *     tags: [Catálogos]
 */
router.get("/admin/tipos-reembolso", (req, res) => {
  db.query(
    "SELECT ID_Tipo_Reembolso, Nombre_Tipo_Reembolso FROM Tipos_Reembolso",
    (err, results) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, data: results });
    }
  );
});

/**
 * @swagger
 * /admin/estatus-eventos:
 *   get:
 *     summary: Estatus válidos para crear/editar eventos (1-4)
 *     tags: [Catálogos]
 */
router.get("/admin/estatus-eventos", (req, res) => {
  db.query(
    "SELECT ID_Estatus, Estatus FROM Estatus WHERE ID_Estatus IN (1,2,3,4)",
    (err, results) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, data: results });
    }
  );
});

/**
 * @swagger
 * /admin/estatus-todos:
 *   get:
 *     summary: Todos los estatus (incluidos finalizado/cancelado)
 *     tags: [Catálogos]
 */
router.get("/admin/estatus-todos", (req, res) => {
  db.query("SELECT ID_Estatus, Estatus FROM Estatus", (err, results) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, data: results });
  });
});

// ========== EDITAR EVENTO ==========
/**
 * @swagger
 * /admin/editar-evento/{id}:
 *   put:
 *     summary: Actualiza un evento existente
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               fecha_ini:
 *                 type: string
 *                 format: date-time
 *               fecha_fin:
 *                 type: string
 *                 format: date-time
 *               num_filas:
 *                 type: integer
 *               asientos_x_fila:
 *                 type: integer
 *               costo_produccion:
 *                 type: integer
 *               tipo_reembolso:
 *                 type: integer
 *               estatus:
 *                 type: integer
 *               id_artista:
 *                 type: integer
 *               id_ubicacion:
 *                 type: integer
 *               imagen_base64:
 *                 type: string
 *     responses:
 *       200:
 *         description: Evento actualizado
 *       500:
 *         description: Error del servidor
 */
router.put("/admin/editar-evento/:id", (req, res) => {
  const id = req.params.id;
  const {
    nombre,
    descripcion,
    fecha_ini,
    fecha_fin,
    num_filas,
    asientos_x_fila,
    costo_produccion,
    tipo_reembolso,
    estatus,
    id_artista,
    id_ubicacion,
    imagen_base64,
  } = req.body;

  let imagenBuffer = null;
  if (imagen_base64)
    imagenBuffer = Buffer.from(imagen_base64.split(",")[1], "base64");

  const sql = `CALL Proc_Cambiar_Evento(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.query(
    sql,
    [
      id,
      nombre,
      descripcion,
      fecha_ini,
      fecha_fin,
      num_filas,
      asientos_x_fila,
      costo_produccion,
      tipo_reembolso,
      estatus,
      id_artista,
      id_ubicacion,
      imagenBuffer,
    ],
    (err, result) => {
      if (err) {
        console.error("Error al editar evento:", err);
        return res.status(500).json({ success: false, message: err.message });
      }
      res.json({ success: true, message: "Evento actualizado" });
    }
  );
});

// ========== ELIMINAR (Mover a histórico) ==========
/**
 * @swagger
 * /admin/eliminar-evento/{id}:
 *   delete:
 *     summary: Mueve un evento y sus datos relacionados a histórico (cancelado)
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Evento movido a histórico
 *       500:
 *         description: Error del servidor
 */
router.delete("/admin/eliminar-evento/:id", (req, res) => {
  const eventoId = req.params.id;
  console.log(`Intentando eliminar evento ID: ${eventoId}`);

  db.getConnection((err, connection) => {
    if (err) {
      console.error("Error al obtener conexión:", err);
      return res.status(500).json({ success: false, message: "Error de conexión a BD" });
    }

    connection.beginTransaction((err) => {
      if (err) {
        console.error("Error al iniciar transacción:", err);
        connection.release();
        return res.status(500).json({ success: false, message: "Error al iniciar transacción" });
      }

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

                  connection.commit((err) => {
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

/**
 * @swagger
 * /eventos/imagen/{id}:
 *   get:
 *     summary: Obtiene la imagen de un evento
 *     tags: [Eventos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del evento (activo o histórico)
 *     responses:
 *       200:
 *         description: Imagen del evento en formato JPEG
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Evento o imagen no encontrada
 *       500:
 *         description: Error del servidor
 */
router.get("/eventos/imagen/:id", (req, res) => {
  const id = req.params.id;
  // Primero buscar en Eventos activos
  const sqlActivo = "SELECT Imagen FROM Eventos WHERE ID_Evento = ?";
  db.query(sqlActivo, [id], (err, results) => {
    if (err) {
      console.error("Error al obtener imagen:", err);
      return res.status(500).send("Error del servidor");
    }
    if (results.length > 0 && results[0].Imagen) {
      res.setHeader("Content-Type", "image/jpeg");
      return res.send(results[0].Imagen);
    }
    // Si no está en activos, buscar en histórico
    const sqlHistorico = "SELECT Imagen FROM Eventos_Historico WHERE ID_Evento = ?";
    db.query(sqlHistorico, [id], (err2, results2) => {
      if (err2) {
        console.error("Error al obtener imagen de histórico:", err2);
        return res.status(500).send("Error del servidor");
      }
      if (results2.length > 0 && results2[0].Imagen) {
        res.setHeader("Content-Type", "image/jpeg");
        return res.send(results2[0].Imagen);
      }
      res.status(404).send("Imagen no encontrada");
    });
  });
});

// Inicio del servidor
app.listen(3001, () => console.log("Servidor corriendo en http://localhost:3001"));