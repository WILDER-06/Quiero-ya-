const pool=require('../config/db');
function error(status,msg){const e=new Error(msg);e.status=status;return e;}
async function crearPedido(req,res){
 const items=req.body?.productos;if(!Array.isArray(items)||items.length<1||items.length>50)return res.status(400).json({error:'Envia entre 1 y 50 productos.'});
 const cantidades=new Map();for(const i of items){if(!Number.isSafeInteger(i.producto_id)||i.producto_id<1||!Number.isInteger(i.cantidad)||i.cantidad<1||i.cantidad>1000)return res.status(400).json({error:'Producto y cantidad invalidos.'});cantidades.set(i.producto_id,(cantidades.get(i.producto_id)||0)+i.cantidad);}
 let conn;try{conn=await pool.getConnection();await conn.beginTransaction();const productos=[];
 for(const id of [...cantidades.keys()].sort((a,b)=>a-b)){
  const [r]=await conn.query('SELECT p.id,p.local_id,p.nombre,p.precio,p.stock,p.activo,u.activo local_activo FROM productos p JOIN locales l ON l.id=p.local_id JOIN usuarios u ON u.id=l.usuario_id WHERE p.id=? FOR UPDATE',[id]);
  const p=r[0];if(!p||!p.activo||!p.local_activo)throw error(409,`Producto ${id} no disponible.`);
  const cantidad=cantidades.get(id);if(cantidad>Number(p.stock))throw error(409,`Inventario insuficiente: ${p.nombre}.`);productos.push({...p,cantidad});
 }
 const grupos=new Map();let centavos=0;for(const p of productos){const importe=Math.round(Number(p.precio)*100)*p.cantidad;centavos+=importe;if(!grupos.has(p.local_id))grupos.set(p.local_id,[]);grupos.get(p.local_id).push({...p,importe});}
 if(!Number.isSafeInteger(centavos)||centavos<=0||centavos>999999999999)throw error(400,'Total invalido.');
 const [pedido]=await conn.query("INSERT INTO pedidos(usuario_id,total,estado) VALUES(?,?,'pendiente')",[req.usuario.id,centavos/100]);const subpedidos=[];
 for(const [localId,grupo] of grupos){const subtotal=grupo.reduce((s,p)=>s+p.importe,0)/100;
  const [sub]=await conn.query("INSERT INTO subpedidos(pedido_id,local_id,subtotal,estado) VALUES(?,?,?,'pendiente')",[pedido.insertId,localId,subtotal]);
  for(const p of grupo){await conn.query('INSERT INTO detalle_subpedidos(subpedido_id,producto_id,cantidad,precio_unitario) VALUES(?,?,?,?)',[sub.insertId,p.id,p.cantidad,p.precio]);await conn.query('UPDATE productos SET stock=stock-? WHERE id=?',[p.cantidad,p.id]);}
  subpedidos.push({id:sub.insertId,local_id:localId,subtotal,estado:'pendiente'});
 }
 await conn.commit();res.status(201).json({id:pedido.insertId,total:centavos/100,estado:'pendiente',subpedidos,nota:'Pedido de demostracion; sin pago real.'});
 }catch(e){if(conn)try{await conn.rollback();}catch(_){}console.error(e.status?e.message:e);res.status(e.status||500).json({error:e.status?e.message:'No se pudo crear el pedido.'});}finally{if(conn)conn.release();}
}
async function listarPedidos(req,res){try{const [rows]=await pool.query('SELECT id,fecha,total,estado FROM pedidos WHERE usuario_id=? ORDER BY id DESC',[req.usuario.id]);res.json(rows);}catch(e){console.error(e);res.status(500).json({error:'Error al listar pedidos.'});}}
async function detallePedido(req,res){try{const [rows]=await pool.query('SELECT id,fecha,total,estado FROM pedidos WHERE id=? AND usuario_id=?',[req.params.id,req.usuario.id]);if(!rows.length)return res.status(404).json({error:'Pedido no encontrado.'});const [subs]=await pool.query('SELECT id,local_id,subtotal,estado FROM subpedidos WHERE pedido_id=?',[req.params.id]);for(const sub of subs){const [items]=await pool.query('SELECT d.producto_id,p.nombre,d.cantidad,d.precio_unitario FROM detalle_subpedidos d JOIN productos p ON p.id=d.producto_id WHERE d.subpedido_id=?',[sub.id]);sub.productos=items;}res.json({...rows[0],subpedidos:subs});}catch(e){console.error(e);res.status(500).json({error:'Error al consultar pedido.'});}}
module.exports={crearPedido,listarPedidos,detallePedido};
