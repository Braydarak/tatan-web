#!/usr/bin/env bash
#
# Arma la web para subir a Ferozo (archivos estáticos, sin Node).
#
#   pnpm build:ferozo
#
# Resultado:
#   out/                     la web (HTML, JS, CSS, imágenes y .htaccess)
#   deploy/tatan-web.zip     lo mismo comprimido: va al public_html de Ferozo
#
# Toma las variables de .env.production.local (Public Key de Mercado Pago,
# dirección del sitio). Ver docs/deploy-ferozo.md.

set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env.production.local ]; then
  echo "Falta .env.production.local (Public Key de Mercado Pago, etc.). Ver docs/deploy-ferozo.md" >&2
  exit 1
fi
if grep -q '^NEXT_PUBLIC_PAYMENTS_DEMO=1' .env.production.local; then
  echo "⚠️  NEXT_PUBLIC_PAYMENTS_DEMO=1: el pago sería simulado. Dejalo vacío para producción." >&2
  exit 1
fi

echo "› Compilando…"
rm -rf .next out
pnpm build

if [ ! -f out/.htaccess ]; then
  echo "Falta out/.htaccess (debería copiarse de public/.htaccess)" >&2
  exit 1
fi

echo "› Comprimiendo…"
mkdir -p deploy
rm -f deploy/tatan-web.zip
(cd out && zip -qr ../deploy/tatan-web.zip . -x '.DS_Store')

echo
echo "Listo:"
du -sh out deploy/tatan-web.zip
echo "Subí deploy/tatan-web.zip a public_html (sin tocar la carpeta api/) y seguí docs/deploy-ferozo.md"
