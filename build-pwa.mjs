import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const root = new URL(".", import.meta.url);
const iconDirectory = new URL("./icons/", root);
const outputDirectory = new URL("./pwa-dist/", root);

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const name = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

function makeIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const paint = (x, y, width, height, color) => {
    const [red, green, blue, alpha] = color;
    for (let row = y; row < Math.min(size, y + height); row += 1) {
      for (let column = x; column < Math.min(size, x + width); column += 1) {
        const offset = (row * size + column) * 4;
        pixels[offset] = red;
        pixels[offset + 1] = green;
        pixels[offset + 2] = blue;
        pixels[offset + 3] = alpha;
      }
    }
  };
  const scale = (value) => Math.round((value * size) / 512);
  const felt = [242, 242, 247, 255];
  const paper = [255, 255, 255, 255];
  const rule = [209, 209, 214, 255];
  const lime = [0, 102, 204, 255];
  const red = [198, 40, 40, 255];

  pixels.fill(0);
  paint(0, 0, size, size, felt);
  paint(scale(92), scale(70), scale(328), scale(372), paper);
  paint(scale(132), scale(118), scale(248), scale(22), rule);
  paint(scale(132), scale(168), scale(248), scale(12), rule);
  paint(scale(132), scale(198), scale(186), scale(12), rule);
  paint(scale(132), scale(260), scale(248), scale(2), rule);
  paint(scale(148), scale(328), scale(28), scale(42), lime);
  paint(scale(202), scale(298), scale(28), scale(72), lime);
  paint(scale(256), scale(315), scale(28), scale(55), lime);
  paint(scale(310), scale(276), scale(28), scale(94), lime);
  paint(scale(132), scale(395), scale(248), scale(2), rule);
  paint(scale(132), scale(412), scale(112), scale(12), red);

  const scanlines = Buffer.alloc(size * (size * 4 + 1));
  for (let row = 0; row < size; row += 1) {
    const lineOffset = row * (size * 4 + 1);
    scanlines[lineOffset] = 0;
    pixels.copy(scanlines, lineOffset + 1, row * size * 4, (row + 1) * size * 4);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(scanlines)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

await mkdir(iconDirectory, { recursive: true });
await mkdir(new URL("./src/", outputDirectory), { recursive: true });
await mkdir(new URL("./icons/", outputDirectory), { recursive: true });

for (const size of [180, 192, 512]) {
  const name = size === 180 ? "apple-touch-icon.png" : `icon-${size}.png`;
  await writeFile(new URL(name, iconDirectory), makeIcon(size));
}

for (const path of [
  "index.html",
  "styles.css",
  "manifest.webmanifest",
  "service-worker.js",
]) {
  await copyFile(new URL(path, root), new URL(path, outputDirectory));
}

for (const path of ["app.js", "score.js", "state.js"]) {
  await copyFile(new URL(`./src/${path}`, root), new URL(`./src/${path}`, outputDirectory));
}

for (const path of ["apple-touch-icon.png", "icon-192.png", "icon-512.png"]) {
  await copyFile(new URL(`./icons/${path}`, root), new URL(`./icons/${path}`, outputDirectory));
}

const manifest = JSON.parse(await readFile(new URL("./manifest.webmanifest", root), "utf8"));
if (manifest.scope !== "./" || manifest.start_url !== "./" || manifest.display !== "standalone") {
  throw new Error("The PWA manifest must use a relative scope and launch URL for subpath hosting.");
}

console.log(`iPad 오프라인 웹앱 빌드 완료: ${fileURLToPath(outputDirectory)}`);
