import type { NextApiRequest, NextApiResponse } from 'next'
import puppeteer from 'puppeteer-core'
import chrome from '@sparticuz/chromium'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { channel } = req.query

  if (!channel || typeof channel !== 'string') {
    return res.status(400).json({ error: 'Channel parameter is required' })
  }

  let browser = null
  try {
    browser = await puppeteer.launch({
      args: [...chrome.args, '--no-sandbox'],
      executablePath: await chrome.executablePath(),
      headless: chrome.headless,
    })

    const page = await browser.newPage()
    page.setDefaultNavigationTimeout(30000) // 20 ثانية

    await page.setRequestInterception(true)
    page.on('request', (request) => {
      if (['image', 'stylesheet', 'font'].includes(request.resourceType())) {
        request.abort()
      } else {
        request.continue()
      }
    })

    let streamingLink: string | null = null
    const streamingLinkPromise = new Promise<string | null>((resolve) => {
      page.on('response', async (response) => {
        const url = response.url()
        if (url.includes('.m3u8') && !url.includes('stat.kwikmotion.com')) {
          resolve(url)
        }
      })
    })

    await page.goto(`https://rotana.net/ar/channels/#/live/${channel}`, {
      waitUntil: 'domcontentloaded', // تحسين سرعة التحميل
      timeout: 30000 // 20 ثانية
    })

    streamingLink = await streamingLinkPromise

    if (streamingLink) {
      console.log('Streaming Link:', streamingLink)
      return res.status(200).json({ streamingLink })
    } else {
      console.log('No streaming link found for channel:', channel)
      return res.status(404).json({ error: 'No streaming link found' })
    }
  } catch (error) {
    console.error('Error in API route:', error)
    return res.status(500).json({ error: 'An error occurred while fetching channel data' })
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}
