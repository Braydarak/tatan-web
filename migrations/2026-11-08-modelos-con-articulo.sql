-- =============================================================
-- Tatan · Migración 2026-11-08
--  Modelos (estampados) de un producto con número de artículo y foto.
--  Usa la tabla de variantes de color que ya existe.
--
-- Correr UNA sola vez en la base de Ferozo (phpMyAdmin → SQL).
-- La API funciona igual antes y después: mientras no existan estas
-- columnas, los modelos se guardan solo con nombre y color.
-- =============================================================

ALTER TABLE `product_color_variants`
  ADD COLUMN `sku`       VARCHAR(60)  DEFAULT NULL
      COMMENT 'Número de artículo del modelo' AFTER `hex`,
  ADD COLUMN `image_src` VARCHAR(500) DEFAULT NULL
      COMMENT 'Foto del modelo (URL)' AFTER `sku`;

ALTER TABLE `product_color_variants`
  MODIFY `name` VARCHAR(80) NOT NULL;
