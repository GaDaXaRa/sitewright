import { readFileSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'

/**
 * Turns `public/icon.svg` into the icon files a browser and a search engine ask for.
 *
 * They live in `public/` and **not** in Next's app directory: there the framework adds a
 * content hash that changes on every deploy, and Google needs a fixed address to associate
 * an icon with a site — while it does not have one, the results show the generic globe.
 *
 * The .ico is 48×48 because that is what Google asks for: square and a multiple of 48.
 *
 *   npm run icons
 */
const svg = readFileSync('public/icon.svg')

// The density matters: rasterising an SVG at its natural size gives a blurry 512px icon.
const png = (size) => sharp(svg, { density: 512 }).resize(size, size).png().toBuffer()

/** An ICO container around a single PNG, which is all any current browser needs. */
function ico(image, size) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(1, 4) // one image

  const entry = Buffer.alloc(16)
  entry.writeUInt8(size, 0)
  entry.writeUInt8(size, 1)
  entry.writeUInt8(0, 2) // palette
  entry.writeUInt8(0, 3) // reserved
  entry.writeUInt16LE(1, 4) // colour planes
  entry.writeUInt16LE(32, 6) // bits per pixel
  entry.writeUInt32LE(image.length, 8)
  entry.writeUInt32LE(header.length + entry.length, 12)

  return Buffer.concat([header, entry, image])
}

const [ico48, apple, png192, png512] = await Promise.all([png(48), png(180), png(192), png(512)])

writeFileSync('public/favicon.ico', ico(ico48, 48))
writeFileSync('public/apple-icon.png', apple)
writeFileSync('public/icon-192.png', png192)
writeFileSync('public/icon-512.png', png512)

console.log('Iconos escritos en public/: favicon.ico, apple-icon.png, icon-192.png, icon-512.png')
