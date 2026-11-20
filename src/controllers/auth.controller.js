const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const pool=require('../config/db');
const ROLES=['cliente','negocio','repartidor','administrador'];
const correoValido=s=>typeof s==='string'&&s.length<=120&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
async function registrar(req,res){
 const {rol}=req.params;
 if(!['cliente','negocio','repartidor'].includes(rol))return res.status(400).json({error:'Rol invalido.'});
 const b=req.body||{};const email=b.email||b.correo;
 const nombre=typeof b.nombre==='string'?b.nombre.trim():'';
 if(!nombre||nombre.length>100||!correoValido(email)||typeof b.password!=='string'||b.password.length<8)
  return res.status(400).json({error:'Nombre, email valido y contraseña de al menos 8 caracteres obligatorios.'});
 if(rol==='negocio'&&(!b.nombre_comercial||!b.direccion))return res.status(400).json({error:'Nombre comercial y direccion obligatorios.'});
 if(rol==='repartidor'&&!b.vehiculo)return res.status(400).json({error:'Vehiculo obligatorio.'});
 let conn;try{conn=await pool.getConnection();await conn.beginTransaction();
  const [roles]=await conn.query('SELECT id FROM roles WHERE LOWER(nombre)=? LIMIT 1',[rol]);
  if(!roles.length)throw new Error('Falta el rol '+rol+'. Ejecuta scripts/preparar-roles.js');
  const hash=await bcrypt.hash(b.password,10);
  // Negocios y repartidores quedan inactivos hasta la aprobacion.
  const [u]=await conn.query('INSERT INTO usuarios(rol_id,nombre,email,password_hash,telefono,activo) VALUES(?,?,?,?,?,?)',[roles[0].id,nombre,email.trim().toLowerCase(),hash,b.telefono||null,rol==='cliente'?1:0]);
  if(rol==='negocio')await conn.query('INSERT INTO locales(usuario_id,nombre_comercial,direccion,categoria) VALUES(?,?,?,?)',[u.insertId,String(b.nombre_comercial).trim(),String(b.direccion).trim(),b.categoria||null]);
  if(rol==='repartidor')await conn.query('INSERT INTO repartidores(usuario_id,vehiculo,placa,disponible) VALUES(?,?,?,0)',[u.insertId,b.vehiculo,b.placa||null]);
  await conn.commit();return res.status(201).json({id:u.insertId,rol,estado:rol==='cliente'?'activo':'pendiente'});
 }catch(e){if(conn)await conn.rollback();if(e.code==='ER_DUP_ENTRY')return res.status(409).json({error:'Correo registrado.'});console.error(e);return res.status(500).json({error:'No se pudo registrar.'});}
 finally{if(conn)conn.release();}
}
async function login(req,res){const b=req.body||{};const email=b.email||b.correo;
 if(!correoValido(email)||typeof b.password!=='string')return res.status(400).json({error:'Email y contraseña obligatorios.'});
 try{const [rows]=await pool.query('SELECT u.id,u.nombre,u.password_hash,u.activo,LOWER(r.nombre) rol FROM usuarios u JOIN roles r ON r.id=u.rol_id WHERE u.email=?',[email.trim().toLowerCase()]);
 const u=rows[0];if(!u||!(await bcrypt.compare(b.password,u.password_hash)))return res.status(401).json({error:'Credenciales incorrectas.'});
 if(!u.activo)return res.status(403).json({error:'Cuenta pendiente de aprobacion o inactiva.'});
 if(b.rol&&b.rol!==u.rol)return res.status(403).json({error:'El rol no corresponde.'});
 const token=jwt.sign({id:u.id,rol:u.rol},process.env.JWT_SECRET,{algorithm:'HS256',expiresIn:'8h'});
 return res.json({token,tipo:'Bearer',usuario:{id:u.id,nombre:u.nombre,rol:u.rol}});
 }catch(e){console.error(e);return res.status(500).json({error:'Error de autenticacion.'});}
}
async function listarPendientes(req,res){const {rol}=req.params;if(!['negocio','repartidor'].includes(rol))return res.status(400).json({error:'Rol invalido.'});
 try{const [rows]=await pool.query('SELECT u.id,u.nombre,u.email FROM usuarios u JOIN roles r ON r.id=u.rol_id WHERE LOWER(r.nombre)=? AND u.activo=0',[rol]);res.json(rows);}catch(e){console.error(e);res.status(500).json({error:'Error al listar solicitudes.'});}
}
async function actualizarEstadoSolicitud(req,res){const {rol,id}=req.params;const {accion}=req.body||{};
 if(!['negocio','repartidor'].includes(rol)||!['aprobar','rechazar'].includes(accion)||!/^[1-9]\d*$/.test(id))return res.status(400).json({error:'Datos invalidos.'});
 try{if(accion==='rechazar')return res.status(422).json({error:'La estructura actual solo permite activar o mantener inactiva una cuenta; rechazo persistente requiere una columna de estado.'});
 const [r]=await pool.query('UPDATE usuarios u JOIN roles r ON r.id=u.rol_id SET u.activo=1 WHERE u.id=? AND LOWER(r.nombre)=? AND u.activo=0',[id,rol]);
 if(!r.affectedRows)return res.status(404).json({error:'Solicitud pendiente no encontrada.'});res.json({id:Number(id),rol,estado:'activo'});
 }catch(e){console.error(e);res.status(500).json({error:'Error al aprobar solicitud.'});}
}
module.exports={registrar,login,listarPendientes,actualizarEstadoSolicitud};
