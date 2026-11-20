# QuieroYa! – Backend compatible con Railway

## Tres módulos de la entrega
1. Usuarios y autenticación: `usuarios`, `roles`, `locales`, `repartidores`.
2. Negocios y catálogo: `locales`, `productos`.
3. Pedidos multi-tienda: `pedidos`, `subpedidos`, `detalle_subpedidos`.

## IMPORTANTE: conservar los datos de Railway
La base existente tiene `usuarios`, `roles`, `locales`, `repartidores`. **No ejecutar `database/schema_anterior_no_ejecutar.sql`**, porque describe otra base. Hacer copia de seguridad de Railway antes de cualquier migración. Revisar que las cuatro tablas nuevas no existan ya con esquema incompatible.

## Instalación en VS Code (PowerShell)
1. `npm install`
2. Copiar `.env.example` a `.env` y configurar las variables DB_ y JWT_SECRET. Nunca publicar `.env`. La contraseña de Railway mostrada en capturas debe rotarse.
3. Dejar abierta una terminal con `railway connect MySQL --tunnel-only --port 33061`.
4. Probar conexión con `node probar-db.js` si conserva el archivo de prueba local.
5. Tras hacer copia de seguridad y comprobar que no existen tablas con nombres conflictivos, ejecutar `npm run db:modulos`. El script se detiene si las tablas nuevas ya existen o la base no es `railway`. También puedes ejecutar `database/modulos_quieroya.sql` con un cliente SQL compatible. Un túnel SSH por sí solo no ejecuta SQL.
6. `npm run preparar:roles` (crea únicamente roles que falten). Comprueba nombres de roles preexistentes; esta versión espera `cliente`, `negocio`, `repartidor`, `administrador`.
7. `npm start` y visitar `http://localhost:3000`.
8. `npm test` para pruebas HTTP de validación, sin operaciones de escritura sobre Railway.

## Endpoints principales
- `POST /api/auth/registro/cliente` JSON `{ "nombre":"Ana", "email":"ana@example.test", "password":"clave_segura_123" }`
- `POST /api/auth/registro/negocio` JSON `{ "nombre":"Gestor", "email":"gestor@example.test", "password":"clave_segura_123", "nombre_comercial":"Tienda Centro", "direccion":"Calle 1" }`
- `POST /api/auth/login` JSON `{ "email":"ana@example.test", "password":"clave_segura_123" }`
- `GET /api/negocios` (público)
- `GET /api/negocios/:negocioId/productos` (público)
- `POST /api/negocios/:negocioId/productos` (Bearer token negocio dueño o admin) JSON `{ "nombre":"Cuaderno", "precio":5000, "stock":20 }`
- `PATCH /api/negocios/:negocioId/productos/:id` (dueño o admin)
- `POST /api/pedidos` (Bearer token cliente) JSON `{ "productos":[{"producto_id":1,"cantidad":2}] }`
- `GET /api/pedidos` (cliente)
- `GET /api/pedidos/:id` (cliente)
- `GET /api/negocios/:negocioId/subpedidos` (dueño o admin)
- `PATCH /api/negocios/:negocioId/subpedidos/:id` JSON `{ "accion":"aceptar" }` / `listo` / `rechazar`.
- `GET /api/auth/solicitudes/negocio` y `PATCH /api/auth/solicitudes/negocio/:id` JSON `{ "accion":"aprobar" }` (admin).

## Limitaciones conscientes
- No hay frontend, pagos reales, ubicación en tiempo real ni despachos automáticos.
- Negocios y repartidores se registran con `usuarios.activo=0`; el administrador puede aprobarlos (activo=1). La tabla actual no guarda rechazo explícito: `/solicitudes` devuelve 422 para `rechazar`.
- No se han probado operaciones de base de datos reales contra tu Railway desde este entorno.
- El estado `pendiente` de un pedido NO significa pago recibido.
- Para crear un administrador tras preparar roles: `node scripts/crear-admin.js email contraseñaSegura nombre` (evita contraseñas en la línea de comandos en equipos compartidos; mejor un gestor de secretos).

---

## Interfaz gráfica web (versión de demostración)

La interfaz gráfica está integrada al backend Express y usa **las rutas reales de la API**. No requiere instalar React ni ejecutar otro servidor.

**1.** Mantén el túnel de Railway abierto desde la primera terminal:

```powershell
railway connect MySQL --tunnel-only --port 33061
```

**2.** En otra terminal, dentro del proyecto, instala las dependencias si aún no están instaladas e inicia Express:

```powershell
npm install
npm start
```

**3.** Abre esta dirección en el navegador:

http://localhost:3000/app/

**No uses** `localhost:3000` si quieres ver la interfaz: esa ruta sigue mostrando el estado JSON de la API para conservar la compatibilidad.

### Pantallas

- **Inicio / negocios / productos:** catálogo público, búsqueda, filtros por categoría y carrito.
- **Cuenta cliente:** iniciar sesión, registrarse, combinar productos de distintos locales en un solo pedido de demostración, consultar pedidos y sus subpedidos.
- **Cuenta negocio:** iniciar sesión, administrar los productos de un local aprobado, consultar subpedidos y pasar de pendiente a preparación y listo. Rechazar un pedido afecta las existencias y el pedido: úsalo solo cuando realmente proceda.
- **Cuenta administradora:** iniciar sesión, revisar y aprobar solicitudes de negocios y repartidores.
- **Repartidor:** registro disponible; el panel de entregas no forma parte de estos tres módulos.

### Notas importantes

- Este proyecto sigue usando MySQL alojado en Railway, no contiene datos pregrabados. Si el túnel de Railway está cerrado, la interfaz no podrá cargar datos de la API.
- Los tokens JWT solo se almacenan en memoria durante la sesión abierta; refrescar el navegador requiere iniciar sesión de nuevo.
- **No hay cobros reales**, geolocalización ni asignación de repartidores en esta entrega.
- Los productos se muestran con íconos ilustrativos (no son fotografías reales de los productos).
- El backend valida roles y permisos; la interfaz no sustituye la seguridad del servidor.
- **Nunca añadas `.env` a Git**. Antes de publicar o presentar, cambia las contraseñas y claves JWT compartidas anteriormente, y elimina scripts temporales de recuperación que hayas creado en tu equipo.

### Pruebas locales

```powershell
npm test
```

Este paquete incorpora comprobaciones de disponibilidad de los archivos de la interfaz además de las pruebas originales de las rutas HTTP. Las pruebas integradas con Railway, incluyendo el flujo multi-tienda, deben ejecutarse en tu computador con el túnel activo.
