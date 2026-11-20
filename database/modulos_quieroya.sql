-- Ejecutar sobre la base `railway` tras realizar una copia de seguridad.
-- No borra ni modifica usuarios, roles, locales ni repartidores.
-- Comprobar antes que no haya tablas homónimas con otra estructura.
CREATE TABLE IF NOT EXISTS productos (
 id INT AUTO_INCREMENT PRIMARY KEY, local_id INT NOT NULL, nombre VARCHAR(120) NOT NULL,
 descripcion TEXT NULL, precio DECIMAL(12,2) NOT NULL, stock INT NOT NULL DEFAULT 0,
 activo BOOLEAN NOT NULL DEFAULT TRUE, creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_producto_local FOREIGN KEY(local_id) REFERENCES locales(id),
 CONSTRAINT chk_producto_stock CHECK(stock>=0),
 CONSTRAINT chk_producto_precio CHECK(precio>0)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS pedidos (
 id INT AUTO_INCREMENT PRIMARY KEY, usuario_id INT NOT NULL,
 fecha DATETIME DEFAULT CURRENT_TIMESTAMP, total DECIMAL(12,2) NOT NULL DEFAULT 0,
 estado VARCHAR(30) NOT NULL DEFAULT 'pendiente',
 CONSTRAINT fk_pedido_usuario FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS subpedidos (
 id INT AUTO_INCREMENT PRIMARY KEY, pedido_id INT NOT NULL, local_id INT NOT NULL,
 repartidor_id INT NULL, subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
 estado VARCHAR(30) NOT NULL DEFAULT 'pendiente',
 CONSTRAINT fk_subpedido_pedido FOREIGN KEY(pedido_id) REFERENCES pedidos(id),
 CONSTRAINT fk_subpedido_local FOREIGN KEY(local_id) REFERENCES locales(id),
 CONSTRAINT fk_subpedido_repartidor FOREIGN KEY(repartidor_id) REFERENCES repartidores(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS detalle_subpedidos (
 id INT AUTO_INCREMENT PRIMARY KEY, subpedido_id INT NOT NULL, producto_id INT NOT NULL,
 cantidad INT NOT NULL, precio_unitario DECIMAL(12,2) NOT NULL,
 CONSTRAINT fk_detalle_subpedido FOREIGN KEY(subpedido_id) REFERENCES subpedidos(id),
 CONSTRAINT fk_detalle_producto FOREIGN KEY(producto_id) REFERENCES productos(id),
 CONSTRAINT chk_detalle_cantidad CHECK(cantidad>0)
) ENGINE=InnoDB;
