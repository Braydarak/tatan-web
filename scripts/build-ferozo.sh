#!/usr/bin/env bash
#
# Arma la web lista para subir al hosting Node de Ferozo.
#
#   pnpm build:ferozo        (o: bash scripts/build-ferozo.sh)
#
# Resultado:
#   deploy/tatan-web/        carpeta con todo (server.js, .next, public, node_modules)
#   deploy/tatan-web.zip     lo mismo comprimido, para subir con el administrador de archivos
#
# Qué hace:
#  1. Compila con output "standalone" (ver next.config.ts) y las variables
#     de .env.production.local (Public Key de Mercado Pago, etc.).
#  2. Lo compila en una copia aparte con los paquetes en carpeta plana (sin
#     los symlinks de pnpm, que Ferozo puede no respetar al descomprimir) y
#     junta .next/standalone + .next/static + public.
#  3. Agrega `sharp` para Linux x64 (el que optimiza las fotos): el build
#     hecho en una Mac solo trae el de Mac. Se baja del registro de npm y se
#     verifica la firma (integrity) antes de usarlo.
#
# Ver docs/deploy-ferozo.md para subirlo.

set -euo pipefail
cd "$(dirname "$0")/.."

OUT=deploy/tatan-web
ZIP=deploy/tatan-web.zip

if [ ! -f .env.production.local ]; then
  echo "Falta .env.production.local (Public Key de Mercado Pago, etc.). Ver docs/deploy-ferozo.md" >&2
  exit 1
fi
if grep -q '^NEXT_PUBLIC_PAYMENTS_DEMO=1' .env.production.local; then
  echo "⚠️  NEXT_PUBLIC_PAYMENTS_DEMO=1: el pago sería simulado. Dejalo vacío para producción." >&2
  exit 1
fi

# Se compila en una copia aparte (deploy/.build) con los paquetes en una
# carpeta plana (node-linker=hoisted): así el build no tiene los accesos
# directos (symlinks) de pnpm, que el administrador de archivos de Ferozo
# puede no respetar al descomprimir. Tu node_modules de desarrollo no se toca.
BUILD=deploy/.build
echo "› Copiando el código a ${BUILD}…"
mkdir -p "$BUILD"
rsync -a --delete \
  --exclude node_modules --exclude .next --exclude deploy --exclude .git \
  ./ "$BUILD/"

echo "› Instalando dependencias (carpeta plana)…"
(cd "$BUILD" && pnpm install --frozen-lockfile --prefer-offline --config.node-linker=hoisted)

echo "› Compilando…"
(cd "$BUILD" && rm -rf .next && pnpm exec next build)

echo "› Armando ${OUT}…"
rm -rf "$OUT" "$ZIP"
cp -R "$BUILD/.next/standalone" "$OUT"
cp -R "$BUILD/.next/static" "$OUT/.next/static"
rm -rf "$OUT/public"
cp -R "$BUILD/public" "$OUT/public"
# Variables de build: no hacen falta en el servidor (ya están dentro de la web)
rm -f "$OUT"/.env*
LINKS=$(find "$OUT" -type l | wc -l | tr -d ' ')
if [ "$LINKS" != "0" ]; then
  echo "El build tiene $LINKS accesos directos (symlinks): revisar" >&2
  find "$OUT" -type l | head >&2
  exit 1
fi

echo "› Agregando sharp para Linux…"
SHARP_VERSION=$(node -p "require('./$OUT/node_modules/sharp/package.json').version")
node scripts/fetch-sharp-linux.mjs "$SHARP_VERSION" "$OUT/node_modules/@img"

echo "› Comprimiendo…"
(cd deploy && zip -qr tatan-web.zip tatan-web)

echo
echo "Listo:"
du -sh "$OUT" "$ZIP"
echo "Subí $ZIP a Ferozo y seguí docs/deploy-ferozo.md"
