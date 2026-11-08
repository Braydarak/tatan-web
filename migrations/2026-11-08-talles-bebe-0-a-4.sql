-- =============================================================
-- Tatan · Migración 2026-11-08 (c)
--  Talles de bebé al sistema nuevo 0 a 4:
--    RN → 0 · 1M → 1 · 3M → 2 · 6M → 3 · 9M → 4 · 12M → 4
--  Si un producto tenía 9M y 12M, el stock de los dos se suma en el talle 4
--  (por color, si tiene stock por color).
--  Solo toca productos de bebé (size_group = 'bebe'). Otros talles quedan igual.
--
-- Correr UNA sola vez en phpMyAdmin → SQL,
-- DESPUÉS de 2026-11-08-stock-por-color.sql (usa la columna `color`).
-- =============================================================

START TRANSACTION;

-- 1) Stock con los talles nuevos (sumando los que caen en el mismo talle)
CREATE TEMPORARY TABLE tmp_talles_bebe AS
SELECT
  s.product_id,
  s.color,
  CASE UPPER(TRIM(s.size))
    WHEN 'RN'  THEN '0'
    WHEN '1M'  THEN '1'
    WHEN '3M'  THEN '2'
    WHEN '6M'  THEN '3'
    WHEN '9M'  THEN '4'
    WHEN '12M' THEN '4'
    ELSE s.size
  END            AS new_size,
  SUM(s.stock)   AS stock,
  MIN(s.id)      AS first_id
FROM product_sizes_stock s
JOIN products p ON p.id = s.product_id
WHERE p.size_group = 'bebe'
GROUP BY s.product_id, s.color, new_size;

-- 2) Se reemplaza el stock de los productos de bebé
DELETE s FROM product_sizes_stock s
JOIN products p ON p.id = s.product_id
WHERE p.size_group = 'bebe';

INSERT INTO product_sizes_stock (product_id, color, size, stock)
SELECT product_id, color, new_size, stock
FROM tmp_talles_bebe
ORDER BY first_id;

DROP TEMPORARY TABLE tmp_talles_bebe;

COMMIT;

-- Para revisar cómo quedó:
-- SELECT product_id, color, size, stock FROM product_sizes_stock ORDER BY product_id, color, id;
