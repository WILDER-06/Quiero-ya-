const bcrypt = require("bcryptjs");
const pool = require("../config/db");

const TABLAS_POR_ROL = {
  cliente: "clientes",
  negocio: "negocios",
  repartidor: "repartidores",
};

/**
 * EP1-HU01 - Registro diferenciado por rol
 * Como un cliente, negocio o repartidor nuevo, quiero registrarme mediante
 * un formulario especifico para mi rol, para acceder a las funcionalidades
 * que corresponden a mi tipo de usuario.
 *
 * Escenarios cubiertos (ver Levantamiento de Requerimientos):
 *  1. Registro exitoso de cliente -> queda activo de inmediato.
 *  2. Correo ya registrado -> se bloquea con mensaje de error.
 *  3. Registro de negocio/repartidor -> queda en estado "pendiente".
 */
async function registrar(req, res) {
  try {
    const { rol } = req.params;
    const tabla = TABLAS_POR_ROL[rol];

    if (!tabla) {
      return res.status(400).json({ error: "Rol invalido. Usa cliente, negocio o repartidor." });
    }

    const { nombre, nombre_comercial, correo, password, telefono, direccion, categoria, vehiculo } = req.body;
    const nombreFinal = rol === "negocio" ? nombre_comercial : nombre;

    if (!nombreFinal || !correo || !password) {
      return res.status(400).json({ error: "nombre, correo y password son obligatorios." });
    }

    // Escenario 2: correo ya registrado
    const [existentes] = await pool.query(`SELECT id FROM ${tabla} WHERE correo = ?`, [correo]);
    if (existentes.length > 0) {
      return res.status(409).json({ error: "Este correo ya esta registrado." });
    }

    const password_hash = await bcrypt.hash(password, 10);

    if (rol === "cliente") {
      // Escenario 1: registro exitoso de cliente, queda activo de inmediato
      const [result] = await pool.query(
        "INSERT INTO clientes (nombre, correo, password_hash, telefono, direccion_predeterminada) VALUES (?, ?, ?, ?, ?)",
        [nombreFinal, correo, password_hash, telefono || null, direccion || null]
      );
      return res.status(201).json({ id: result.insertId, rol, estado: "activo", mensaje: "Cuenta creada y activa." });
    }

    if (rol === "negocio") {
      // Escenario 3: negocio queda pendiente de aprobacion
      const [result] = await pool.query(
        "INSERT INTO negocios (nombre_comercial, correo, password_hash, categoria, direccion, estado) VALUES (?, ?, ?, ?, ?, 'pendiente')",
        [nombreFinal, correo, password_hash, categoria || "General", direccion || "", ]
      );
      return res.status(201).json({ id: result.insertId, rol, estado: "pendiente", mensaje: "Registro recibido, pendiente de aprobacion del administrador." });
    }

    if (rol === "repartidor") {
      // Escenario 3: repartidor queda pendiente de aprobacion
      const [result] = await pool.query(
        "INSERT INTO repartidores (nombre, correo, password_hash, vehiculo, estado) VALUES (?, ?, ?, ?, 'pendiente')",
        [nombreFinal, correo, password_hash, vehiculo || null]
      );
      return res.status(201).json({ id: result.insertId, rol, estado: "pendiente", mensaje: "Registro recibido, pendiente de aprobacion del administrador." });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno al registrar." });
  }
}

/**
 * EP1-HU02 - Aprobacion de negocios y repartidores
 * Como un administrador, quiero aprobar o rechazar solicitudes de negocio
 * y repartidor, para garantizar la calidad y confiabilidad de la plataforma.
 */
async function actualizarEstadoSolicitud(req, res) {
  try {
    const { rol, id } = req.params;
    const { accion, motivo } = req.body; // accion: "aprobar" | "rechazar"
    const tabla = rol === "negocio" ? "negocios" : rol === "repartidor" ? "repartidores" : null;

    if (!tabla) {
      return res.status(400).json({ error: "Rol invalido. Usa negocio o repartidor." });
    }
    if (!["aprobar", "rechazar"].includes(accion)) {
      return res.status(400).json({ error: "accion debe ser 'aprobar' o 'rechazar'." });
    }

    const nuevoEstado = accion === "aprobar" ? "activo" : "rechazado";
    const [result] = await pool.query(`UPDATE ${tabla} SET estado = ? WHERE id = ?`, [nuevoEstado, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Solicitud no encontrada." });
    }

    return res.json({
      id: Number(id),
      rol,
      estado: nuevoEstado,
      motivo: accion === "rechazar" ? (motivo || "Sin motivo especificado") : undefined,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno al actualizar la solicitud." });
  }
}

/** Lista solicitudes pendientes de un rol, para el panel del administrador */
async function listarPendientes(req, res) {
  try {
    const { rol } = req.params;
    const tabla = rol === "negocio" ? "negocios" : rol === "repartidor" ? "repartidores" : null;
    if (!tabla) return res.status(400).json({ error: "Rol invalido. Usa negocio o repartidor." });

    const [rows] = await pool.query(`SELECT id, ${rol === "negocio" ? "nombre_comercial AS nombre" : "nombre"}, correo, estado FROM ${tabla} WHERE estado = 'pendiente'`);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno al listar solicitudes." });
  }
}

module.exports = { registrar, actualizarEstadoSolicitud, listarPendientes };
