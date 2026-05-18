-- Migrate credit/debt metadata from notas JSON to proper columns
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS limite_credito bigint,
  ADD COLUMN IF NOT EXISTS dia_cierre     smallint,
  ADD COLUMN IF NOT EXISTS cuota_mensual  bigint;

UPDATE accounts
SET
  limite_credito = (notas::json->>'limite_credito')::bigint,
  dia_cierre     = (notas::json->>'dia_cierre')::smallint,
  cuota_mensual  = (notas::json->>'cuota_mensual')::bigint
WHERE notas IS NOT NULL AND notas != '' AND notas != 'null'
  AND notas::json->>'limite_credito' IS NOT NULL;
