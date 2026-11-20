require('dotenv').config();
if(!process.env.JWT_SECRET || process.env.JWT_SECRET.length<32){console.error('Configura JWT_SECRET con al menos 32 caracteres en .env');process.exit(1);}
const express=require('express');const cors=require('cors');const path=require('path');const app=express();
app.use(cors());app.use(express.json({limit:'100kb'}));
app.use('/app',express.static(path.join(__dirname,'../public')));
app.get('/app',(req,res)=>res.redirect('/app/'));
app.get('/',(req,res)=>res.json({mensaje:'API de QuieroYa! activa',modulos:['autenticacion','catalogo','pedidos']}));
app.use('/api/auth',require('./routes/auth.routes'));
app.use('/api/negocios',require('./routes/negocio.routes'));
app.use('/api/pedidos',require('./routes/pedido.routes'));
app.use((req,res)=>res.status(404).json({error:'Ruta no encontrada.'}));
app.use((err,req,res,next)=>res.status(err.status||400).json({error:'Solicitud invalida.'}));
if(require.main===module){app.listen(process.env.PORT||3000,()=>console.log('QuieroYa! escuchando en puerto '+(process.env.PORT||3000)));}
module.exports=app;
