-- ============================================================
-- QuieroYa! - Schema de base de datos (MySQL 8.0)
-- Basado en el diccionario de datos del Levantamiento de Requerimientos
-- ============================================================

CREATE DATABASE IF NOT EXISTS quieroya CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE quieroya;

-- ---------------- Clientes ----------------
CREATE TABLE IF NOT EXISTS clientes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  direccion_predeterminada VARCHAR(150),
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------- Negocios ----------------
CREATE TABLE IF NOT EXISTS negocios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre_comercial VARCHAR(100) NOT NULL,
  correo VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  direccion VARCHAR(150) NOT NULL,
  estado ENUM('pendiente','activo','suspendido','rechazado') NOT NULL DEFAULT 'pendiente',
  calificacion_promedio DECIMAL(3,2) DEFAULT 0.00,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------- Repartidores ----------------
CREATE TABLE IF NOT EXISTS repartidores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  vehiculo VARCHAR(30),
  estado ENUM('pendiente','activo','suspendido','rechazado') NOT NULL DEFAULT 'pendiente',
  estado_disponibilidad ENUM('disponible','en_ruta','inactivo') NOT NULL DEFAULT 'inactivo',
  calificacion_promedio DECIMAL(3,2) DEFAULT 0.00,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------- Administradores ----------------
CREATE TABLE IF NOT EXISTS administradores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------- Productos ----------------
CREATE TABLE IF NOT EXISTS productos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  negocio_id INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  stock DECIMAL(10,2) DEFAULT 0,
  estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  FOREIGN KEY (negocio_id) REFERENCES negocios(id)
);

-- ---------------- Pedidos (cabecera general) ----------------
CREATE TABLE IF NOT EXISTS pedidos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cliente_id INT NOT NULL,
  fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
  total_general DECIMAL(10,2) NOT NULL DEFAULT 0,
  estado_general VARCHAR(20) NOT NULL DEFAULT 'en_proceso',
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

-- ---------------- Subpedidos ----------------
CREATE TABLE IF NOT EXISTS subpedidos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pedido_id INT NOT NULL,
  negocio_id INT NOT NULL,
  repartidor_id INT NULL,
  estado ENUM('pendiente','en_preparacion','listo','en_camino','entregado','cancelado') NOT NULL DEFAULT 'pendiente',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
  FOREIGN KEY (negocio_id) REFERENCES negocios(id),
  FOREIGN KEY (repartidor_id) REFERENCES repartidores(id)
);

-- ---------------- Detalle de subpedidos ----------------
CREATE TABLE IF NOT EXISTS detalle_subpedidos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  subpedido_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad DECIMAL(10,2) NOT NULL,
  precio_unit DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (subpedido_id) REFERENCES subpedidos(id),
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);
