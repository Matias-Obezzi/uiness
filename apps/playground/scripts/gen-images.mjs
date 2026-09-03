// Generates public/img/photo.png (1600x1000) and photo-tiny.png (32x20) without dependencies.
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

function crc32(buf) {
  let c = 0xffffffff
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typeAndData))
  return Buffer.concat([len, typeAndData, crc])
}

function encodePng(width, height, pixel) {
  const raw = Buffer.alloc((width * 3 + 1) * height)
  for (let y = 0; y < height; y++) {
    const row = y * (width * 3 + 1)
    raw[row] = 0
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixel(x / width, y / height, x, y)
      const i = row + 1 + x * 3
      raw[i] = r
      raw[i + 1] = g
      raw[i + 2] = b
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 6 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// A "landscape": sky gradient, sun, mountains, water with ripples, plus noise so it is not tiny.
let seed = 42
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0
  return seed / 0xffffffff
}

function scene(u, v) {
  let r
  let g
  let b
  const horizon = 0.62
  if (v < horizon) {
    r = 250 - v * 200
    g = 150 + v * 60
    b = 90 + v * 200
    const sun = Math.hypot(u - 0.7, (v - 0.35) * 1.6)
    if (sun < 0.09) {
      const t = 1 - sun / 0.09
      r = Math.min(255, r + 60 * t)
      g = Math.min(255, g + 90 * t)
      b = Math.min(255, b + 120 * t)
    }
    const ridge =
      0.52 + 0.08 * Math.sin(u * 9) + 0.05 * Math.sin(u * 23 + 1) + 0.03 * Math.sin(u * 57)
    if (v > ridge) {
      const d = (v - ridge) * 4
      r = 40 + 30 * d
      g = 45 + 40 * d
      b = 80 + 40 * d
    }
  } else {
    const t = (v - horizon) / (1 - horizon)
    const ripple = Math.sin(u * 80 + t * 40) * Math.sin(t * 25) * 12
    r = 30 + 40 * t + ripple
    g = 70 + 60 * t + ripple
    b = 130 + 30 * t + ripple
    const reflect = Math.abs(u - 0.7) < 0.06 * (1 - t) + 0.01
    if (reflect) {
      r += 80 * (1 - t)
      g += 60 * (1 - t)
      b += 20 * (1 - t)
    }
  }
  const noise = (rand() - 0.5) * 22
  return [r + noise, g + noise, b + noise].map((c) => Math.max(0, Math.min(255, Math.round(c))))
}

writeFileSync(join(out, 'photo.png'), encodePng(1600, 1000, scene))
seed = 42
writeFileSync(join(out, 'photo-tiny.png'), encodePng(32, 20, scene))
console.log('wrote', out)
