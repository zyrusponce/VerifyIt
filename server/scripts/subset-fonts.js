// Regenerates assets/fonts: small DejaVu fonts holding only the characters certificates normally print, because
// parsing the full fonts for every PDF takes more CPU than a Cloudflare Worker allows. Run: npm run fonts:subset
// A name with other characters is printed with the full DejaVu Serif Bold (see pdf.service.js).
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import subsetFont from 'subset-font'
import { NAME_SUBSET_RANGES, TEXT_SUBSET_RANGE } from '../src/services/pdfFontSubsets.js'

const source = new URL('../node_modules/dejavu-fonts-ttf/', import.meta.url)
const target = new URL('../assets/fonts/', import.meta.url)
mkdirSync(target, { recursive: true })

const characters = (ranges) => ranges.flatMap(([from, to]) => Array.from({ length: to - from + 1 }, (_, i) => String.fromCodePoint(from + i))).join('')
const FONTS = {
  'DejaVuSerif-Text': ['DejaVuSerif', [TEXT_SUBSET_RANGE]],
  'DejaVuSerif-Bold-Latin': ['DejaVuSerif-Bold', NAME_SUBSET_RANGES],
  'DejaVuSans-Text': ['DejaVuSans', [TEXT_SUBSET_RANGE]],
  'DejaVuSans-Bold-Text': ['DejaVuSans-Bold', [TEXT_SUBSET_RANGE]],
}

for (const [name, [font, ranges]] of Object.entries(FONTS)) {
  const subset = await subsetFont(readFileSync(new URL(`ttf/${font}.ttf`, source)), characters(ranges), { targetFormat: 'truetype' })
  writeFileSync(new URL(`${name}.ttf`, target), subset)
  console.log(`${name}.ttf: ${(subset.length / 1024).toFixed(0)} KB`)
}
copyFileSync(new URL('LICENSE', source), new URL('LICENSE', target))
