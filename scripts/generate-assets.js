import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = zlib.crc32(body);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc >>> 0, 0);
  return Buffer.concat([len, body, crcBuf]);
}

function createPng(width, height, pixelFn) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdr = makeChunk("IHDR", ihdrData);

  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = pixelFn(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const idat = makeChunk("IDAT", zlib.deflateSync(rawData));
  const iend = makeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function renderAppIcon(x, y, width, height) {
  const bg = [10, 10, 11, 255];
  const primary = [255, 229, 0, 255];

  const cx = width / 2;
  const cy = height / 2;
  const scale = width / 1024;

  const dotCenterX = cx + 180 * scale;
  const dotCenterY = cy - 180 * scale;
  const dotRadius = 72 * scale;

  const dx = x - dotCenterX;
  const dy = y - dotCenterY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist <= dotRadius - 1.5 * scale) {
    return primary;
  }
  if (dist <= dotRadius + 1.5 * scale) {
    const alpha = 0.5 - (dist - dotRadius) / (3 * scale);
    const clampedAlpha = Math.max(0, Math.min(1, alpha));
    return [
      Math.round(bg[0] * (1 - clampedAlpha) + primary[0] * clampedAlpha),
      Math.round(bg[1] * (1 - clampedAlpha) + primary[1] * clampedAlpha),
      Math.round(bg[2] * (1 - clampedAlpha) + primary[2] * clampedAlpha),
      255,
    ];
  }

  return bg;
}

function renderSplash(x, y, width, height) {
  return renderAppIcon(x, y, width, height);
}

function generate() {
  const assetsDir = path.resolve("apps/mobile/assets");
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const iconBuffer = createPng(1024, 1024, renderAppIcon);
  fs.writeFileSync(path.join(assetsDir, "icon.png"), iconBuffer);
  fs.writeFileSync(path.join(assetsDir, "adaptive-icon.png"), iconBuffer);

  const splashBuffer = createPng(512, 512, renderSplash);
  fs.writeFileSync(path.join(assetsDir, "splash-icon.png"), splashBuffer);

  const faviconBuffer = createPng(48, 48, renderAppIcon);
  fs.writeFileSync(path.join(assetsDir, "favicon.png"), faviconBuffer);

  const previews = [
    path.resolve("scripts/preview-dot-icon.png"),
    path.resolve("scripts/preview-dot-icon-safe.png"),
    path.resolve("scripts/preview-ratio-r.png"),
  ];
  for (const p of previews) {
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
    }
  }

  console.log("Assets generated successfully in apps/mobile/assets/");
}

generate();
