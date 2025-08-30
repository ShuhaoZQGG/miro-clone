import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import { rateLimitMiddleware } from '@/middleware/rate-limit'

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = rateLimitMiddleware(request, { windowMs: 60000, max: 10 })
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!
  }

  try {
    const body = await request.json()
    const { dataUrl, bounds, scale = 1, backgroundColor = '#ffffff' } = body

    if (!dataUrl) {
      return NextResponse.json(
        { error: 'Missing dataUrl' },
        { status: 400 }
      )
    }

    // Create HTML content with the canvas image
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              margin: 0;
              padding: 0;
              background-color: ${backgroundColor};
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            img {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" alt="Whiteboard Export" />
        </body>
      </html>
    `

    // Launch puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    
    // Set viewport size based on bounds
    if (bounds) {
      await page.setViewport({
        width: Math.ceil(bounds.width * scale),
        height: Math.ceil(bounds.height * scale)
      })
    } else {
      await page.setViewport({
        width: 1920,
        height: 1080
      })
    }

    // Set the HTML content
    await page.setContent(html, { waitUntil: 'networkidle0' })

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: bounds ? undefined : 'A4',
      width: bounds ? `${bounds.width * scale}px` : undefined,
      height: bounds ? `${bounds.height * scale}px` : undefined,
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    })

    await browser.close()

    // Return PDF as response
    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="whiteboard-export-${Date.now()}.pdf"`
      }
    })
  } catch (error) {
    console.error('PDF export error:', error)
    return NextResponse.json(
      { error: 'PDF export failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}