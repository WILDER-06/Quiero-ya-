const pool = require("../config/db");

/**
 * EP2-HU04 - Recepcion de subpedidos
 * Como un negocio con pedidos entrantes, quiero recibir una notificacion y
 * poder aceptar o rechazar cada subpedido asignado a mi tienda, para
 * organizar la preparacion sin sobrepasar mi capacidad de atencion.
 *
 * Escenarios cubiertos:
 *  1. Aceptacion de un subpedido (con stock suficiente) -> "en_preparacion"
 *     y descuenta el stock de cada producto involucrado.
 *  2. Rechazo por falta de stock -> "cancelado".
 */

async function listarSubpedidos(req, res) {
  try {
    const { negocioId } = req.params;
    const { estado } = req.query;

    let sql = "SELECT id, pedido_id, estado, subtotal FROM subpedidos WHERE negocio_id = ?";
    const params = [negocioId];
    if (estado) {
      sql += " AND estado = ?";
      params.push(estado);
    }
    sql += " ORDER BY id DESC";

    const [rows] = await pool.query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno al listar subpedidos." });
  }
}

async function detalleSubpedido(req, res) {
  try {
    const { negocioId, id } = req.params;
    const [subpedidos] = await pool.query(
      "SELECT id, pedido_id, estado, subtotal FROM subpedidos WHERE id = ? AND negocio_id = ?",
      [id, negocioId]
    );
    if (subpedidos.length === 0) return res.status(404).json({ error: "Subpedido no encontrado." });

    const [detalle] = await pool.query(
      `SELECT ds.producto_id, p.nombre, ds.cantidad, ds.precio_unit, p.stock AS stock_actual
       FROM detalle_subpedidos ds
       JOIN productos p ON p.id = ds.producto_id
       WHERE ds.subpedido_id = ?`,
      [id]
    );

    return res.json({ ...subpedidos[0], productos: detalle });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno al consultar el subpedido." });
  }
}

async function resolverSubpedido(req, res) {
  const conn = await pool.getConnection();
  try {
    const { negocioId, id } = req.params;
    const { accion } = req.body; // "aceptar" | "rechazar"

    if (!["aceptar", "rechazar"].includes(accion)) {
      conn.release();
      return res.status(400).json({ error: "accion debe ser 'aceptar' o 'rechazar'." });
    }

    const [subpedidos] = await conn.query(
      "SELECT id, estado FROM subpedidos WHERE id = ? AND negocio_id = ?",
      [id, negocioId]
    );
    if (subpedidos.length === 0) {
      conn.release();
      return res.status(404).json({ error: "Subpedido no encontrado para este negocio." });
    }
    if (subpedidos[0].estado !== "pendiente") {
      conn.release();
      return res.status(409).json({ error: `El subpedido ya fue resuelto (estado actual: ${subpedidos[0].estado}).` });
    }

    if (accion === "rechazar") {
      // Escenario 2: rechazo (tipicamente por falta de stock)
      await conn.query("UPDATE subpedidos SET estado = 'cancelado' WHERE id = ?", [id]);
      conn.release();
      return res.json({ id: Number(id), estado: "cancelado" });
    }

    // accion === "aceptar" -> Escenario 1: validar stock suficiente de cada producto
    const [detalle] = await conn.query(
      `SELECT ds.producto_id, ds.cantidad, p.stock AS stock_actual, p.nombre
       FROM detalle_subpedidos ds JOIN productos p ON p.id = ds.producto_id
       WHERE ds.subpedido_id = ?`,
      [id]
    );

    const sinStock = detalle.find((d) => Number(d.stock_actual) < Number(d.cantidad));
    if (sinStock) {
      conn.release();
      return res.status(409).json({
        error: `Stock insuficiente para "${sinStock.nombre}". Rechaza el subpedido o ajusta el inventario.`,
      });
    }

    await conn.beginTransaction();
    for (const item of detalle) {
      await conn.query("UPDATE productos SET stock = stock - ? WHERE id = ?", [item.cantidad, item.producto_id]);
    }
    await conn.query("UPDATE subpedidos SET estado = 'en_preparacion' WHERE id = ?", [id]);
    await conn.commit();
    conn.release();

    return res.json({ id: Number(id), estado: "en_preparacion" });
  } catch (err) {
    console.error(err);
    try { await conn.rollback(); } catch (_) {}
    conn.release();
    return res.status(500).json({ error: "Error interno al resolver el subpedido." });
  }
}

module.exports = { listarSubpedidos, detalleSubpedido, resolverSubpedido };
