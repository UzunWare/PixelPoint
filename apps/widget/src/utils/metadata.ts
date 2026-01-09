export interface BrowserMetadata {
  url: string
  path: string
  browser: string
  os: string
  viewport: string
  userAgent: string
  timestamp: string
}

/**
 * Parses the user agent string to extract browser and OS info.
 */
function parseUserAgent(ua: string): { browser: string; os: string } {
  let browser = 'Unknown'
  let os = 'Unknown'

  // Detect browser
  if (ua.includes('Firefox/')) {
    browser = 'Firefox'
  } else if (ua.includes('Edg/')) {
    browser = 'Edge'
  } else if (ua.includes('Chrome/')) {
    browser = 'Chrome'
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    browser = 'Safari'
  } else if (ua.includes('Opera/') || ua.includes('OPR/')) {
    browser = 'Opera'
  }

  // Detect OS
  if (ua.includes('Windows')) {
    os = 'Windows'
  } else if (ua.includes('Mac OS X')) {
    os = 'macOS'
  } else if (ua.includes('Linux')) {
    os = 'Linux'
  } else if (ua.includes('Android')) {
    os = 'Android'
  } else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
    os = 'iOS'
  }

  return { browser, os }
}

/**
 * Collects browser metadata for the current page.
 */
export function getBrowserMetadata(): BrowserMetadata {
  const userAgent = navigator.userAgent
  const { browser, os } = parseUserAgent(userAgent)

  return {
    url: window.location.href,
    path: window.location.pathname,
    browser,
    os,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    userAgent,
    timestamp: new Date().toISOString(),
  }
}
