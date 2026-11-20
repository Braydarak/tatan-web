// Baja los paquetes de sharp para Linux x64 (glibc) desde el registro de npm,
// verifica su firma (integrity sha512) y los descomprime en <destino>/.
//
//   node scripts/fetch-sharp-linux.mjs <version-de-sharp> <destino>
//
// La versión de libvips sale del package.json del paquete de sharp para
// Linux, así siempre coincide con la que pide sharp.

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, renameSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [version, dest] = process.argv.slice(2);
if (!version || !dest) {
  console.error("uso: node scripts/fetch-sharp-linux.mjs <version> <destino>");
  process.exit(1);
}

const REGISTRY = "https://registry.npmjs.org";

async function fetchPackage(name, ver) {
  const meta = await (await fetch(`${REGISTRY}/${name}/${ver}`)).json();
  if (!meta?.dist?.tarball || !meta.dist.integrity) throw new Error(`${name}@${ver} no existe en el registro`);
  const tgz = Buffer.from(await (await fetch(meta.dist.tarball)).arrayBuffer());
  const [algo, expected] = meta.dist.integrity.split("-");
  const actual = createHash(algo).update(tgz).digest("base64");
  if (actual !== expected) throw new Error(`firma inválida para ${name}@${ver}`);

  const tmp = mkdtempSync(join(tmpdir(), "sharp-"));
  try {
    const file = join(tmp, "pkg.tgz");
    writeFileSync(file, tgz);
    execFileSync("tar", ["-xzf", file, "-C", tmp]);
    const target = join(dest, name.split("/")[1]);
    rmSync(target, { recursive: true, force: true });
    mkdirSync(dest, { recursive: true });
    renameSync(join(tmp, "package"), target);
    console.log(`  ✓ ${name}@${ver} (firma verificada)`);
    return JSON.parse(readFileSync(join(target, "package.json"), "utf8"));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

const sharpLinux = await fetchPackage("@img/sharp-linux-x64", version);
const libvipsVersion = sharpLinux.optionalDependencies?.["@img/sharp-libvips-linux-x64"];
if (!libvipsVersion) throw new Error("no se encontró la versión de libvips");
await fetchPackage("@img/sharp-libvips-linux-x64", libvipsVersion);
