// Generates six landscape variations for the gallery demo, plus tiny placeholders.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'img')
mkdirSync(out, { recursive: true })

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}
function encodePng(width, height, pixel) {
  const raw = Buffer.alloc((width * 3 + 1) * height)
  for (let y = 0; y < height; y++) {
    const row = y * (width * 3 + 1)
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixel(x / width, y / height)
      const i = row + 1 + x * 3
      raw[i] = r
      raw[i + 1] = g
      raw[i + 2] = b
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 6 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)))
let seed = 1
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0
  return seed / 0xffffffff
}

// Each scene: sky colors top and bottom, sun position and color, land and water tints, ridge shape.
const scenes = [
  {
    name: 'dawn',
    sky: [
      [250, 150, 90],
      [255, 220, 170],
    ],
    sun: [0.7, 0.35, [255, 240, 200]],
    land: [40, 45, 80],
    water: [30, 70, 130],
    f: 9,
  },
  {
    name: 'noon',
    sky: [
      [70, 140, 230],
      [190, 220, 250],
    ],
    sun: [0.3, 0.2, [255, 255, 240]],
    land: [60, 110, 70],
    water: [40, 120, 170],
    f: 13,
  },
  {
    name: 'dusk',
    sky: [
      [120, 60, 140],
      [250, 120, 90],
    ],
    sun: [0.5, 0.45, [255, 170, 120]],
    land: [35, 25, 50],
    water: [70, 40, 90],
    f: 7,
  },
  {
    name: 'night',
    sky: [
      [10, 15, 40],
      [30, 40, 80],
    ],
    sun: [0.75, 0.25, [230, 235, 255]],
    land: [15, 18, 35],
    water: [20, 30, 60],
    f: 11,
  },
  {
    name: 'storm',
    sky: [
      [70, 75, 85],
      [140, 145, 150],
    ],
    sun: [0.2, 0.3, [180, 180, 180]],
    land: [40, 50, 45],
    water: [50, 70, 80],
    f: 17,
  },
  {
    name: 'mist',
    sky: [
      [200, 210, 220],
      [235, 235, 230],
    ],
    sun: [0.6, 0.3, [255, 250, 235]],
    land: [120, 130, 125],
    water: [150, 170, 175],
    f: 5,
  },
]

const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t)

function makeScene(s) {
  return (u, v) => {
    const horizon = 0.62
    let c
    if (v < horizon) {
      c = mix(s.sky[0], s.sky[1], v / horizon)
      const d = Math.hypot(u - s.sun[0], (v - s.sun[1]) * 1.6)
      if (d < 0.09) c = mix(c, s.sun[2], 1 - d / 0.09)
      const ridge =
        0.5 +
        0.08 * Math.sin(u * s.f) +
        0.05 * Math.sin(u * s.f * 2.6 + 1) +
        0.03 * Math.sin(u * 57)
      if (v > ridge)
        c = mix(
          s.land,
          s.land.map((x) => x + 40),
          (v - ridge) * 4,
        )
    } else {
      const t = (v - horizon) / (1 - horizon)
      const ripple = Math.sin(u * 80 + t * 40) * Math.sin(t * 25) * 10
      c = mix(
        s.water,
        s.water.map((x) => x + 50),
        t,
      ).map((x) => x + ripple)
      if (Math.abs(u - s.sun[0]) < 0.06 * (1 - t) + 0.01) c = mix(c, s.sun[2], 0.35 * (1 - t))
    }
    const noise = (rand() - 0.5) * 18
    return c.map((x) => clamp(x + noise))
  }
}

scenes.forEach((s, i) => {
  seed = 42 + i
  writeFileSync(join(out, `gallery-${i + 1}.png`), encodePng(960, 640, makeScene(s)))
  seed = 42 + i
  writeFileSync(join(out, `gallery-${i + 1}-tiny.png`), encodePng(24, 16, makeScene(s)))
})
console.log('wrote', scenes.length, 'gallery images to', out)
