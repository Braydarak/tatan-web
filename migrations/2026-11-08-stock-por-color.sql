-- =============================================================
-- Tatan · Migración 2026-11-08 (b)
--  Stock por talle Y por color/modelo.
--  Cada fila de product_sizes_stock pasa a ser producto + color + talle.
--  color = '' es el stock "sin color" (productos sin modelos, y todo el
--  stock cargado antes de esta migración).
--
-- Correr UNA sola vez en la base de Ferozo (phpMyAdmin → SQL).
-- La API funciona igual antes y después: mientras no exista la columna,
-- el stock se guarda solo por talle (sumando los colores).
-- =============================================================

ALTER TABLE `product_sizes_stock`
  ADD COLUMN `color` VARCHAR(80) NOT NULL DEFAULT ''
      COMMENT 'Nombre del modelo/color ('''' = sin color)' AFTER `product_id`,
  DROP INDEX `uk_sizestock_product_size`,
  ADD UNIQUE KEY `uk_sizestock_product_color_size` (`product_id`, `color`, `size`);
