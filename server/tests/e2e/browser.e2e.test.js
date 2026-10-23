// End-to-end browser test of the real frontend + API + SQL (PGlite), with a stand-in for Supabase Auth.
// Requires a locally installed Chromium-based browser. Run: npm run test:e2e --prefix server
//   E2E_BROWSER_CHANNEL=msedge|chrome (default msedge) or E2E_BROWSER_PATH=/path/to/browser
//   E2E_SCREENSHOT_DIR=/some/dir to save screenshots of key screens.
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright-core'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { startStack } from './stack.js'
import { REQUIRED_LESSON_IDS } from '../../src/data/lessons.js'
import { REQUIRED_CASE_IDS } from '../../src/data/investigations.js'

let stack
let browser
let page
const pageErrors = []
const screenshotDir = process.env.E2E_SCREENSHOT_DIR

async function shot(name) {
  if (!screenshotDir) return
  fs.mkdirSync(screenshotDir, { recursive: true })
  await page.screenshot({ path: path.join(screenshotDir, `${name}.png`), fullPage: true })
}

const go = (route) => page.goto(`${stack.baseUrl}${route}`)

async function answerKnowledgeCheck() {
  const questions = page.locator('form fieldset')
  const count = await questions.count()
  for (let i = 0; i < count; i += 1) await questions.nth(i).locator('label').first().click()
  await page.getByRole('button', { name: 'Check my answers' }).click()
}

async function takeQuiz(categoryId) {
  await go(`/quiz/${categoryId}`)
  await page.getByRole('button', { name: /^(Start Quiz|Start a new attempt)$/ }).click()
  for (let guard = 0; guard < 20; guard += 1) {
    await page.locator('fieldset').first().locator('label').first().click()
    await page.getByRole('button', { name: 'Submit answer' }).click()
    await page.locator('[role="status"]').filter({ hasText: /^(Correct|Not quite)/ }).first().waitFor()
    const finish = page.getByRole('button', { name: 'Finish Quiz' })
    if (await finish.count()) {
      await finish.click()
      break
    }
    await page.getByRole('button', { name: 'Next', exact: true }).click()
  }
  await page.getByText(/Quiz complete/).waitFor()
}

async function submitCase(caseId, verdictLabel = 'Not enough information to decide') {
  await go(`/lab/${caseId}`)
  await page.getByText(verdictLabel, { exact: true }).click()
  await page.getByRole('button', { name: 'Submit Investigation' }).click()
  await page.getByRole('heading', { name: 'What the evidence shows' }).waitFor()
}

/** Visible elements that stick out past the right edge without being clipped by an ancestor. */
async function horizontalOverflow() {
  return page.evaluate(() => {
    const limit = window.innerWidth + 1
    const offenders = []
    for (const element of document.querySelectorAll('body *')) {
      const rect = element.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0 || rect.right <= limit) continue
      if (element.closest('[aria-hidden="true"], .sr-only')) continue
      let clipped = false
      for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
        const style = getComputedStyle(parent)
        if (['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowX) && parent.getBoundingClientRect().right <= limit) {
          clipped = true
          break
        }
      }
      if (!clipped) offenders.push(`${element.tagName.toLowerCase()}.${String(element.className).slice(0, 60)} → ${Math.round(rect.right)}px`)
    }
    return offenders.slice(0, 5)
  })
}

beforeAll(async () => {
  stack = await startStack()
  browser = await chromium.launch({
    headless: true,
    ...(process.env.E2E_BROWSER_PATH ? { executablePath: process.env.E2E_BROWSER_PATH } : { channel: process.env.E2E_BROWSER_CHANNEL ?? 'msedge' }),
  })
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true })
  page = await context.newPage()
  page.on('pageerror', (error) => pageErrors.push(error.message))
}, 120_000)

afterAll(async () => {
  await browser?.close()
  await stack?.stop()
})

describe('guest mode', () => {
  it('loads the homepage and main navigation', async () => {
    await go('/')
    await page.getByRole('heading', { level: 1 }).waitFor()
    for (const label of ['Learn', 'Investigation Lab', 'Quiz', 'Verification Toolkit', 'About']) {
      expect(await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: label, exact: true }).count()).toBe(1)
    }
    expect(await page.getByRole('link', { name: 'Sign in' }).count()).toBeGreaterThan(0)
    await shot('01-home')
  })

  it('completes a lesson knowledge check in the browser', async () => {
    await go(`/learn/${REQUIRED_LESSON_IDS[0]}`)
    await answerKnowledgeCheck()
    await page.getByText('Lesson marked as complete in this browser.').waitFor()
  })

  it('takes a quiz with server-checked feedback', async () => {
    await takeQuiz('deepfakes')
    await page.getByText('Saved in this browser only.').waitFor()
    await shot('02-quiz-results-guest')
  })

  it('submits an investigation and shows the expected verdict and explanation', async () => {
    await submitCase('flood-photo', 'Misleading or missing important context')
    await page.getByText('Your assessment matches the evidence.').waitFor()
    await page.getByText(/The photo is real, but it shows a different flood/).waitFor()
    await shot('03-case-result-guest')
  })

  it('shows a locked certificate and asks guests to sign in', async () => {
    await go('/certificate')
    await page.getByText('Your progress in this browser').waitFor()
    expect(await page.getByRole('link', { name: 'Create an account' }).count()).toBe(1)
    await shot('04-certificate-guest')
  })
})

describe('signed-in mode', () => {
  it('registers, signs in, and saves guest progress to the account', async () => {
    await go('/register')
    await page.getByLabel('Name (optional)').fill('Maria Clara Santos')
    await page.getByLabel('Email').fill('maria@example.test')
    await page.getByLabel('Password', { exact: true }).fill('verify1234')
    await page.getByLabel('Confirm password').fill('verify1234')
    await page.getByRole('button', { name: 'Create account' }).click()
    await page.waitForURL('**/account')
    await page.getByText('This browser has guest progress').waitFor()
    await shot('05-account-with-sync-banner')
    await page.getByRole('button', { name: 'Save to my account' }).first().click()
    await page.getByText('Guest progress saved to your account.').first().waitFor()

    const { rows } = await stack.db.query(
      `select (select count(*)::int from public.lesson_progress) as lessons,
              (select count(*)::int from public.quiz_attempts) as quizzes,
              (select count(*)::int from public.investigation_attempts) as cases`,
    )
    expect(rows[0]).toEqual({ lessons: 1, quizzes: 1, cases: 1 })
  })

  it('saves lessons and investigations to the account', async () => {
    for (const lessonId of REQUIRED_LESSON_IDS.slice(1)) {
      await go(`/learn/${lessonId}`)
      await answerKnowledgeCheck()
      // Account mode says "Lesson marked as complete." only once the server confirmed the save.
      await page.getByText(/^(Excellent! )?Lesson marked as complete\./).waitFor()
    }
    for (const caseId of REQUIRED_CASE_IDS.slice(1)) {
      await submitCase(caseId)
      await page.getByText('Saved to your account.', { exact: true }).waitFor()
    }
  })

  it('saves checklist items to the account', async () => {
    await go('/toolkit')
    await page.locator('label[for="check-original-source"]').click()
    await page.getByText('Saved to your account.', { exact: true }).waitFor()
  })

  it('claims the certificate, downloads the PDF, and verifies it publicly', async () => {
    await go('/certificate')
    await page.getByText('Eligible for Certificate').waitFor()
    expect(await page.getByLabel('Name on the certificate').inputValue()).toBe('Maria Clara Santos')
    await shot('06-certificate-eligible')
    await page.getByRole('button', { name: 'Claim Certificate' }).click()
    await page.getByRole('heading', { name: 'Your certificate' }).waitFor()
    const number = (await page.locator('dd.font-mono').first().textContent()).trim()
    expect(number).toMatch(/^VIT-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/)
    await shot('07-certificate-issued')

    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download PDF' }).click()])
    expect(download.suggestedFilename()).toBe(`VerifyIT-Certificate-${number}.pdf`)
    const file = await download.path()
    expect(fs.readFileSync(file).subarray(0, 5).toString()).toBe('%PDF-')

    await page.getByRole('link', { name: 'Verify Certificate' }).click()
    await page.getByText('Valid certificate').waitFor()
    await page.getByText('Maria Clara Santos').waitFor()
    await shot('08-verify-valid')
  })

  it('shows saved statistics on the progress dashboard', async () => {
    await go('/results')
    await page.getByRole('heading', { name: 'Recent quiz attempts' }).waitFor()
    await page.getByRole('heading', { name: 'Investigation history' }).waitFor()
    await page.getByText('Certificate issued').waitFor()
    await shot('09-results-account')
  })

  it('signs out back to guest mode', async () => {
    await go('/account')
    await page.getByRole('button', { name: 'Sign out' }).click()
    await page.waitForURL('**/login**')
    await go('/certificate')
    await page.getByText('Your progress in this browser').waitFor()
  })

  it('signs back in and still has the certificate', async () => {
    await go('/login?next=/certificate')
    await page.getByLabel('Email').fill('maria@example.test')
    await page.getByLabel('Password').fill('wrong-password-1')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.getByText('The email or password is incorrect.').waitFor()
    await page.getByLabel('Password').fill('verify1234')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL('**/certificate')
    await page.getByRole('heading', { name: 'Your certificate' }).waitFor()
    await page.getByRole('button', { name: 'Download PDF' }).waitFor()
    await go('/account')
    await page.getByRole('button', { name: 'Sign out' }).click()
    await page.waitForURL('**/login**')
  })

  it('reports unknown certificate numbers as invalid', async () => {
    await go('/verify-certificate/VIT-0000-0000-0000-0000')
    await page.getByText('No certificate found').waitFor()
  })
})

describe('responsive layout and runtime errors', () => {
  it('has no horizontal overflow at phone width', async () => {
    await page.setViewportSize({ width: 375, height: 812 })
    for (const route of ['/', '/login', '/register', '/certificate', '/verify-certificate', '/results', '/quiz', '/lab/flood-photo']) {
      await go(route)
      await page.locator('main').waitFor()
      expect(await horizontalOverflow(), route).toEqual([])
    }
    await shot('10-certificate-mobile')
  })

  it('had no uncaught errors in the browser', () => {
    expect(pageErrors).toEqual([])
  })
})
