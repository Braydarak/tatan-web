-- ============================================================
--  TATAN - Esquema MySQL
--  Ropa infantil · Tienda online + CRM
--  Collation: utf8mb4_unicode_ci  (emojis OK)
--  Motor: InnoDB (FKs + transacciones)
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------
-- 1. Usuarios CRM (acceso al panel)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admins` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username`        VARCHAR(50)  NOT NULL,
  `password_hash`   VARCHAR(255) NOT NULL COMMENT 'HASH (bcrypt/argon2) · NUNCA guardar plain',
  `email`           VARCHAR(150) DEFAULT NULL,
  `name`            VARCHAR(100) DEFAULT NULL,
  `role`            ENUM('owner','admin','editor') NOT NULL DEFAULT 'editor',
  `last_login_at`   DATETIME     DEFAULT NULL,
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_admins_username` (`username`),
  UNIQUE KEY `uk_admins_email`    (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 2. Categorías de productos
--    body, remera, pijama, set, pantalon, buzo, accesorio
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
  `id`         TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key`        VARCHAR(30)  NOT NULL COMMENT 'body / remera / pijama / set / pantalon / buzo / accesorio',
  `label`      VARCHAR(50)  NOT NULL COMMENT 'Body / Remera / … (visible)',
  `sort_order` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `active`     TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_categories_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 3. Productos (tabla principal)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
  `id`                 VARCHAR(30)    NOT NULL COMMENT 'ID amigable ej: b-001  (no autoincremental)',
  `slug`               VARCHAR(150)   DEFAULT NULL,
  `name`               VARCHAR(200)   NOT NULL,
  `tagline`            VARCHAR(100)   DEFAULT NULL COMMENT 'badge chiquito ej: "Clásico del mes"',
  `image_src`          VARCHAR(500)   NOT NULL COMMENT 'URL o path imagen principal',
  `category_id`        TINYINT UNSIGNED NOT NULL,
  `size_group`         ENUM('bebe','ninios') NOT NULL DEFAULT 'bebe',
  `color_hex`          CHAR(7)        NOT NULL DEFAULT '#F5E6D3',
  `description`        MEDIUMTEXT     COMMENT 'HTML (TipTap)',
  `price`              DECIMAL(12,2)  NOT NULL DEFAULT 0,
  `original_price`     DECIMAL(12,2)  DEFAULT NULL COMMENT 'NULL = sin oferta',
  `installments`       TINYINT UNSIGNED NOT NULL DEFAULT 6,
  `tax_free_price`     DECIMAL(12,2)  DEFAULT NULL,
  `show_points_badge`  TINYINT(1)     NOT NULL DEFAULT 0,
  `rating`             DECIMAL(2,1)   NOT NULL DEFAULT 5.0,
  `reviews_count`      INT UNSIGNED   NOT NULL DEFAULT 0,
  `sold_total`         INT UNSIGNED   NOT NULL DEFAULT 0 COMMENT 'vendidos históricos',
  `active`             TINYINT(1)     NOT NULL DEFAULT 1,
  `created_at`         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_products_slug` (`slug`),
  KEY `idx_products_category`   (`category_id`),
  KEY `idx_products_size_group` (`size_group`),
  KEY `idx_products_active`     (`active`),
  KEY `idx_products_price`      (`price`),
  CONSTRAINT `fk_products_category`
    FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 4. Galería de imágenes por producto (1:N)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `product_gallery_images` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id`  VARCHAR(30)  NOT NULL,
  `image_src`   VARCHAR(500) NOT NULL,
  `sort_order`  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_gallery_product` (`product_id`),
  CONSTRAINT `fk_gallery_product`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 5. Variantes de color por producto (1:N)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `product_color_variants` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id`  VARCHAR(30) NOT NULL,
  `name`        VARCHAR(50) NOT NULL,
  `hex`         CHAR(7)     NOT NULL,
  `sort_order`  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_colors_product` (`product_id`),
  CONSTRAINT `fk_colors_product`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 6. Stock por talle por producto
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `product_sizes_stock` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id`  VARCHAR(30) NOT NULL,
  `size`        VARCHAR(15) NOT NULL COMMENT 'RN / 3M / 2-4 / 8 …',
  `stock`       INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sizestock_product_size` (`product_id`, `size`),
  CONSTRAINT `fk_sizestock_product`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 7. Características / features (1:N)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `product_features` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id`  VARCHAR(30)  NOT NULL,
  `feature`     VARCHAR(250) NOT NULL,
  `sort_order`  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_features_product` (`product_id`),
  CONSTRAINT `fk_features_product`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 8. Productos relacionados (N:N self-join)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `product_related` (
  `product_id`       VARCHAR(30) NOT NULL,
  `related_product_id` VARCHAR(30) NOT NULL,
  `sort_order`       TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`product_id`, `related_product_id`),
  KEY `idx_related_reverse` (`related_product_id`),
  CONSTRAINT `fk_related_source`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_related_target`
    FOREIGN KEY (`related_product_id`) REFERENCES `products` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 9. Contenido editable (bloques genéricos JSON)
--    · home_hero  → editor del hero principal + beneficios
--    · envios     → editor completo de la página de envíos
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `site_content` (
  `content_key` VARCHAR(50)  NOT NULL COMMENT 'home_hero / envios',
  `data`        JSON         NOT NULL,
  `version`     INT UNSIGNED NOT NULL DEFAULT 1,
  `updated_by`  BIGINT UNSIGNED DEFAULT NULL,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`content_key`),
  KEY `idx_content_updated_by` (`updated_by`),
  CONSTRAINT `fk_content_updated_by`
    FOREIGN KEY (`updated_by`) REFERENCES `admins` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 10. Mensajes recibidos desde el formulario de contacto
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(150) NOT NULL,
  `email`      VARCHAR(150) NOT NULL,
  `phone`      VARCHAR(50)  DEFAULT NULL,
  `reason`     ENUM('general','pedido','cambios','mayorista','otro') NOT NULL DEFAULT 'general',
  `message`    TEXT         NOT NULL,
  `read`       TINYINT(1)   NOT NULL DEFAULT 0,
  `replied`    TINYINT(1)   NOT NULL DEFAULT 0,
  `ip`         VARCHAR(45)  DEFAULT NULL,
  `user_agent` VARCHAR(500) DEFAULT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_contact_email`   (`email`),
  KEY `idx_contact_reason`  (`reason`),
  KEY `idx_contact_read`    (`read`),
  KEY `idx_contact_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 11. Clientes (quienes compran - para futura integración MP)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `customers` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email`         VARCHAR(150) NOT NULL,
  `first_name`    VARCHAR(80)  DEFAULT NULL,
  `last_name`     VARCHAR(80)  DEFAULT NULL,
  `phone`         VARCHAR(50)  DEFAULT NULL,
  `document`      VARCHAR(20)  DEFAULT NULL COMMENT 'DNI / CUIL si aplica',
  `newsletter`    TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_customers_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 12. Direcciones de envío (1 cliente → N direcciones)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `customer_addresses` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `customer_id`  BIGINT UNSIGNED NOT NULL,
  `alias`        VARCHAR(50)  DEFAULT NULL COMMENT 'Casa / Oficina',
  `full_name`    VARCHAR(160) NOT NULL,
  `phone`        VARCHAR(50)  DEFAULT NULL,
  `street`       VARCHAR(200) NOT NULL,
  `street_extra` VARCHAR(100) DEFAULT NULL COMMENT 'Piso / Depto / Lote',
  `postal_code`  VARCHAR(20)  NOT NULL,
  `city`         VARCHAR(100) NOT NULL,
  `state`        VARCHAR(100) NOT NULL,
  `country`      VARCHAR(3)   NOT NULL DEFAULT 'ARG',
  `is_default`   TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_address_customer` (`customer_id`),
  CONSTRAINT `fk_address_customer`
    FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 13. Pedidos / Órdenes
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
  `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_number`      VARCHAR(30)     NOT NULL COMMENT 'ej: TTN-2026-0000123',
  `customer_id`       BIGINT UNSIGNED DEFAULT NULL,
  `guest_email`       VARCHAR(150)    DEFAULT NULL,
  `guest_name`        VARCHAR(160)    DEFAULT NULL,
  `guest_phone`       VARCHAR(50)     DEFAULT NULL,
  `status`            ENUM('draft','pending','paid','shipped','delivered','cancelled','refunded')
                       NOT NULL DEFAULT 'draft',
  `payment_method`    ENUM('mercadopago','transferencia','efectivo','otro')
                       DEFAULT NULL,
  `payment_id`        VARCHAR(100)    DEFAULT NULL COMMENT 'ID Mercado Pago / referencia',
  `shipping_method`   VARCHAR(80)     DEFAULT NULL COMMENT 'Correo Argentino / Andreani / Mercado Envios',
  `shipping_cost`     DECIMAL(12,2)   NOT NULL DEFAULT 0,
  `subtotal`          DECIMAL(12,2)   NOT NULL DEFAULT 0,
  `discount`          DECIMAL(12,2)   NOT NULL DEFAULT 0,
  `total`             DECIMAL(12,2)   NOT NULL DEFAULT 0,
  `currency`          CHAR(3)         NOT NULL DEFAULT 'ARS',
  `address_id`        BIGINT UNSIGNED DEFAULT NULL COMMENT 'FK opcional a customer_addresses si está logueado',
  `shipping_snapshot` JSON            COMMENT 'Snapshot JSON de la dirección si es guest o para auditoría',
  `notes`             VARCHAR(500)    DEFAULT NULL,
  `tracking_number`   VARCHAR(100)    DEFAULT NULL,
  `paid_at`           DATETIME        DEFAULT NULL,
  `shipped_at`        DATETIME        DEFAULT NULL,
  `delivered_at`      DATETIME        DEFAULT NULL,
  `cancelled_at`      DATETIME        DEFAULT NULL,
  `created_at`        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_orders_number`   (`order_number`),
  KEY `idx_orders_customer`       (`customer_id`),
  KEY `idx_orders_status`         (`status`),
  KEY `idx_orders_payment`        (`payment_method`),
  KEY `idx_orders_created`        (`created_at`),
  KEY `idx_orders_payment_id`     (`payment_id`),
  CONSTRAINT `fk_orders_customer`
    FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_orders_address`
    FOREIGN KEY (`address_id`) REFERENCES `customer_addresses` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 14. Líneas / ítems de cada pedido
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `order_items` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`       BIGINT UNSIGNED NOT NULL,
  `product_id`     VARCHAR(30)  NOT NULL,
  `product_name`   VARCHAR(200) NOT NULL COMMENT 'Snapshot del nombre al momento de comprar',
  `variant_name`   VARCHAR(100) DEFAULT NULL COMMENT 'Color elegido',
  `size`           VARCHAR(15)  DEFAULT NULL,
  `unit_price`     DECIMAL(12,2) NOT NULL,
  `quantity`       INT UNSIGNED  NOT NULL DEFAULT 1,
  `subtotal_line`  DECIMAL(12,2) NOT NULL,
  `tax_free_price` DECIMAL(12,2) DEFAULT NULL,
  `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_items_order`   (`order_id`),
  KEY `idx_items_product` (`product_id`),
  CONSTRAINT `fk_items_order`
    FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_items_product`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 15. Eventos / historial de estados de un pedido
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `order_events` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`   BIGINT UNSIGNED NOT NULL,
  `status`     VARCHAR(30) NOT NULL,
  `note`       VARCHAR(500) DEFAULT NULL,
  `admin_id`   BIGINT UNSIGNED DEFAULT NULL COMMENT 'quién cambió el estado',
  `created_at` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_events_order`   (`order_id`),
  KEY `idx_events_admin`   (`admin_id`),
  KEY `idx_events_created` (`created_at`),
  CONSTRAINT `fk_events_order`
    FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_events_admin`
    FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
--  INSERTS DE EJEMPLO  (datos mock del CRM actual)
-- ============================================================

-- --- Admins -------------------------------------------------
INSERT INTO `admins` (`username`, `password_hash`, `email`, `name`, `role`) VALUES
  -- password = CpJb8520  (bcrypt $2b$10 · generado con bcryptjs)
  ('Darak', '$2b$10$LxL1GFDnKlGWe4o.p8jPUuxGJXS1ki6cOGFiWk/MwATWNDDPUd2ZO', 'hola@tatan.com.ar', 'Brian Darakdjian', 'owner');

-- --- Categorías ---------------------------------------------
INSERT INTO `categories` (`key`, `label`, `sort_order`) VALUES
  ('body',      'Body',      1),
  ('remera',    'Remera',    2),
  ('pijama',    'Pijama',    3),
  ('set',       'Set',       4),
  ('pantalon',  'Pantalón',  5),
  ('buzo',      'Buzo',      6),
  ('accesorio', 'Accesorio', 7);

-- --- Productos (3 ejemplos del CRM mock) -------------------
INSERT INTO `products`
  (`id`, `slug`, `name`, `tagline`, `image_src`, `category_id`, `size_group`,
   `color_hex`, `description`, `price`, `original_price`, `installments`,
   `tax_free_price`, `show_points_badge`, `rating`, `reviews_count`, `sold_total`, `active`)
VALUES
  ('b-001', 'body-osito-amor', 'Body Osito Amor', 'Clásico del mes',
   '/tatanLogo.png',
   (SELECT id FROM categories WHERE `key`='body'),
   'bebe', '#F5E6D3',
   '<p>Body de algodón orgánico con estampa de osito en tonos beige.</p>',
   12990.00, 15990.00, 6, 10262.00, 1, 4.9, 124, 124, 1),

  ('p-001', 'pijama-ovejiita-dulce', 'Pijama Ovejiita Dulce', 'Nuevo ingreso',
   '/tatanLogo.png',
   (SELECT id FROM categories WHERE `key`='pijama'),
   'bebe', '#F8E0E8',
   '<p>Pijama enterito rosa con estampa de ovejitas.</p>',
   21990.00, NULL, 6, 17372.00, 0, 4.7, 52, 21, 1),

  ('r-001', 'remera-dino-aventura', 'Remera Dino Aventura', 'Más vendida',
   '/tatanLogo.png',
   (SELECT id FROM categories WHERE `key`='remera'),
   'ninios', '#F5E6B8',
   '<p>Remera mostaza con estampa de dinosaurio aventurero.</p>',
   9990.00, 12990.00, 6, 7892.00, 1, 4.9, 142, 142, 1);

-- --- Stock por talle ----------------------------------------
INSERT INTO `product_sizes_stock` (`product_id`, `size`, `stock`) VALUES
  ('b-001','RN',  6), ('b-001','1M',  8), ('b-001','3M',  12),
  ('b-001','6M',  9), ('b-001','9M',  4), ('b-001','12M', 2),
  ('b-001','18M', 1),

  ('p-001','RN',   3), ('p-001','0-3',  6), ('p-001','3-6',  1),
  ('p-001','6-9',  0), ('p-001','9-12', 2),

  ('r-001','2-4', 10), ('r-001','4-6', 7), ('r-001','6-8', 5), ('r-001','8-10', 2);

-- --- Variantes de color -------------------------------------
INSERT INTO `product_color_variants` (`product_id`, `name`, `hex`, `sort_order`) VALUES
  ('b-001', 'Beige Osito',  '#F5E6D3', 1),
  ('b-001', 'Rosa Suave',   '#F8E0E8', 2),

  ('p-001', 'Rosa Ovejita', '#F8E0E8', 1),

  ('r-001', 'Mostaza Dino', '#F5E6B8', 1),
  ('r-001', 'Verde Oliva',  '#D8E8C8', 2);

-- --- Features -----------------------------------------------
INSERT INTO `product_features` (`product_id`, `feature`, `sort_order`) VALUES
  ('b-001', '100% Algodón orgánico peinado',        1),
  ('b-001', 'Broches de presión sin níquel',         2),
  ('b-001', 'Costuras planas antirozaduras',         3),

  ('p-001', 'Algodón jersey pesado',                 1),
  ('p-001', 'Cierre antipánico',                     2),

  ('r-001', '100% Algodón cardado',                  1),
  ('r-001', 'Cuello redondo rib reforzado',          2);

-- --- Productos relacionados ---------------------------------
-- (dejado vacío para completar desde el CRM cuando existan los productos destino.
--  La FK obliga a que related_product_id exista antes en `products`.)

-- --- Contenido editable Home Hero (valor mock del proyecto) -
INSERT INTO `site_content` (`content_key`, `data`) VALUES
('home_hero', JSON_OBJECT(
  'eyebrow', 'Nueva colección Otoño',
  'titleLine1', 'Ropa suavecita para',
  'titleLine2', 'tus pequeños',
  'description', 'Descubrí nuestra selección de bodys, remeras y prendas de algodón premium. Confeccionadas con amor para los más chiquitos.',
  'imageSrc', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=cute%20baby%20onesie%20body%20beige%20cotton%20with%20teddy%20bear%20print%20soft%20pastel%20colors%20flat%20lay%20kids%20clothing%20photography&image_size=square_hd',
  'cta1Text', 'Ver colección',
  'cta1Href', '/productos',
  'cta2Text', 'Ofertas',
  'cta2Href', '/ofertas',
  'cottonBadge',  JSON_OBJECT('show', true,  'showIcon', true, 'title', '100% Algodón',   'subtitle', 'Orgánico'),
  'shippingBadge',JSON_OBJECT('show', true,  'showIcon', true, 'title', 'Envío gratis',    'subtitle', 'Compras mayores a $25k'),
  'benefits', JSON_ARRAY(
    JSON_OBJECT('show',true,'showIcon',true,'iconKey','Truck',     'title','Envío a todo el país','description','Llegamos a todas las provincias en 3-7 días hábiles',              'color','#E58B60'),
    JSON_OBJECT('show',true,'showIcon',true,'iconKey','CreditCard','title','Hasta 12 cuotas',      'description','Pagá como quieras: Mercado Pago, transferencia o efectivo','color','#7BA5C9'),
    JSON_OBJECT('show',true,'showIcon',true,'iconKey','Heart',     'title','Cambios sin costo',    'description','Si no te convence, lo cambiás gratis en los primeros 30 días','color','#E58BA0')
  )
));

-- --- Contenido editable Envíos (solo placeholder - valor default extenso -
INSERT INTO `site_content` (`content_key`, `data`) VALUES
('envios', JSON_OBJECT(
  'sections', JSON_OBJECT(
    'zones',   JSON_OBJECT('show',true,'showEyebrow',true,'eyebrow','Zonas de entrega','eyebrowBarColor','#F7CA5C','title','Enviamos a todo el país y Sudamérica','showDescription',true,'description','Los tiempos son estimados desde el despacho.'),
    'costos',  JSON_OBJECT('show',true,'showEyebrow',true,'eyebrow','Costos','eyebrowBarColor','#F2B27B','title','Envío gratis en compras mayores a $25.000','showDescription',true,'description','Sin costos sorpresa.'),
    'proceso', JSON_OBJECT('show',true,'showEyebrow',true,'eyebrow','Cómo funciona','eyebrowBarColor','#F29BAF','title','Del carrito a la puerta de tu casa en 4 pasos','showDescription',true,'description','Te contamos todo el recorrido.'),
    'seguimiento', JSON_OBJECT('show',true),
    'cambios',     JSON_OBJECT('show',true),
    'faq',         JSON_OBJECT('show',true,'showEyebrow',true,'eyebrow','Preguntas frecuentes','eyebrowBarColor','#CDE1A4','title','Todo lo que querés saber de los envíos','showDescription',false,'description',''),
    'finalCta',    JSON_OBJECT('show',true)
  ),
  'hero', JSON_OBJECT('show',true,'eyebrow','Envíos y entregas','title','Tus prendas viajan seguras hasta tu casa','subtitle','Explicá cómo funciona el envío.','ctaPrimaryText','Ver productos','ctaPrimaryHref','/productos','ctaSecondaryText','Ver zonas y tiempos','ctaSecondaryHref','#zonas','summaryCardShow',true,'summaryTime','3-7 días hábiles','summaryTimeLabel','Interior del país','summaryFreeBadgeText','Gratis','summaryFreeAmount','$25k+','summaryFreeLabel','Envío sin costo','summaryChangesDays','30 días','summaryChangesTitle','Cambios','summaryChangesLabel','Sin letra chica',
    'stats', JSON_ARRAY(
      JSON_OBJECT('show',true,'showIcon',true,'iconKey','Truck',    'label','Tiempo promedio','value','3-7 días hábiles','tone','#5B85A8','tintBg','#F7FBFF'),
      JSON_OBJECT('show',true,'showIcon',true,'iconKey','Sparkles','label','Gratis',         'value','$25k+',           'tone','#599E7D','tintBg','#F6FBF7'),
      JSON_OBJECT('show',true,'showIcon',true,'iconKey','RotateCcw','label','30 días',       'value','Cambios',         'tone','#D27856','tintBg','#FFF6F0')
    )
  )
));
