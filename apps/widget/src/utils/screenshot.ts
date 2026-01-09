import { domToCanvas } from 'modern-screenshot'

const WIDGET_HOST_ID = 'pixelpoint-widget-host'
const MAX_SCREENSHOT_SIZE = 400 * 1024
const INITIAL_QUALITY = 0.8
const MIN_QUALITY = 0.3
const QUALITY_STEP = 0.1

// Pin styling
const PIN_RADIUS = 16
const PIN_COLOR = '#ec4899'
const PIN_BORDER_COLOR = '#ffffff'
const PIN_BORDER_WIDTH = 3

interface CaptureResult {
  dataUri: string
  pinXPercent: number
  pinYPercent: number
}

/**
 * Draws a pin marker on the canvas at the specified position
 */
function drawPinOnCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
): void {
  // Draw outer circle (pink fill)
  ctx.beginPath()
  ctx.arc(x, y, PIN_RADIUS, 0, 2 * Math.PI)
  ctx.fillStyle = PIN_COLOR
  ctx.fill()

  // Draw white border
  ctx.strokeStyle = PIN_BORDER_COLOR
  ctx.lineWidth = PIN_BORDER_WIDTH
  ctx.stroke()

  // Draw center dot
  ctx.beginPath()
  ctx.arc(x, y, 4, 0, 2 * Math.PI)
  ctx.fillStyle = PIN_BORDER_COLOR
  ctx.fill()
}

/**
 * Captures the current viewport with a pin marker at click position.
 * Uses modern-screenshot library which has better coordinate handling than html2canvas.
 * Strategy: Scroll to top, capture, draw pin, restore scroll.
 */
export async function captureViewportWithPin(clickX: number, clickY: number): Promise<CaptureResult> {
  try {
    const scrollX = window.scrollX
    const scrollY = window.scrollY
    const contentWidth = document.documentElement.clientWidth
    const contentHeight = document.documentElement.clientHeight

    console.log('[PixelPoint] Click position:', clickX, clickY)
    console.log('[PixelPoint] Scroll position:', scrollX, scrollY)
    console.log('[PixelPoint] Viewport size:', contentWidth, 'x', contentHeight)

    // Scroll to top to avoid coordinate issues (common workaround)
    window.scrollTo(0, 0)

    // Small delay to ensure scroll completes
    await new Promise(r => setTimeout(r, 50))

    // Capture the full document
    const fullCanvas = await domToCanvas(document.documentElement, {
      filter: (el) => {
        if (el instanceof Element && el.id === WIDGET_HOST_ID) return false
        return true
      },
      scale: 1,
      width: contentWidth,
      height: document.documentElement.scrollHeight,
    })

    // Restore scroll position
    window.scrollTo(scrollX, scrollY)

    console.log('[PixelPoint] Full canvas:', fullCanvas.width, 'x', fullCanvas.height)

    // Create viewport-sized canvas
    const viewportCanvas = document.createElement('canvas')
    viewportCanvas.width = contentWidth
    viewportCanvas.height = contentHeight
    const ctx = viewportCanvas.getContext('2d')
    if (!ctx) throw new Error('No canvas context')

    // Crop from original scroll position
    console.log('[PixelPoint] Cropping from scroll position:', scrollX, scrollY)
    ctx.drawImage(
      fullCanvas,
      scrollX, scrollY, contentWidth, contentHeight,
      0, 0, contentWidth, contentHeight
    )

    // Draw pin at viewport click coordinates
    console.log('[PixelPoint] Drawing pin at:', clickX, clickY)
    drawPinOnCanvas(ctx, clickX, clickY)

    // Calculate pin percentage
    const pinXPercent = (clickX / contentWidth) * 100
    const pinYPercent = (clickY / contentHeight) * 100

    // Compress the image
    let quality = INITIAL_QUALITY
    let dataUri = viewportCanvas.toDataURL('image/jpeg', quality)

    while (dataUri.length > MAX_SCREENSHOT_SIZE && quality > MIN_QUALITY) {
      quality -= QUALITY_STEP
      dataUri = viewportCanvas.toDataURL('image/jpeg', quality)
    }

    if (dataUri.length > MAX_SCREENSHOT_SIZE) {
      const maxDim = 1200
      const ratio = viewportCanvas.width / viewportCanvas.height
      const newW = ratio > 1 ? maxDim : Math.round(maxDim * ratio)
      const newH = ratio > 1 ? Math.round(maxDim / ratio) : maxDim

      const smallCanvas = document.createElement('canvas')
      smallCanvas.width = newW
      smallCanvas.height = newH
      const smallCtx = smallCanvas.getContext('2d')
      if (smallCtx) {
        smallCtx.drawImage(viewportCanvas, 0, 0, newW, newH)
        dataUri = smallCanvas.toDataURL('image/jpeg', MIN_QUALITY)
      }
    }

    console.log('[PixelPoint] Done:', Math.round(dataUri.length / 1024) + 'KB')

    return { dataUri, pinXPercent, pinYPercent }
  } catch (error) {
    console.error('[PixelPoint] Failed:', error)
    throw error
  }
}

export async function captureViewport(): Promise<string> {
  const result = await captureViewportWithPin(window.innerWidth / 2, window.innerHeight / 2)
  return result.dataUri
}

export async function captureViewportAsBlob(): Promise<Blob> {
  const dataUri = await captureViewport()
  const response = await fetch(dataUri)
  return response.blob()
}
