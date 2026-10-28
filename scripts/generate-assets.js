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

  const cardRadius = 220 * scale;
  const cardHalf = 420 * scale;

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
    const stemLeft = cx - 210 * scale;
    const stemRight = stemLeft + 90 * scale;
    const glyphTop = cy - 250 * scale;
    const glyphBottom = cy + 250 * scale;
    const bowlBottom = cy + 25 * scale;
    const bowlHeight = bowlBottom - glyphTop;
    const stemThickness = 90 * scale;

    const inStem = x >= stemLeft && x <= stemRight && y >= glyphTop && y <= glyphBottom;

    const inTopBar =
      x >= stemRight && x <= cx + 80 * scale && y >= glyphTop && y <= glyphTop + stemThickness;

    const inMidBar =
      x >= stemRight && x <= cx + 80 * scale && y >= bowlBottom - stemThickness && y <= bowlBottom;

    const bowlRightEdge = cx + 210 * scale;
    const bowlCenterY = glyphTop + bowlHeight / 2;
    const bowlOuterRx = bowlRightEdge - (cx + 80 * scale);
    const bowlOuterRy = bowlHeight / 2;
    const bowlInnerRx = bowlOuterRx - stemThickness;
    const bowlInnerRy = bowlOuterRy - stemThickness;

    let inBowlCurve = false;
    if (x >= cx + 80 * scale && x <= bowlRightEdge && y >= glyphTop && y <= bowlBottom) {
      const ndx = x - (cx + 80 * scale);
      const ndy = y - bowlCenterY;
      const outerNorm =
        (ndx * ndx) / (bowlOuterRx * bowlOuterRx) + (ndy * ndy) / (bowlOuterRy * bowlOuterRy);
      const innerNorm =
        (ndx * ndx) / (bowlInnerRx * bowlInnerRx) + (ndy * ndy) / (bowlInnerRy * bowlInnerRy);
      if (outerNorm <= 1.0 && innerNorm >= 1.0) {
        inBowlCurve = true;
      }
    }

    const slashTopY = bowlBottom + 20 * scale;
    const slashBottomY = glyphBottom;
    const slashStartX = cx - 35 * scale;
    const slope = 0.72;
    const slashWidth = 95 * scale;

    let inSlash = false;
    if (y >= slashTopY && y <= slashBottomY) {
      const centerLineX = slashStartX + (y - slashTopY) * slope;
      if (x >= centerLineX && x <= centerLineX + slashWidth) {
        inSlash = true;
      }
    }

    if (inStem || inTopBar || inMidBar || inBowlCurve || inSlash) {
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

  const previewPath = path.resolve("scripts/preview-ratio-r.png");
  if (fs.existsSync(previewPath)) {
    fs.unlinkSync(previewPath);
  }

  console.log("Assets generated successfully in apps/mobile/assets/");
}

generate();
