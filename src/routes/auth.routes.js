const express = require("express");
const router = express.Router();
const { registrar, actualizarEstadoSolicitud, listarPendientes } = require("../controllers/auth.controller");

// EP1-HU01 - Registro diferenciado por rol
// POST /api/auth/registro/cliente | /api/auth/registro/negocio | /api/auth/registro/repartidor
router.post("/registro/:rol", registrar);

// EP1-HU02 - Aprobacion de negocios y repartidores (uso del administrador)
router.get("/solicitudes/:rol", listarPendientes);
router.patch("/solicitudes/:rol/:id", actualizarEstadoSolicitud);

module.exports = router;
