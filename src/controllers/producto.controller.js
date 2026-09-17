const pool = require("../config/db");

/**
 * EP2-HU03 - Gestion de catalogo
 * Como un negocio suscrito y activo, quiero crear, editar y desactivar
 * los productos de mi catalogo con su precio y existencias, para mantener
 * actualizada la oferta que ven los clientes.
 *
 * Escenarios cubiertos:
 *  1. Creacion exitosa de un producto.
 *  2. Precio invalido (<= 0) -> se bloquea.
 *  3. Desactivacion de un producto (no se elimina, solo se oculta).
 */

async function crearProducto(req, res) {
  try {
    const { negocioId } = req.params;
    const { nombre, precio, stock } = req.body;

    if (!nombre || precio === undefined) {
      return res.status(400).json({ error: "nombre y precio son obligatorios." });
    }

    // Escenario 2: precio invalido
    if (Number(precio) <= 0) {
      return res.status(400).json({ error: "El precio debe ser mayor a cero." });
    }

    const [negocios] = await pool.query("SELECT id, estado FROM negocios WHERE id = ?", [negocioId]);
    if (negocios.length === 0) {
      return res.status(404).json({ error: "Negocio no encontrado." });
    }
    if (negocios[0].estado !== "activo") {
      return res.status(403).json({ error: "El negocio debe estar activo para publicar productos." });
    }

    // Escenario 1: creacion exitosa
    const [result] = await pool.query(
      "INSERT INTO productos (negocio_id, nombre, precio, stock, estado) VALUES (?, ?, ?, ?, 'activo')",
      [negocioId, nombre, precio, stock || 0]
    );

    return res.status(201).json({ id: result.insertId, nombre, precio, stock: stock || 0, estado: "activo" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno al crear el producto." });
  }
}

async function listarProductos(req, res) {
  try {
    const { negocioId } = req.params;
    const [rows] = await pool.query(
      "SELECT id, nombre, precio, stock, estado FROM productos WHERE negocio_id = ? ORDER BY id DESC",
      [negocioId]
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno al listar productos." });
  }
}

async function actualizarProducto(req, res) {
  try {
    const { negocioId, id } = req.params;
    const { nombre, precio, stock } = req.body;

    if (precio !== undefined && Number(precio) <= 0) {
      return res.status(400).json({ error: "El precio debe ser mayor a cero." });
    }

    const [productos] = await pool.query("SELECT id FROM productos WHERE id = ? AND negocio_id = ?", [id, negocioId]);
    if (productos.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado para este negocio." });
    }

    await pool.query(
      "UPDATE productos SET nombre = COALESCE(?, nombre), precio = COALESCE(?, precio), stock = COALESCE(?, stock) WHERE id = ?",
      [nombre || null, precio ?? null, stock ?? null, id]
    );

    return res.json({ id: Number(id), mensaje: "Producto actualizado." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno al actualizar el producto." });
  }
}

/** Escenario 3: desactivacion de un producto (no se elimina, solo se oculta) */
async function desactivarProducto(req, res) {
  try {
    const { negocioId, id } = req.params;
    const [result] = await pool.query(
      "UPDATE productos SET estado = 'inactivo' WHERE id = ? AND negocio_id = ?",
      [id, negocioId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Producto no encontrado para este negocio." });
    }
    return res.json({ id: Number(id), estado: "inactivo", mensaje: "Producto desactivado del catalogo." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno al desactivar el producto." });
  }
}

module.exports = { crearProducto, listarProductos, actualizarProducto, desactivarProducto };
