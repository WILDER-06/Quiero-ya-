const router=require('express').Router();
const c=require('../controllers/auth.controller');
const {autenticar,permitir}=require('../middleware/auth');
router.post('/registro/:rol',c.registrar);
router.post('/login',c.login);
router.get('/solicitudes/:rol',autenticar,permitir('administrador'),c.listarPendientes);
router.patch('/solicitudes/:rol/:id',autenticar,permitir('administrador'),c.actualizarEstadoSolicitud);
module.exports=router;
