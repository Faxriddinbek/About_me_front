/**
 * One-off image pipeline: convert everything under public/ to WebP.
 *
 * The design export shipped 11 MB of JPEG/PNG — on a phone that is roughly 20
 * seconds before the hero even appears. Resizing to a sane maximum width and
 * re-encoding as WebP cuts it by well over 90% with no visible difference.
 *
 * Run with:  npm run optimize:images
 *
 * Originals are deleted once a smaller WebP exists, so the repository only ever
 * carries the optimised files. The untouched source images remain in
 * "D:\About me\Faxriddinbek portfolio home page".
 */

import { readdir, stat, unlink } from 'node:fs/promises'
import { join, extname, basename, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PUBLIC_DIR = join(ROOT, 'public')

const CONVERTIBLE = new Set(['.jpg', '.jpeg', '.png'])
const MAX_WIDTH = 1920
const QUALITY = 80

/** Recursively yield every file path under `dir`. */
async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(path)
    else yield path
  }
}

const format = (bytes) => `${(bytes / 1024).toFixed(0)} KB`

let originalTotal = 0
let optimisedTotal = 0

for await (const path of walk(PUBLIC_DIR)) {
  if (!CONVERTIBLE.has(extname(path).toLowerCase())) continue

  const before = (await stat(path)).size
  const target = join(dirname(path), `${basename(path, extname(path))}.webp`)

  await sharp(path)
    // withoutEnlargement keeps already-small images at their native size
    // instead of upscaling them into a bigger file.
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(target)

  const after = (await stat(target)).size
  originalTotal += before
  optimisedTotal += after

  await unlink(path)

  const saved = (100 * (1 - after / before)).toFixed(1)
  console.log(`${basename(path)} → ${basename(target)}  ${format(before)} → ${format(after)}  (-${saved}%)`)
}

console.log(
  `\nTotal: ${format(originalTotal)} → ${format(optimisedTotal)} ` +
    `(-${(100 * (1 - optimisedTotal / originalTotal)).toFixed(1)}%)`,
)
