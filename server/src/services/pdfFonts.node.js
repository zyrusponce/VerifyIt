// Certificate fonts for the API running in plain Node. The Worker build uses pdfFonts.worker.js instead (see "imports" in package.json).
import { readFileSync } from 'node:fs'

const font = (path) => readFileSync(new URL(path, import.meta.url))

export const FONTS = {
  serif: font('../../assets/fonts/DejaVuSerif-Text.ttf'),
  serifBold: font('../../assets/fonts/DejaVuSerif-Bold-Latin.ttf'),
  sans: font('../../assets/fonts/DejaVuSans-Text.ttf'),
  sansBold: font('../../assets/fonts/DejaVuSans-Bold-Text.ttf'),
  nameFull: font('../../node_modules/dejavu-fonts-ttf/ttf/DejaVuSerif-Bold.ttf'),
}
