import { spawnSync } from 'node:child_process'
import fs, { readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import * as fontkit from 'fontkit'
import PDFDocument from 'pdfkit'
import { extractText, getDocumentProxy } from 'unpdf'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NAME_SUBSET_RANGES } from '../../src/services/pdfFontSubsets.js'
import { renderCertificatePdf } from '../../src/services/pdf.service.js'

const CERTIFICATE = {
  recipientName: 'Maria Clara Santos',
  certificateNumber: 'VIT-2026-ABCDEF',
  issuedAt: '2026-11-02T08:00:00Z',
  verificationUrl: 'https://verifyit.test/verify-certificate/VIT-2026-ABCDEF',
  timeZone: 'Asia/Manila',
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('certificate PDF', () => {
  it('renders a complete PDF', async () => {
    const pdf = await renderCertificatePdf(CERTIFICATE)
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
    expect(pdf.subarray(-6).toString()).toContain('%%EOF')
  })

  it('never opens a font file while rendering: a Cloudflare Worker has none, so reading one fails every download', async () => {
    const readFile = vi.spyOn(fs, 'readFileSync')
    await renderCertificatePdf(CERTIFICATE)
    expect(readFile.mock.calls.map(([file]) => String(file)).filter((file) => file.endsWith('.afm'))).toEqual([])
  })

  it('loads in plain Node, which is how the API server runs outside the Worker', () => {
    const moduleUrl = new URL('../../src/services/pdf.service.js', import.meta.url).href
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(moduleUrl)}); console.log('loaded')`], {
      cwd: fileURLToPath(new URL('../..', import.meta.url)),
      encoding: 'utf8',
    })
    expect(result.stderr).toBe('')
    expect(result.stdout.trim()).toBe('loaded')
  })
})

describe('certificate fonts', () => {
  it('has every character of the small name font, so a name is never printed with missing glyphs', () => {
    const font = fontkit.create(readFileSync(new URL('../../assets/fonts/DejaVuSerif-Bold-Latin.ttf', import.meta.url)))
    const full = fontkit.create(readFileSync(new URL('../../node_modules/dejavu-fonts-ttf/ttf/DejaVuSerif-Bold.ttf', import.meta.url)))
    const missing = []
    for (const [from, to] of NAME_SUBSET_RANGES) {
      for (let code = from; code <= to; code += 1) {
        if (full.hasGlyphForCodePoint(code) && !font.hasGlyphForCodePoint(code)) missing.push(code.toString(16))
      }
    }
    expect(missing).toEqual([])
  })

  it.each([
    ['a Filipino name', 'José Rizal Peñaflorida'],
    ['a Vietnamese name, which needs the full font', 'Nguyễn Thị Minh Khai'],
    ['a Greek name, which needs the full font', 'Αλέξανδρος Παπαδόπουλος'],
    ['a Cyrillic name, which needs the full font', 'Анна Иванова'],
  ])('prints %s', async (_label, recipientName) => {
    const pdf = await getDocumentProxy(new Uint8Array(await renderCertificatePdf({ ...CERTIFICATE, recipientName })))
    const { text } = await extractText(pdf, { mergePages: true })
    expect(text).toContain(recipientName)
  })

  // Parsing a full font or an image for every PDF takes more CPU than a Cloudflare Worker allows, and the Worker is then stopped.
  it('prints a typical certificate with only the small fonts and no image', async () => {
    const font = vi.spyOn(PDFDocument.prototype, 'font')
    const image = vi.spyOn(PDFDocument.prototype, 'image')
    await renderCertificatePdf(CERTIFICATE)
    expect(font.mock.calls.map(([name]) => name)).not.toContain('name-full')
    expect(image).not.toHaveBeenCalled()
    for (const name of ['DejaVuSerif-Text', 'DejaVuSerif-Bold-Latin', 'DejaVuSans-Text', 'DejaVuSans-Bold-Text']) {
      expect(statSync(new URL(`../../assets/fonts/${name}.ttf`, import.meta.url)).size).toBeLessThan(64 * 1024)
    }
  })

  it('uses the full font only for a name that needs it', async () => {
    const font = vi.spyOn(PDFDocument.prototype, 'font')
    await renderCertificatePdf({ ...CERTIFICATE, recipientName: 'Анна Иванова' })
    expect(font.mock.calls.map(([name]) => name)).toContain('name-full')
  })
})
