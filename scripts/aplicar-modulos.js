require('dotenv').config();
const fs=require('node:fs');
const path=require('node:path');
const pool=require('../src/config/db');
const tablas=['productos','pedidos','subpedidos','detalle_subpedidos'];
(async()=>{
 const [actuales]=await pool.query('SHOW TABLES');
 const existentes=new Set(actuales.map(r=>Object.values(r)[0]));
 const [base]=await pool.query('SELECT DATABASE() db');
 console.log('Base seleccionada:',base[0].db);
 if(base[0].db!=='railway')throw Error('Detenido: la base activa no es railway.');
 const ya=tablas.filter(t=>existentes.has(t));
 if(ya.length){console.log('Ya existen tablas del modulo:',ya.join(', '));throw Error('Detenido para evitar incompatibilidades: revisar estructura antes de continuar.');}
 for(const t of ['usuarios','roles','locales','repartidores'])if(!existentes.has(t))throw Error('Falta tabla existente: '+t);
 const sql=fs.readFileSync(path.join(__dirname,'../database/modulos_quieroya.sql'),'utf8');
 const consultas=sql.split(';').map(s=>s.replace(/^\s*(?:--[^\n]*\n\s*)+/g,'').trim()).filter(Boolean);
 if(consultas.length!==4||consultas.some(s=>!s.startsWith('CREATE TABLE IF NOT EXISTS')))throw Error('SQL inesperado. Revisar archivo manualmente.');
 for(const consulta of consultas){await pool.query(consulta);console.log('Tabla creada correctamente.');}
 console.log('Migracion finalizada.');
})().catch(e=>{console.error('ERROR:',e.message);process.exitCode=1;}).finally(()=>pool.end());
