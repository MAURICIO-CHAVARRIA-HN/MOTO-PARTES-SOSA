import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "images", "productos");
mkdirSync(outDir, { recursive: true });

const W = 800;
const H = 600;

const crcTable = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(width, height, pixels) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const hex = (s) => [
  parseInt(s.slice(1, 3), 16),
  parseInt(s.slice(3, 5), 16),
  parseInt(s.slice(5, 7), 16),
];

function makeCanvas(bg) {
  const pixels = Buffer.alloc(W * H * 4);
  const [br, bgG, bb] = hex(bg);
  for (let i = 0; i < W * H; i++) {
    pixels[i * 4] = br;
    pixels[i * 4 + 1] = bgG;
    pixels[i * 4 + 2] = bb;
    pixels[i * 4 + 3] = 255;
  }
  const set = (x, y, color) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const [r, g, b] = hex(color);
    const i = (y * W + x) * 4;
    pixels[i] = r;
    pixels[i + 1] = g;
    pixels[i + 2] = b;
    pixels[i + 3] = 255;
  };
  const fillRect = (x, y, w, h, color) => {
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++) set(xx, yy, color);
  };
  const fillCircle = (cx, cy, r, color) => {
    for (let yy = cy - r; yy <= cy + r; yy++)
      for (let xx = cx - r; xx <= cx + r; xx++)
        if ((xx - cx) ** 2 + (yy - cy) ** 2 <= r * r) set(xx, yy, color);
  };
  const inPoly = (x, y, points) => {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [xi, yi] = points[i];
      const [xj, yj] = points[j];
      const intersect =
        yi > y !== yj > y &&
        x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };
  const fillPoly = (points, color) => {
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const minX = Math.max(0, Math.floor(Math.min(...xs)));
    const maxX = Math.min(W - 1, Math.ceil(Math.max(...xs)));
    const minY = Math.max(0, Math.floor(Math.min(...ys)));
    const maxY = Math.min(H - 1, Math.ceil(Math.max(...ys)));
    for (let yy = minY; yy <= maxY; yy++)
      for (let xx = minX; xx <= maxX; xx++)
        if (inPoly(xx, yy, points)) set(xx, yy, color);
  };
  const drawTextPixel = (x, y, char, scale, color) => {
    const glyph = FONT[char];
    if (!glyph) return;
    for (let row = 0; row < 7; row++)
      for (let col = 0; col < 5; col++)
        if (glyph[row][col] === "1")
          fillRect(x + col * scale, y + row * scale, scale, scale, color);
  };
  const textWidth = (text, scale) =>
    (text.length * (5 * scale) + (text.length - 1) * scale + text.length * 2) *
    1;
  const drawText = (text, cx, y, scale, color) => {
    let cursor = cx - Math.round(textWidth(text, scale) / 2);
    for (const char of text) {
      if (char !== " ") drawTextPixel(cursor, y, char, scale, color);
      cursor += 5 * scale + (scale + 2);
    }
  };
  const drawTextLeft = (text, x, y, scale, color) => {
    let cursor = x;
    for (const char of text) {
      if (char !== " ") drawTextPixel(cursor, y, char, scale, color);
      cursor += 5 * scale + (scale + 2);
    }
  };
  return {
    pixels,
    set,
    fillRect,
    fillCircle,
    fillPoly,
    drawText,
    drawTextLeft,
    save: (name) =>
      writeFileSync(join(outDir, name), encodePng(W, H, pixels)),
  };
}

const FONT = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  G: ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
};

function decorate(canvas, accent, label, icon) {
  const grid = "#1e2026";
  for (let x = 0; x < W; x += 40)
    canvas.fillRect(x, 0, 1, H, grid);
  for (let y = 0; y < H; y += 40)
    canvas.fillRect(0, y, W, 1, grid);
  canvas.fillRect(0, 0, 8, H, accent);
  canvas.fillRect(W - 8, 0, 8, H, accent);

  // DEMO badge (top left)
  canvas.fillRect(24, 24, 132, 52, "#22242b");
  canvas.fillRect(24, 24, 132, 52, accent === "#17171b" ? "#facc15" : "#facc15");
  canvas.drawTextLeft("DEMO", 44, 38, 4, "#0b0b0d");
  canvas.fillRect(26, 82, 128, 2, "#33353d");

  // bottom band
  canvas.fillRect(0, H - 56, W, 56, "#101013");
  canvas.fillRect(0, H - 56, W, 4, accent);
  canvas.drawTextLeft("RANCING MAU  ·  PRODUCTO DE PRUEBA", 24, H - 45, 3, "#9ca3af");
  canvas.drawTextLeft("REPUESTO DEMO  ·  NO ES UN PRODUCTO REAL", 24, H - 22, 2, "#e5e7eb");

  // category label under the icon
  canvas.drawText(label, 400, 480, 4, "#f4f4f5");

  icon(canvas);
}

const center = 400;
const icons = {
  motor: (c) => {
    c.fillRect(330, 180, 140, 150, "#e8492f");
    c.fillRect(356, 136, 88, 44, "#e8492f");
    c.fillRect(330, 330, 140, 54, "#0d0d0f");
    c.fillCircle(360, 330, 18, "#0d0d0f");
    c.fillCircle(440, 330, 18, "#0d0d0f");
  },
  transmision: (c) => {
    const accent = "#3b82f6";
    c.fillCircle(center, 260, 96, accent);
    c.fillCircle(center, 260, 62, "#17171b");
    c.fillCircle(center, 260, 28, accent);
    c.fillRect(center - 130, 252, 260, 16, accent);
    c.fillRect(center - 16, 130, 32, 260, accent);
    c.fillCircle(center - 130, 122, 18, accent);
    c.fillCircle(center + 130, 122, 18, accent);
    c.fillCircle(center - 130, 398, 18, accent);
    c.fillCircle(center + 130, 398, 18, accent);
  },
  frenos: (c) => {
    const accent = "#f59e0b";
    c.fillCircle(center, 260, 100, accent);
    c.fillCircle(center, 260, 68, "#17171b");
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const x = center + Math.cos(a) * 84;
      const y = 260 + Math.sin(a) * 84;
      c.fillCircle(x, y, 9, "#17171b");
    }
    c.fillCircle(center, 260, 26, accent);
    c.fillRect(center - 42, 300, 84, 46, accent);
  },
  suspension: (c) => {
    const accent = "#8b5cf6";
    c.fillRect(320, 160, 44, 130, accent);
    c.fillRect(436, 290, 44, 130, accent);
    c.fillCircle(342, 150, 22, accent);
    c.fillCircle(458, 430, 22, accent);
    for (let y = 200; y < 380; y += 46)
      c.fillRect(364, y, 72, 12, accent);
    c.fillRect(352, 180, 10, 220, accent);
    c.fillRect(438, 180, 10, 220, accent);
  },
  electricidad: (c) => {
    const accent = "#facc15";
    c.fillRect(352, 200, 96, 128, accent);
    c.fillRect(376, 162, 48, 38, accent);
    c.fillRect(372, 328, 56, 44, accent);
    c.fillRect(312, 240, 176, 10, "#17171b");
    c.fillRect(312, 272, 176, 10, "#17171b");
    c.fillCircle(392, 386, 16, accent);
    c.fillRect(384, 392, 16, 48, accent);
  },
  accesorios: (c) => {
    const accent = "#0ea5e9";
    c.fillRect(330, 220, 140, 140, accent);
    c.fillPoly(
      [[330, 220], [470, 220], [430, 180], [370, 180]],
      accent,
    );
    c.fillRect(370, 160, 60, 20, accent);
    c.fillRect(330, 230, 36, 60, "#17171b");
    c.fillRect(434, 230, 36, 60, "#17171b");
  },
  cascos: (c) => {
    const accent = "#14b8a6";
    for (let yy = 150; yy <= 360; yy++)
      for (let xx = center - 110; xx <= center + 110; xx++)
        if ((xx - center) ** 2 + (yy - 360) ** 2 <= 110 ** 2 && yy <= 360)
          c.set(xx, yy, accent);
    c.fillRect(center - 118, 360, 236, 30, accent);
    c.fillRect(center - 62, 246, 124, 10, "#17171b");
    c.fillRect(center - 46, 356, 92, 26, "#17171b");
  },
  lubricantes: (c) => {
    const accent = "#ea580c";
    c.fillRect(348, 220, 104, 150, accent);
    c.fillRect(366, 146, 68, 74, accent);
    c.fillRect(378, 108, 44, 38, accent);
    c.fillCircle(400, 200, 15, "#17171b");
    c.fillRect(360, 262, 26, 52, "#17171b");
    c.fillRect(414, 262, 26, 52, "#17171b");
  },
  llantas: (c) => {
    const accent = "#10b981";
    c.fillCircle(center, 260, 104, accent);
    c.fillCircle(center, 260, 74, "#17171b");
    c.fillCircle(center, 260, 40, accent);
    c.fillCircle(center, 260, 18, "#17171b");
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const x = center + Math.cos(a) * 92;
      const y = 260 + Math.sin(a) * 92;
      c.fillCircle(x, y, 7, "#17171b");
    }
  },
  universales: (c) => {
    const accent = "#f43f5e";
    const points = [];
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i / 6) * Math.PI * 2;
      points.push([center + Math.cos(a) * 108, 260 + Math.sin(a) * 108]);
    }
    c.fillPoly(points, accent);
    c.fillCircle(center, 260, 62, "#17171b");
    c.fillCircle(center, 260, 34, accent);
    c.fillCircle(center, 260, 12, "#17171b");
  },
};

const palette = {
  motor: "#e8492f",
  transmision: "#3b82f6",
  frenos: "#f59e0b",
  suspension: "#8b5cf6",
  electricidad: "#facc15",
  accesorios: "#0ea5e9",
  cascos: "#14b8a6",
  lubricantes: "#ea580c",
  llantas: "#10b981",
  universales: "#f43f5e",
};

const specs = [
  ["demo-motor.png", "MOTOR", icons.motor, "motor"],
  ["demo-transmision.png", "TRANSMISION", icons.transmision, "transmision"],
  ["demo-frenos.png", "FRENOS", icons.frenos, "frenos"],
  ["demo-suspension.png", "SUSPENSION", icons.suspension, "suspension"],
  ["demo-electricidad.png", "ELECTRICIDAD", icons.electricidad, "electricidad"],
  ["demo-accesorios.png", "ACCESORIOS", icons.accesorios, "accesorios"],
  ["demo-cascos.png", "CASCOS", icons.cascos, "cascos"],
  ["demo-lubricantes.png", "ACEITES Y LUBRICANTES", icons.lubricantes, "lubricantes"],
  ["demo-llantas.png", "LLANTAS", icons.llantas, "llantas"],
  ["demo-universales.png", "REPUESTOS UNIVERSALES", icons.universales, "universales"],
];

for (const [name, label, icon, key] of specs) {
  const canvas = makeCanvas("#17171b");
  decorate(canvas, palette[key], label, icon);
  canvas.save(name);
  console.log("generated", name);
}