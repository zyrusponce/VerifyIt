// Certificate fonts for the Cloudflare Worker, which has no font files to read: Vite embeds them in the bundle (?inline).
import { Buffer } from 'node:buffer'
import serifFontUrl from '../../assets/fonts/DejaVuSerif-Text.ttf?inline'
import serifBoldFontUrl from '../../assets/fonts/DejaVuSerif-Bold-Latin.ttf?inline'
import sansFontUrl from '../../assets/fonts/DejaVuSans-Text.ttf?inline'
import sansBoldFontUrl from '../../assets/fonts/DejaVuSans-Bold-Text.ttf?inline'
import nameFullFontUrl from '../../node_modules/dejavu-fonts-ttf/ttf/DejaVuSerif-Bold.ttf?inline'

function fontBuffer(dataUrl) {
  const comma = dataUrl.indexOf(',')

  if (comma < 0) {
    throw new Error('Invalid embedded font data')
  }

  return Buffer.from(dataUrl.slice(comma + 1), 'base64')
}

export const FONTS = {
  serif: fontBuffer(serifFontUrl),
  serifBold: fontBuffer(serifBoldFontUrl),
  sans: fontBuffer(sansFontUrl),
  sansBold: fontBuffer(sansBoldFontUrl),
  nameFull: fontBuffer(nameFullFontUrl),
}
