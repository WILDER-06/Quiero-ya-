const router=require('express').Router();const c=require('../controllers/pedido.controller');const {autenticar,permitir}=require('../middleware/auth');
router.use(autenticar,permitir('cliente'));
router.post('/',c.crearPedido);router.get('/',c.listarPedidos);router.get('/:id',c.detallePedido);
module.exports=router;
