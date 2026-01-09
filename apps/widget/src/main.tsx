import { render } from 'preact'
import { App } from './app.tsx'
import { WidgetContext, type WidgetConfig } from './context/WidgetContext'
import styles from './index.css?inline'

const WIDGET_HOST_ID = 'pixelpoint-widget-host'

function getProjectIdFromScript(): string | null {
  // Find the script tag that loaded this widget
  const scripts = document.querySelectorAll('script[data-project-id]')

  for (const script of scripts) {
    // Check if this is our script by looking at the src
    const src = script.getAttribute('src') || ''
    if (src.includes('pixelpoint') || src.includes('localhost:3001')) {
      const projectId = script.getAttribute('data-project-id')
      if (projectId) {
        return projectId
      }
    }
  }

  // Fallback: check any script with data-project-id
  const anyScript = document.querySelector('script[data-project-id]')
  if (anyScript) {
    return anyScript.getAttribute('data-project-id')
  }

  console.warn('[PixelPoint] No project ID found. Add data-project-id to your script tag.')
  return null
}

function init() {
  // Check for existence - prevent double loading
  if (document.getElementById(WIDGET_HOST_ID)) {
    console.warn('[PixelPoint] Widget already loaded, skipping initialization.')
    return
  }

  // Get project ID from script tag
  const projectId = getProjectIdFromScript()

  if (!projectId) {
    console.error('[PixelPoint] Widget not initialized: missing data-project-id attribute.')
    return
  }

  const config: WidgetConfig = {
    projectId,
  }

  // Create host element
  const host = document.createElement('div')
  host.id = WIDGET_HOST_ID

  // Position fixed with highest z-index
  host.style.position = 'fixed'
  host.style.top = '0'
  host.style.left = '0'
  host.style.width = '0'
  host.style.height = '0'
  host.style.zIndex = '2147483647'
  host.style.pointerEvents = 'none'

  // Attach Shadow DOM
  const shadowRoot = host.attachShadow({ mode: 'open' })

  // Inject Tailwind styles into Shadow DOM
  const styleElement = document.createElement('style')
  styleElement.textContent = styles
  shadowRoot.appendChild(styleElement)

  // Create a container for the Preact app
  const appContainer = document.createElement('div')
  appContainer.style.pointerEvents = 'auto'
  shadowRoot.appendChild(appContainer)

  // Append host to document body
  document.body.appendChild(host)

  // Mount Preact app into shadow root container with context
  render(
    <WidgetContext.Provider value={config}>
      <App />
    </WidgetContext.Provider>,
    appContainer
  )

  console.log('[PixelPoint] Widget initialized successfully with project:', projectId)
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
