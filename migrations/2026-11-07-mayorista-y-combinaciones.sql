-- =============================================================
-- Tatan · Migración 2026-11-07
--  1) Precio por mayor por producto
--  2) Analítica "se compró junto con" (solo pedidos pagados)
--
-- Correr UNA sola vez en la base de Ferozo (phpMyAdmin → SQL).
-- La API funciona igual antes y después de correrla: mientras no
-- existan estas columnas/tabla, simplemente no las usa.
-- =============================================================

-- 1) Precio por mayor --------------------------------------------
ALTER TABLE `products`
  ADD COLUMN `wholesale_price`   DECIMAL(12,2)     DEFAULT NULL
      COMMENT 'Precio unitario por mayor (NULL = sin precio mayorista)'
      AFTER `original_price`,
  ADD COLUMN `wholesale_min_qty` SMALLINT UNSIGNED DEFAULT NULL
      COMMENT 'Unidades mínimas del producto para el precio por mayor'
      AFTER `wholesale_price`;

-- 2) Analítica de combinaciones ----------------------------------
-- Una fila por par de productos comprados en el mismo pedido pagado.
-- Se guarda en los dos sentidos (A→B y B→A) para consultar rápido.
CREATE TABLE IF NOT EXISTS `product_pair_stats` (
  `product_id`        VARCHAR(30)  NOT NULL,
  `paired_product_id` VARCHAR(30)  NOT NULL,
  `times_together`    INT UNSIGNED NOT NULL DEFAULT 0
      COMMENT 'Cantidad de pedidos pagados donde aparecen los dos',
  `last_order_at`     DATETIME     DEFAULT NULL,
  `updated_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_id`, `paired_product_id`),
  KEY `idx_pairs_rank` (`product_id`, `times_together`),
  CONSTRAINT `fk_pairs_product`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pairs_paired`
    FOREIGN KEY (`paired_product_id`) REFERENCES `products` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
