import CDP from 'chrome-remote-interface'
import puppeteer, { type Browser, type Page } from 'puppeteer-core'
import type {
  BrowserActionResponse,
  BrowserClickRequest,
  BrowserNavigateRequest,
  BrowserOpenRequest,
  BrowserTypeRequest,
  PageState,
  TargetSummary,
} from './types.js'
import { BridgeHttpError } from './types.js'

const DEFAULT_HOST = process.env.CDP_HOST || '127.0.0.1'
const DEFAULT_PORT = Number(process.env.CDP_PORT || 9223)

function getBrowserUrl() {
  return `http://${DEFAULT_HOST}:${DEFAULT_PORT}`
}

function ensureUrl(value: string | undefined) {
  if (!value || typeof value !== 'string') {
    throw new BridgeHttpError(400, 'A valid url is required.')
  }

  try {
    return new URL(value).toString()
  } catch {
    throw new BridgeHttpError(400, `Invalid URL: ${value}`)
  }
}

async function getTargetId(page: Page) {
  const session = await page.target().createCDPSession()
  const { targetInfo } = await session.send('Target.getTargetInfo')
  await session.detach()
  return targetInfo.targetId
}

async function extractVisibleText(page: Page) {
  return page.evaluate(() => {
    const text = document.body?.innerText || ''
    return text.replace(/\s+/g, ' ').trim().slice(0, 5000)
  })
}

class CDPBridgeClient {
  private browserPromise: Promise<Browser> | null = null

  async getVersion() {
    try {
      return await CDP.Version({ host: DEFAULT_HOST, port: DEFAULT_PORT })
    } catch (error) {
      throw new BridgeHttpError(502, `CDP endpoint unreachable at ${getBrowserUrl()}`, error instanceof Error ? error.message : undefined)
    }
  }

  async listTargets(): Promise<TargetSummary[]> {
    let targets
    try {
      targets = await CDP.List({ host: DEFAULT_HOST, port: DEFAULT_PORT })
    } catch (error) {
      throw new BridgeHttpError(502, `CDP endpoint unreachable at ${getBrowserUrl()}`, error instanceof Error ? error.message : undefined)
    }

    return targets.map((target) => ({
      id: target.id,
      type: target.type,
      title: target.title,
      url: target.url,
    }))
  }

  async open(request: BrowserOpenRequest): Promise<BrowserActionResponse> {
    const url = ensureUrl(request.url)
    let client

    try {
      client = await CDP({ host: DEFAULT_HOST, port: DEFAULT_PORT })
    } catch (error) {
      throw new BridgeHttpError(502, `CDP endpoint unreachable at ${getBrowserUrl()}`, error instanceof Error ? error.message : undefined)
    }

    try {
      const { targetId } = await client.Target.createTarget({
        url,
        newWindow: true,
      })
      const page = await this.waitForPage(targetId)
      await page.bringToFront()
      await page.waitForFunction(
        () => window.location.href !== 'about:blank' && window.location.href !== ':',
        { timeout: 10000 },
      ).catch(() => undefined)
      return this.getPageSnapshot(page)
    } finally {
      await client.close()
    }
  }

  async navigate(request: BrowserNavigateRequest): Promise<BrowserActionResponse> {
    const page = await this.resolvePage(request.targetId)
    const url = ensureUrl(request.url)
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await page.bringToFront()

    return this.getPageSnapshot(page)
  }

  async screenshot(targetId?: string) {
    const page = await this.resolvePage(targetId)
    await page.bringToFront()
    return page.screenshot({ type: 'png' })
  }

  async getPageState(targetId?: string): Promise<PageState> {
    const page = await this.resolvePage(targetId)
    return this.getDetailedPageState(page)
  }

  async click(request: BrowserClickRequest): Promise<BrowserActionResponse> {
    const page = await this.resolvePage(request.targetId)
    await page.bringToFront()

    if (request.selector) {
      await page.waitForSelector(request.selector, { timeout: 5000 })
      await page.click(request.selector)
    } else if (typeof request.x === 'number' && typeof request.y === 'number') {
      await page.mouse.click(request.x, request.y)
    } else {
      throw new Error('Click request requires either selector or x/y coordinates.')
    }

    return this.getPageSnapshot(page)
  }

  async type(request: BrowserTypeRequest): Promise<BrowserActionResponse> {
    const page = await this.resolvePage(request.targetId)
    await page.bringToFront()
    await page.waitForSelector(request.selector, { timeout: 5000 })
    await page.click(request.selector, { clickCount: 1 })

    if (request.clear) {
      await page.focus(request.selector)
      await page.keyboard.down('Control')
      await page.keyboard.press('KeyA')
      await page.keyboard.up('Control')
      await page.keyboard.press('Backspace')
    }

    await page.type(request.selector, request.text, { delay: 20 })
    return this.getPageSnapshot(page)
  }

  async close() {
    if (!this.browserPromise) return
    const browser = await this.browserPromise
    this.browserPromise = null
    await browser.disconnect()
  }

  private async getBrowser() {
    if (!this.browserPromise) {
      this.browserPromise = puppeteer.connect({
        browserURL: getBrowserUrl(),
        defaultViewport: null,
      })
    }

    const browser = await this.browserPromise

    if (!browser.connected) {
      this.browserPromise = puppeteer.connect({
        browserURL: getBrowserUrl(),
        defaultViewport: null,
      })
      return this.browserPromise
    }

    return browser
  }

  private async resolvePage(targetId?: string) {
    const browser = await this.getBrowser()
    const pages = await browser.pages()
    const pageCandidates = pages.filter((page) => page.target().type() === 'page')

    if (pageCandidates.length === 0) {
      throw new Error('No Chrome page targets are currently available.')
    }

    if (!targetId) {
      return pageCandidates[pageCandidates.length - 1]
    }

    for (const page of pageCandidates) {
      if ((await getTargetId(page)) === targetId) {
        return page
      }
    }

    throw new Error(`Unable to find target ${targetId}.`)
  }

  private async getPageSnapshot(page: Page): Promise<BrowserActionResponse> {
    const targetId = await getTargetId(page)

    return {
      ok: true,
      targetId,
      url: page.url(),
      title: await page.title(),
    }
  }

  private async getDetailedPageState(page: Page): Promise<PageState> {
    const snapshot = await this.getPageSnapshot(page)

    return {
      targetId: snapshot.targetId,
      url: snapshot.url,
      title: snapshot.title,
      visibleText: await extractVisibleText(page),
    }
  }

  private async waitForPage(targetId: string, timeoutMs = 10000) {
    const startedAt = Date.now()

    while (Date.now() - startedAt < timeoutMs) {
      try {
        return await this.resolvePage(targetId)
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 150))
      }
    }

    throw new Error(`Timed out waiting for target ${targetId} to become available.`)
  }
}

export const cdpBridgeClient = new CDPBridgeClient()
