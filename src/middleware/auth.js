const jwt = require('jsonwebtoken');
const pool=require('../config/db');
function autenticar(req,res,next){
 const token=/^Bearer (.+)$/i.exec(req.headers.authorization||'')?.[1];
 if(!token)return res.status(401).json({error:'Se requiere token Bearer.'});
 try{req.usuario=jwt.verify(token,process.env.JWT_SECRET,{algorithms:['HS256']});return next();}
 catch(_){return res.status(401).json({error:'Token invalido o vencido.'});}
}
function permitir(...roles){return(req,res,next)=>roles.includes(req.usuario?.rol)?next():res.status(403).json({error:'No tienes permisos.'});}
async function propietarioNegocio(req,res,next){
 if(req.usuario?.rol==='administrador')return next();
 if(req.usuario?.rol!=='negocio')return res.status(403).json({error:'Rol no autorizado.'});
 try{const [r]=await pool.query('SELECT id FROM locales WHERE id=? AND usuario_id=?',[req.params.negocioId,req.usuario.id]);
 if(!r.length)return res.status(403).json({error:'Solo puedes administrar tu local.'});return next();}
 catch(e){console.error(e);return res.status(500).json({error:'No se pudo comprobar el local.'});}
}
module.exports={autenticar,permitir,propietarioNegocio};
