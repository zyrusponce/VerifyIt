/*
  ⚡ LAYER: Service (certificate PDF rendering)
  🔒 SECURITY: Renders only the stored certificate snapshot passed in by the certificate service, which
     has already verified ownership and active status. The QR code encodes the public verification URL.
  🚨 ERROR HANDLING: The whole PDF is rendered into memory first; any PDFKit/QR failure rejects the
     promise (→ 500 via the error handler) so a partial or broken file is never sent.
*/

import { Buffer } from 'node:buffer'
import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'
import * as fontkit from 'fontkit'

import serifFontUrl from '../../node_modules/dejavu-fonts-ttf/ttf/DejaVuSerif.ttf?inline'
import serifBoldFontUrl from '../../node_modules/dejavu-fonts-ttf/ttf/DejaVuSerif-Bold.ttf?inline'
import sansFontUrl from '../../node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf?inline'
import sansBoldFontUrl from '../../node_modules/dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf?inline'

function fontBuffer(dataUrl) {
  const comma = dataUrl.indexOf(',')

  if (comma < 0) {
    throw new Error('Invalid embedded font data')
  }

  return Buffer.from(dataUrl.slice(comma + 1), 'base64')
}

const FONTS = {
  serif: fontBuffer(serifFontUrl),
  serifBold: fontBuffer(serifBoldFontUrl),
  sans: fontBuffer(sansFontUrl),
  sansBold: fontBuffer(sansBoldFontUrl),
}

const COLORS = {
  navy: '#0b1f4d',
  navySoft: '#1f386d',
  cyan: '#0891b2',
  cyanLight: '#a5f3fc',
  slate: '#475569',
  muted: '#64748b',
}

export const CERTIFICATE_TEXT = Object.freeze({
  title: 'Certificate of Completion',
  program: 'Media Literacy and Online Misinformation Awareness',
  issuer: 'VerifyIT educational project',
  description:
    'Awarded for completing every VerifyIT learning module on recognizing misinformation and every ' +
    'Investigation Lab case on verifying online claims.',
  disclaimer:
    'Issued by the VerifyIT educational project. This certificate recognizes completion of VerifyIT ' +
    'activities and is not a government, academic, or professional credential.',
})

// Ligatures (fi, fl) are turned off so text copied from the PDF, including the verification URL,
// matches exactly what is printed. fontkit mutates the object it receives, so build a new one per call.
const noLigatures = () => ({ liga: false, clig: false })

let nameFont
/** True when every character of the name has a glyph in the font used to print it. */
export function canPrintName(name) {
  nnameFont ??= fontkit.create(FONTS.serifBold)
  for (const char of String(name ?? '')) {
    if (char === ' ') continue
    if (!nameFont.hasGlyphForCodePoint(char.codePointAt(0))) return false
  }
  return true
}

export function formatIssueDate(isoDate, timeZone = 'UTC') {
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone }).format(new Date(isoDate))
}

/** Largest font size (between max and min) at which `text` fits on one line of `width`. */
function fitFontSize(doc, text, { font, max, min, width }) {
  doc.font(font)
  for (let size = max; size > min; size -= 1) {
    if (doc.fontSize(size).widthOfString(text, { features: noLigatures() }) <= width) return size
  }
  return min
}

function centered(doc, text, y, { font, size, color, width, x, characterSpacing = 0 }) {
  doc
    .font(font)
    .fontSize(size)
    .fillColor(color)
    .text(text, x, y, { width, align: 'center', characterSpacing, lineBreak: true, features: noLigatures() })
}

/**
 * Renders the certificate as an A4 landscape PDF and resolves with the complete file.
 * @param {{ recipientName: string, certificateNumber: string, issuedAt: string, verificationUrl: string,
 *           timeZone?: string, compress?: boolean }} certificate
 */
export async function renderCertificatePdf({ recipientName, certificateNumber, issuedAt, verificationUrl, timeZone = 'UTC', compress = true }) {
  const qrPng = await QRCode.toBuffer(verificationUrl, {
    type: 'png',
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 320,
    color: { dark: COLORS.navy, light: '#ffffff' },
  })
  const issueDate = formatIssueDate(issuedAt, timeZone)

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 0,
      compress,
      autoFirstPage: true,
      info: {
        Title: `VerifyIT ${CERTIFICATE_TEXT.title} - ${certificateNumber}`,
        Author: 'VerifyIT',
        Subject: CERTIFICATE_TEXT.program,
        Creator: 'VerifyIT',
      },
    })
    const chunks = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    try {
      doc.registerFont('serif', FONTS.serif)
      doc.registerFont('serif-bold', FONTS.serifBold)
      doc.registerFont('sans', FONTS.sans)
      doc.registerFont('sans-bold', FONTS.sansBold)

      const { width: pageWidth, height: pageHeight } = doc.page
      const contentX = 90
      const contentWidth = pageWidth - contentX * 2

      // Borders: navy frame, thin cyan inner rule, small corner accents.
      doc.lineWidth(2.5).strokeColor(COLORS.navy).rect(24, 24, pageWidth - 48, pageHeight - 48).stroke()
      doc.lineWidth(0.75).strokeColor(COLORS.cyan).rect(34, 34, pageWidth - 68, pageHeight - 68).stroke()
      const accent = 26
      for (const [x, y, dx, dy] of [
        [34, 34, 1, 1],
        [pageWidth - 34, 34, -1, 1],
        [34, pageHeight - 34, 1, -1],
        [pageWidth - 34, pageHeight - 34, -1, -1],
      ]) {
        doc.lineWidth(3).strokeColor(COLORS.cyan).moveTo(x, y + dy * accent).lineTo(x, y).lineTo(x + dx * accent, y).stroke()
      }

      // Wordmark: "Verify" in navy, "IT" in cyan.
      doc.font('sans-bold').fontSize(20)
      const verifyWidth = doc.widthOfString('Verify')
      const markWidth = verifyWidth + doc.widthOfString('IT')
      const markX = (pageWidth - markWidth) / 2
      doc.fillColor(COLORS.navy).text('Verify', markX, 62, { lineBreak: false, features: noLigatures() })
      doc.fillColor(COLORS.cyan).text('IT', markX + verifyWidth, 62, { lineBreak: false, features: noLigatures() })
      centered(doc, 'A CAMPAIGN AGAINST ONLINE MISINFORMATION', 88, {
        font: 'sans',
        size: 7.5,
        color: COLORS.muted,
        width: contentWidth,
        x: contentX,
        characterSpacing: 1.2,
      })

      centered(doc, CERTIFICATE_TEXT.title.toUpperCase(), 122, {
        font: 'serif-bold',
        size: 30,
        color: COLORS.navy,
        width: contentWidth,
        x: contentX,
        characterSpacing: 3,
      })
      doc.lineWidth(1.25).strokeColor(COLORS.cyan).moveTo(pageWidth / 2 - 70, 168).lineTo(pageWidth / 2 + 70, 168).stroke()

      centered(doc, 'This certifies that', 186, { font: 'serif', size: 13, color: COLORS.slate, width: contentWidth, x: contentX })

      const nameSize = fitFontSize(doc, recipientName, { font: 'serif-bold', max: 38, min: 18, width: contentWidth - 40 })
      centered(doc, recipientName, 210 + (38 - nameSize) / 2, {
        font: 'serif-bold',
        size: nameSize,
        color: COLORS.navy,
        width: contentWidth,
        x: contentX,
      })
      doc.lineWidth(0.75).strokeColor(COLORS.navySoft).moveTo(pageWidth / 2 - 220, 262).lineTo(pageWidth / 2 + 220, 262).stroke()

      centered(doc, 'has successfully completed', 276, { font: 'serif', size: 13, color: COLORS.slate, width: contentWidth, x: contentX })
      centered(doc, CERTIFICATE_TEXT.program.toUpperCase(), 300, {
        font: 'sans-bold',
        size: 15,
        color: COLORS.navy,
        width: contentWidth,
        x: contentX,
        characterSpacing: 1,
      })
      centered(doc, CERTIFICATE_TEXT.description, 330, {
        font: 'serif',
        size: 11,
        color: COLORS.slate,
        width: contentWidth - 120,
        x: contentX + 60,
      })

      // Details (left) and verification QR code (right).
      const detailsTop = 400
      const label = (text, x, y) =>
        doc.font('sans-bold').fontSize(7.5).fillColor(COLORS.muted).text(text, x, y, { characterSpacing: 1.2, lineBreak: false, features: noLigatures() })
      const value = (text, x, y) => doc.font('sans').fontSize(12).fillColor(COLORS.navy).text(text, x, y, { lineBreak: false, features: noLigatures() })

      label('DATE OF ISSUE', 90, detailsTop)
      value(issueDate, 90, detailsTop + 13)
      label('CERTIFICATE NUMBER', 90, detailsTop + 44)
      value(certificateNumber, 90, detailsTop + 57)
      label('ISSUED BY', 330, detailsTop)
      value('VerifyIT', 330, detailsTop + 13)

      const qrSize = 96
      const qrX = pageWidth - 90 - qrSize
      doc.image(qrPng, qrX, detailsTop - 6, { width: qrSize, height: qrSize })
      doc
        .font('sans-bold')
        .fontSize(7.5)
        .fillColor(COLORS.muted)
        .text('SCAN TO VERIFY', qrX - 130, detailsTop + 20, { width: 120, align: 'right', characterSpacing: 1.2, features: noLigatures() })
      doc
        .font('sans')
        .fontSize(7.5)
        .fillColor(COLORS.navySoft)
        .text(verificationUrl, 330, detailsTop + 44, { width: qrX - 330 - 12, align: 'left', lineGap: 1, features: noLigatures() })

      centered(doc, CERTIFICATE_TEXT.disclaimer, pageHeight - 72, {
        font: 'sans',
        size: 7.5,
        color: COLORS.muted,
        width: contentWidth,
        x: contentX,
      })

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}
