import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

/**
 * Generates the extension icons at build time so no binaries live in the repo.
 * Draws a filled, anti-aliased circle in account-singularity indigo (#4f46e5)
 * on a transparent background, encoded as 8-bit RGBA PNG with no dependencies.
 */

const SIZES = [16, 32, 48, 128];
const COLOR = [0x4f, 0x46, 0xe5];
const OUT_DIR = new URL('../src/public/icons/', import.meta.url);

const crcTable = Uint32Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function pngIcon(size) {
  const center = (size - 1) / 2;
  const radius = size * 0.46;
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);

  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - center, y - center);
      const alpha =
        d <= radius - 0.75
          ? 255
          : d >= radius + 0.75
            ? 0
            : Math.round((255 * (radius + 0.75 - d)) / 1.5);
      const o = y * stride + 1 + x * 4;
      raw[o] = COLOR[0];
      raw[o + 1] = COLOR[1];
      raw[o + 2] = COLOR[2];
      raw[o + 3] = alpha;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const size of SIZES) {
  writeFileSync(new URL(`icon-${size}.png`, OUT_DIR), pngIcon(size));
}
console.log(`[icons] wrote ${SIZES.map((s) => `${s}px`).join(', ')} → src/public/icons/`);
