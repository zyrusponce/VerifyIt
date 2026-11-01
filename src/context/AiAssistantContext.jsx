import { createContext, useEffect, useRef, useState } from 'react'
import useAuth from '../hooks/useAuth'
import { ApiError, api } from '../lib/api'
import { AI_CONTENT_MAX_LENGTH, AI_CONTENT_MIN_LENGTH, AI_MAX_IMAGES, AI_SOURCE_URL_MAX_LENGTH } from '../utils/aiReport'
import { ACCEPTED_IMAGE_TYPES, ImageAttachmentError, prepareImage } from '../utils/imageAttachments'

export const AiAssistantContext = createContext(null)

// The server tries two AI providers with a 25-second timeout each, so allow for both before giving up.
const ANALYZE_TIMEOUT_MS = 70000
// The server gives a website 10 seconds (DNS check, redirects, and download together).
const LINK_TIMEOUT_MS = 20000

// Text copied from PDFs and word processors can carry invisible control characters (form feeds, vertical tabs).
// The API rejects every control character except line breaks and tabs, so those become spaces before sending.
const CONTROL_CHARACTERS = /[^\P{Cc}\n\r\t]/gu

const IDLE = { status: 'idle', result: null, error: null, startedAt: null }
const LINK_IDLE = { status: 'idle', result: null, error: null }
// "What Other Sources Say": idle, loading, success, error, or unavailable (not set up on this server: the section is hidden).
const SOURCES_IDLE = { status: 'idle', result: null, error: null }
const MAX_SOURCE_CLAIMS = 5
const NO_IMAGE_PROBLEM = { processing: 0, error: null }

/** The claims worth checking against published fact-checks: factual, checkable ones first, else any claim. */
function claimsToCheck(analysis) {
  const claims = Array.isArray(analysis?.claims) ? analysis.claims : []
  const usable = (list) => list.map((item) => (typeof item?.claim === 'string' ? item.claim.trim() : '')).filter((claim) => claim.length >= 3)
  const factual = usable(claims.filter((item) => item?.type === 'fact' && item?.verifiable))
  return (factual.length ? factual : usable(claims)).slice(0, MAX_SOURCE_CLAIMS)
}

/** Client-side check for instant feedback only; the server validates the URL again. */
function validateSourceUrl(value) {
  const url = value.trim()
  if (!url) return null
  if (url.length > AI_SOURCE_URL_MAX_LENGTH) return `Use a web address of at most ${AI_SOURCE_URL_MAX_LENGTH.toLocaleString('en-US')} characters.`
  // Same rule as the server (zod's http URL check): the scheme must be followed by '//'. new URL() would otherwise
  // turn typos like 'https:/example.com' or 'http:example.com' into valid URLs.
  if (!/^https?:\/\//i.test(url)) return 'Enter a full web address that starts with http:// or https://.'
  let parsed = null
  try {
    parsed = new URL(url)
  } catch {
    parsed = null // Not a full web address; reported below.
  }
  if (parsed && (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname) return null
  return 'Enter a full web address that starts with http:// or https://.'
}

let nextImageId = 0

/**
 * The AI Investigation Assistant's input (text, link, images), request, and result. The /assistant page and the
 * floating assistant panel both read this one copy, so work started in one continues in the other and survives
 * page changes. It is kept in memory only (never in browser storage) and is forgotten when the signed-in user changes.
 */
export function AiAssistantProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [owner, setOwner] = useState(userId)
  const [content, setContent] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [urlError, setUrlError] = useState(null)
  const [truncated, setTruncated] = useState(false)
  const [images, setImages] = useState([])
  const [imageStatus, setImageStatus] = useState(NO_IMAGE_PROBLEM)
  const [link, setLink] = useState(LINK_IDLE)
  const [analysis, setAnalysis] = useState(IDLE)
  const [sources, setSources] = useState(SOURCES_IDLE)
  // Only the newest request may update the state: clearing, re-submitting, or a change of user makes older responses
  // stale. Images being prepared and a link being read are tracked the same way.
  const latestRequest = useRef(0)
  const inputGeneration = useRef(0)
  const latestLinkRequest = useRef(0)
  // The text box as it is now, for a link reply that arrives after the student kept typing.
  const latestContent = useRef(content)
  useEffect(() => {
    latestContent.current = content
  }, [content])

  // Someone else may use this browser next, so signing out (or in as someone else) forgets the input and results.
  // Reset while rendering, so the next user never sees them, not even for one frame.
  if (owner !== userId) {
    setOwner(userId)
    setContent('')
    setSourceUrl('')
    setUrlError(null)
    setTruncated(false)
    setImages([])
    setImageStatus(NO_IMAGE_PROBLEM)
    setLink(LINK_IDLE)
    setAnalysis(IDLE)
    setSources(SOURCES_IDLE)
  }

  // ...and a reply (or a prepared image) for the previous user is ignored.
  useEffect(() => {
    latestRequest.current += 1
    inputGeneration.current += 1
    latestLinkRequest.current += 1
  }, [userId])

  const text = content.replace(CONTROL_CHARACTERS, ' ').trim()
  const loading = analysis.status === 'loading'
  const preparingImages = imageStatus.processing > 0
  const hasImages = images.length > 0
  const canAnalyze =
    !loading && !preparingImages && text.length <= AI_CONTENT_MAX_LENGTH && (hasImages || text.length >= AI_CONTENT_MIN_LENGTH)

  async function runAnalysis() {
    const nextUrlError = validateSourceUrl(sourceUrl)
    setUrlError(nextUrlError)
    if (nextUrlError || !canAnalyze) return
    latestRequest.current += 1
    const requestId = latestRequest.current
    const submittedUrl = sourceUrl.trim() || null
    const body = { content: text, sourceUrl: submittedUrl }
    if (hasImages) body.images = images.map((image) => ({ dataUrl: image.dataUrl }))
    setAnalysis({ status: 'loading', result: null, error: null, startedAt: Date.now() })
    setSources(SOURCES_IDLE)
    try {
      const data = await api.post('/ai/analyze', body, { auth: true, timeoutMs: ANALYZE_TIMEOUT_MS })
      if (requestId !== latestRequest.current) return
      if (!data?.analysis) {
        throw new ApiError({ status: 502, code: 'INVALID_RESPONSE', message: 'The server sent an unexpected response. Please try again.' })
      }
      setAnalysis({
        status: 'success',
        result: { analysis: data.analysis, meta: data.meta, sourceUrl: submittedUrl, imageCount: images.length },
        error: null,
        startedAt: null,
      })
      checkOtherSources(data.analysis, submittedUrl, requestId)
    } catch (error) {
      if (requestId !== latestRequest.current) return
      setAnalysis({ status: 'error', result: null, error, startedAt: null })
    }
  }

  /** Searches published fact-checks and news reports for the analysis's claims. Belongs to the analysis it was started for. */
  async function checkOtherSources(result, pageUrl, requestId) {
    const claims = claimsToCheck(result)
    if (claims.length === 0) {
      setSources(SOURCES_IDLE)
      return
    }
    setSources({ status: 'loading', result: null, error: null })
    try {
      const queries = Array.isArray(result.searchQueries) ? result.searchQueries.filter((query) => typeof query === 'string') : []
      const data = await api.post('/ai/check-sources', { claims, queries, ...(pageUrl ? { sourceUrl: pageUrl } : {}) }, { auth: true, timeoutMs: ANALYZE_TIMEOUT_MS })
      if (requestId !== latestRequest.current) return
      if (!Array.isArray(data?.sources)) {
        throw new ApiError({ status: 502, code: 'INVALID_RESPONSE', message: 'The server sent an unexpected response. Please try again.' })
      }
      setSources({ status: 'success', result: { ...data, claims }, error: null })
    } catch (error) {
      if (requestId !== latestRequest.current) return
      // Not set up on this server (no Google key, or an older API): leave the section out instead of showing an error.
      const unavailable = error?.code === 'FACT_CHECK_NOT_CONFIGURED' || error?.status === 404
      setSources(unavailable ? { status: 'unavailable', result: null, error: null } : { status: 'error', result: null, error })
    }
  }

  function retrySources() {
    if (analysis.status === 'success' && sources.status !== 'loading') checkOtherSources(analysis.result.analysis, analysis.result.sourceUrl, latestRequest.current)
  }

  function changeContent(value) {
    setContent(value)
    if (value.length < AI_CONTENT_MAX_LENGTH) setTruncated(false)
  }

  function changeSourceUrl(value) {
    setSourceUrl(value)
    if (urlError) setUrlError(validateSourceUrl(value))
    // A message about the previous link no longer applies.
    if (link.status !== 'loading' && link.status !== 'idle') setLink(LINK_IDLE)
  }

  function checkSourceUrl() {
    setUrlError(validateSourceUrl(sourceUrl))
  }

  /** Shrinks and adds image files (from the file picker, a paste, or a drop) up to the three-image limit. */
  async function addImages(fileList) {
    const files = [...(fileList ?? [])]
    if (files.length === 0 || loading) return
    const slots = AI_MAX_IMAGES - images.length
    if (slots <= 0) {
      setImageStatus({ processing: 0, error: `You can attach up to ${AI_MAX_IMAGES} images. Remove one to add another.` })
      return
    }
    const accepted = files.slice(0, slots)
    const problems = files.length > slots ? [`You can attach up to ${AI_MAX_IMAGES} images, so only the first ${slots === 1 ? 'one was' : `${slots} were`} added.`] : []
    const generation = inputGeneration.current
    setImageStatus((current) => ({ processing: current.processing + accepted.length, error: null }))
    for (const file of accepted) {
      try {
        const prepared = await prepareImage(file)
        if (generation !== inputGeneration.current) return
        nextImageId += 1
        const id = `image-${nextImageId}`
        setImages((current) => (current.length < AI_MAX_IMAGES ? [...current, { id, ...prepared }] : current))
      } catch (error) {
        if (generation !== inputGeneration.current) return
        problems.push(error instanceof ImageAttachmentError ? error.message : `"${file.name || 'image'}" could not be attached. Try another image.`)
      } finally {
        if (generation === inputGeneration.current) {
          setImageStatus((current) => ({ ...current, processing: Math.max(0, current.processing - 1) }))
        }
      }
    }
    if (problems.length) setImageStatus((current) => ({ ...current, error: problems.join(' ') }))
  }

  function removeImage(id) {
    setImages((current) => current.filter((image) => image.id !== id))
    setImageStatus((current) => ({ ...current, error: null }))
  }

  /** Reads the page at the source link (on the server) and offers its text for the text box. */
  async function fetchLinkText() {
    const nextUrlError = sourceUrl.trim() ? validateSourceUrl(sourceUrl) : 'Enter the link first, starting with http:// or https://.'
    setUrlError(nextUrlError)
    if (nextUrlError || loading || link.status === 'loading') return
    latestLinkRequest.current += 1
    const requestId = latestLinkRequest.current
    setLink({ status: 'loading', result: null, error: null })
    try {
      const result = await api.post('/ai/extract-link', { url: sourceUrl.trim() }, { auth: true, timeoutMs: LINK_TIMEOUT_MS })
      if (requestId !== latestLinkRequest.current) return
      if (typeof result?.text !== 'string') {
        throw new ApiError({ status: 502, code: 'INVALID_RESPONSE', message: 'The server sent an unexpected response. Please try again.' })
      }
      if (latestContent.current.trim()) {
        // Never overwrite what the student typed without asking.
        setLink({ status: 'confirm', result, error: null })
      } else {
        applyLinkText(result)
      }
    } catch (error) {
      if (requestId !== latestLinkRequest.current) return
      setLink({ status: 'error', result: null, error })
    }
  }

  function applyLinkText(result = link.result) {
    if (!result) return
    setContent(result.text)
    setTruncated(false)
    // After redirects the page may live at another address; that is the source the analysis should name.
    if (typeof result.url === 'string' && result.url) setSourceUrl(result.url)
    setUrlError(null)
    setLink({ status: 'loaded', result, error: null })
  }

  function dismissLink() {
    latestLinkRequest.current += 1
    setLink(LINK_IDLE)
  }

  /** Empties the inputs. An unfinished or failed analysis belongs to the input being cleared; a finished one stays. */
  function clearInput() {
    inputGeneration.current += 1
    latestLinkRequest.current += 1
    setContent('')
    setSourceUrl('')
    setUrlError(null)
    setTruncated(false)
    setImages([])
    setImageStatus(NO_IMAGE_PROBLEM)
    setLink(LINK_IDLE)
    if (analysis.status === 'loading' || analysis.status === 'error') {
      latestRequest.current += 1
      setAnalysis(IDLE)
      setSources(SOURCES_IDLE)
    }
  }

  function clearAnalysis() {
    latestRequest.current += 1
    setAnalysis(IDLE)
    setSources(SOURCES_IDLE)
  }

  const value = {
    content,
    sourceUrl,
    urlError,
    truncated,
    images,
    imageStatus,
    preparingImages,
    acceptedImageTypes: ACCEPTED_IMAGE_TYPES,
    link,
    analysis,
    sources,
    loading,
    canAnalyze,
    textLength: text.length,
    changeContent,
    setTruncated,
    changeSourceUrl,
    checkSourceUrl,
    addImages,
    removeImage,
    fetchLinkText,
    applyLinkText,
    dismissLink,
    runAnalysis,
    retrySources,
    clearInput,
    clearAnalysis,
  }

  return <AiAssistantContext.Provider value={value}>{children}</AiAssistantContext.Provider>
}
