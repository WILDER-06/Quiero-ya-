# QuieroYa! — Backend

Primera entrega de código del proyecto QuieroYa!, plataforma digital de administración de entrega de productos a domicilio.

Implementa:

**Épica 1: Autenticación y Roles**
- **EP1-HU01** — Registro diferenciado por rol (cliente, negocio, repartidor)
- **EP1-HU02** — Aprobación/rechazo de negocios y repartidores por el administrador

**Épica 2: Negocios y Catálogo**
- **EP2-HU03** — Gestión de catálogo de productos (crear, editar, desactivar)
- **EP2-HU04** — Recepción de subpedidos (aceptar con descuento de stock, o rechazar)

## Stack

- Node.js + Express
- MySQL 8 (vía `mysql2`)
- `bcryptjs` para el hash de contraseñas

## Instalación local

1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Crea la base de datos y las tablas:
   ```bash
   mysql -u root -p < database/schema.sql
   ```
3. Copia `.env.example` a `.env` y ajusta las credenciales de tu MySQL local o de tu base de datos en Railway:
   ```bash
   cp .env.example .env
   ```
4. Levanta el servidor:
   ```bash
   npm start
   ```
   Por defecto queda escuchando en `http://localhost:3000`.

## Endpoints disponibles

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/registro/cliente` | Registra un cliente (queda activo de inmediato) |
| POST | `/api/auth/registro/negocio` | Registra un negocio (queda pendiente de aprobación) |
| POST | `/api/auth/registro/repartidor` | Registra un repartidor (queda pendiente de aprobación) |
| GET | `/api/auth/solicitudes/:rol` | Lista negocios/repartidores pendientes (`rol` = negocio o repartidor) |
| PATCH | `/api/auth/solicitudes/:rol/:id` | Aprueba o rechaza una solicitud (`{"accion":"aprobar"}` o `{"accion":"rechazar","motivo":"..."}`) |
| POST | `/api/negocios/:negocioId/productos` | Crea un producto en el catálogo del negocio |
| GET | `/api/negocios/:negocioId/productos` | Lista el catálogo del negocio |
| PUT | `/api/negocios/:negocioId/productos/:id` | Edita un producto |
| PATCH | `/api/negocios/:negocioId/productos/:id/desactivar` | Desactiva un producto (no lo elimina) |
| GET | `/api/negocios/:negocioId/subpedidos?estado=pendiente` | Lista subpedidos del negocio (filtro opcional por estado) |
| GET | `/api/negocios/:negocioId/subpedidos/:id` | Detalle de un subpedido con sus productos |
| PATCH | `/api/negocios/:negocioId/subpedidos/:id` | Acepta (descuenta stock) o rechaza un subpedido (`{"accion":"aceptar"}` o `{"accion":"rechazar"}`) |

## Estructura del proyecto

```
quieroya-backend/
├── database/
│   └── schema.sql          # Script de creación de la base de datos
├── src/
│   ├── config/db.js        # Conexión a MySQL
│   ├── controllers/        # Lógica de negocio
│   ├── routes/             # Definición de endpoints
│   └── server.js           # Punto de entrada
├── .env.example
└── package.json
```

## Próximos incrementos

Según el Product Backlog priorizado, los siguientes módulos a implementar son:
Negocios y Catálogo (EP2), Pedidos y Carrito Multi-tienda (EP3), Logística y Repartidores (EP4), y Administración y Reportes (EP5).
