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
  const surface = [20, 20, 22, 255];
  const border = [38, 38, 42, 255];
  const primary = [255, 229, 0, 255];

  const cx = width / 2;
  const cy = height / 2;
  const scale = width / 1024;

  const cardRadius = 180 * scale;
  const cardHalf = 380 * scale;

  const dx = Math.abs(x - cx);
  const dy = Math.abs(y - cy);

  let inCard = false;
  let onCardBorder = false;

  if (dx <= cardHalf && dy <= cardHalf) {
    const cornerX = dx - (cardHalf - cardRadius);
    const cornerY = dy - (cardHalf - cardRadius);
    if (cornerX > 0 && cornerY > 0) {
      const dist = Math.sqrt(cornerX * cornerX + cornerY * cornerY);
      if (dist <= cardRadius) {
        inCard = true;
        if (dist >= cardRadius - 4 * scale) onCardBorder = true;
      }
    } else {
      inCard = true;
      if (dx >= cardHalf - 4 * scale || dy >= cardHalf - 4 * scale) {
        onCardBorder = true;
      }
    }
  }

  if (inCard) {
    const barLeft = cx - 140 * scale;
    const barRight = barLeft + 70 * scale;
    const barTop = cy - 200 * scale;
    const barBottom = cy + 200 * scale;

    const inStem = x >= barLeft && x <= barRight && y >= barTop && y <= barBottom;

    const bowlLeft = barRight;
    const bowlRight = cx + 140 * scale;
    const bowlTop = barTop;
    const bowlBottom = cy + 10 * scale;
    const bowlRadius = (bowlBottom - bowlTop) / 2;
    const bowlCenterY = bowlTop + bowlRadius;

    let inBowl = false;
    if (x >= bowlLeft && x <= bowlRight && y >= bowlTop && y <= bowlBottom) {
      const bdx = x - bowlLeft;
      const bdy = y - bowlCenterY;
      const maxDx = bowlRight - bowlLeft;
      if (bdx <= maxDx) {
        const outerD = Math.sqrt(
          (bdx * bdx) / (maxDx * maxDx) + (bdy * bdy) / (bowlRadius * bowlRadius)
        );
        const innerMaxDx = maxDx - 60 * scale;
        const innerRadius = bowlRadius - 60 * scale;
        const innerD =
          innerMaxDx > 0 && innerRadius > 0
            ? Math.sqrt(
                (bdx * bdx) / (innerMaxDx * innerMaxDx) + (bdy * bdy) / (innerRadius * innerRadius)
              )
            : 0;

        if (outerD <= 1 && innerD >= 1) {
          inBowl = true;
        }
      }
    }

    const legLeft = cx;
    const legTop = cy;
    const legBottom = barBottom;
    const legSlope = x - legLeft - (y - legTop) * 0.7;
    const inLeg =
      y >= legTop && y <= legBottom && legSlope >= -20 * scale && legSlope <= 50 * scale;

    if (inStem || inBowl || inLeg) {
      return primary;
    }

    if (onCardBorder) return border;
    return surface;
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

  console.log("Assets generated successfully in apps/mobile/assets/");
}

generate();
