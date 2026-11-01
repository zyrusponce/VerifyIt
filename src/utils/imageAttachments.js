// Prepares an attached image for the AI assistant in the browser: it is decoded, shrunk so its longest side is at
// most 1280 px (text in a screenshot stays readable), and re-encoded as a JPEG data URL well under the API limit.
// Nothing is uploaded until the student selects Analyze Content, and nothing is stored.

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SOURCE_BYTES = 20 * 1024 * 1024
const MAX_EDGE = 1280
// The image-reading models need at least 32 px on each side.
const MIN_EDGE = 32
// The API accepts 1.5 MB per image; staying under 1 MB leaves room and keeps requests quick on mobile data.
const TARGET_BYTES = 1_000_000
const QUALITIES = [0.85, 0.75, 0.65]

/** A problem with one file. `message` is safe to show. */
export class ImageAttachmentError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ImageAttachmentError'
  }
}

/** A decoded image plus a function that frees what decoding held on to. */
async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file)
      return { image: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close?.() }
    } catch {
      // Some browsers cannot make a bitmap from every format; an <img> element may still manage.
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    return { image, width: image.naturalWidth, height: image.naturalHeight, release: () => URL.revokeObjectURL(url) }
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
}

function toJpeg(image, width, height, quality) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return Promise.resolve(null)
  // JPEG has no transparency: transparent screenshot areas become white instead of black.
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, 0, 0, width, height)
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
}

function readAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/**
 * Resolves with { name, dataUrl, width, height, bytes } for one image file, or rejects with ImageAttachmentError.
 */
export async function prepareImage(file) {
  const name = file.name || 'image'
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new ImageAttachmentError(`"${name}" is not a JPG, PNG, or WebP image. Take a screenshot of it and attach that instead.`)
  }
  if (file.size > MAX_SOURCE_BYTES) throw new ImageAttachmentError(`"${name}" is larger than 20 MB. Attach a smaller image or a screenshot.`)

  let decoded
  try {
    decoded = await decode(file)
  } catch {
    throw new ImageAttachmentError(`"${name}" could not be opened. It may be damaged; try another image.`)
  }
  try {
    const { image, width, height } = decoded
    if (Math.min(width, height) < MIN_EDGE) throw new ImageAttachmentError(`"${name}" is too small to read. Attach a larger image.`)
    // Fit the longest side into MAX_EDGE, but never shrink the shortest side below MIN_EDGE (very tall screenshots).
    let scale = Math.min(1, Math.max(MAX_EDGE / Math.max(width, height), MIN_EDGE / Math.min(width, height)))
    for (const quality of QUALITIES) {
      const outWidth = Math.max(MIN_EDGE, Math.round(width * scale))
      const outHeight = Math.max(MIN_EDGE, Math.round(height * scale))
      const blob = await toJpeg(image, outWidth, outHeight, quality)
      if (!blob) break
      if (blob.size <= TARGET_BYTES) return { name, dataUrl: await readAsDataUrl(blob), width: outWidth, height: outHeight, bytes: blob.size }
      scale = Math.max(scale * 0.8, MIN_EDGE / Math.min(width, height))
    }
    throw new ImageAttachmentError(`"${name}" could not be made small enough to send. Try a smaller image or a screenshot of part of it.`)
  } finally {
    decoded.release()
  }
}

/** "245 KB" / "1.2 MB" */
export function formatBytes(bytes) {
  return bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1000))} KB`
}
