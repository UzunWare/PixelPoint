import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Maximum allowed size for screenshot base64 (500KB after encoding ≈ 375KB image)
const MAX_SCREENSHOT_SIZE = 500 * 1024

// Maximum content length
const MAX_CONTENT_LENGTH = 10000

// CORS headers type for type-safe access
interface CorsHeaders {
  'Access-Control-Allow-Origin': string
  'Access-Control-Allow-Methods': string
  'Access-Control-Allow-Headers': string
  [key: string]: string // Index signature for HeadersInit compatibility
}

// Build CORS headers dynamically based on allowed origin
function getCorsHeaders(origin: string | null, allowedOrigin: string | null, methods = 'GET, POST, OPTIONS'): CorsHeaders {
  // In development, allow localhost origins
  const isDev = process.env.NODE_ENV === 'development'
  const isLocalhost = origin?.includes('localhost') || origin?.includes('127.0.0.1')

  let allowOrigin = ''

  if (isDev && isLocalhost) {
    // Allow localhost in development
    allowOrigin = origin || '*'
  } else if (allowedOrigin && origin) {
    // Validate origin matches project URL
    try {
      const originHost = new URL(origin).host
      const allowedHost = new URL(allowedOrigin).host
      if (originHost === allowedHost) {
        allowOrigin = origin
      }
    } catch {
      // Invalid URL - don't allow
    }
  }

  return {
    'Access-Control-Allow-Origin': allowOrigin || '',
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type, x-project-id',
  }
}

// Basic content sanitization - remove potential XSS vectors
function sanitizeContent(content: string): string {
  return content
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  // For OPTIONS, we need to be permissive but will validate on actual request
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-project-id',
    }
  })
}

// Handle fetching comments for a project (used by widget to show existing pins)
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('project_id')

  if (!projectId) {
    return NextResponse.json(
      { success: false, error: 'project_id is required' },
      { status: 400, headers: getCorsHeaders(origin, null) }
    )
  }

  const supabase = createAdminClient()

  // Validate project exists and get URL for CORS validation
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, url')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    return NextResponse.json(
      { success: false, error: 'Invalid project_id' },
      { status: 404, headers: getCorsHeaders(origin, null) }
    )
  }

  const corsHeaders = getCorsHeaders(origin, project.url)

  // Fetch comments for the project (only open ones, exclude screenshot data for performance)
  const { data: comments, error: fetchError } = await supabase
    .from('comments')
    .select('id, selector, url_path, meta, status, created_at')
    .eq('project_id', projectId)
    .eq('status', 'open')
    .order('created_at', { ascending: true })

  if (fetchError) {
    console.error('[Feedback API] Fetch error:', fetchError)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500, headers: corsHeaders }
    )
  }

  return NextResponse.json(
    { success: true, comments: comments || [] },
    { status: 200, headers: corsHeaders }
  )
}

// Handle feedback submission
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')

  try {
    const body = await request.json()
    const { project_id, content, selector, url_path, meta, screenshot_base64 } = body

    // Validate required fields
    if (!project_id) {
      return NextResponse.json(
        { success: false, error: 'project_id is required' },
        { status: 400, headers: getCorsHeaders(origin, null) }
      )
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'content is required and must be a non-empty string' },
        { status: 400, headers: getCorsHeaders(origin, null) }
      )
    }

    // Validate content length
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { success: false, error: `content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters` },
        { status: 400, headers: getCorsHeaders(origin, null) }
      )
    }

    if (!url_path) {
      return NextResponse.json(
        { success: false, error: 'url_path is required' },
        { status: 400, headers: getCorsHeaders(origin, null) }
      )
    }

    // Validate screenshot size
    if (screenshot_base64 && screenshot_base64.length > MAX_SCREENSHOT_SIZE) {
      return NextResponse.json(
        { success: false, error: `screenshot exceeds maximum size of ${MAX_SCREENSHOT_SIZE / 1024}KB` },
        { status: 400, headers: getCorsHeaders(origin, null) }
      )
    }

    const supabase = createAdminClient()

    // Validate project exists and get URL for CORS validation
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, url')
      .eq('id', project_id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: 'Invalid project_id' },
        { status: 404, headers: getCorsHeaders(origin, null) }
      )
    }

    // Get CORS headers based on project URL
    const corsHeaders = getCorsHeaders(origin, project.url)

    // In production, enforce origin validation
    const isDev = process.env.NODE_ENV === 'development'
    const isLocalhost = origin?.includes('localhost') || origin?.includes('127.0.0.1')

    if (!isDev && !isLocalhost) {
      // Validate origin matches project URL
      if (!corsHeaders['Access-Control-Allow-Origin']) {
        console.warn(`[Feedback API] Origin rejected: ${origin} not allowed for project ${project_id}`)
        return NextResponse.json(
          { success: false, error: 'Origin not allowed' },
          { status: 403, headers: corsHeaders }
        )
      }
    }

    // Validate referer in production (soft check - log only in dev)
    const referer = request.headers.get('referer')
    if (referer && project.url) {
      try {
        const refererHost = new URL(referer).host
        const projectHost = new URL(project.url).host
        const isRefererLocalhost = refererHost.includes('localhost') || refererHost.includes('127.0.0.1')

        if (refererHost !== projectHost && !isRefererLocalhost) {
          if (isDev) {
            console.warn(`[Feedback API] Referer mismatch: ${refererHost} vs ${projectHost}`)
          } else {
            // In production, reject mismatched referer
            return NextResponse.json(
              { success: false, error: 'Invalid referer' },
              { status: 403, headers: corsHeaders }
            )
          }
        }
      } catch {
        // Invalid URL in referer
        if (!isDev) {
          return NextResponse.json(
            { success: false, error: 'Invalid referer' },
            { status: 403, headers: corsHeaders }
          )
        }
      }
    }

    // Sanitize content before storage
    const sanitizedContent = sanitizeContent(content.trim())

    // Validate and sanitize metadata (only allow expected fields)
    const sanitizedMeta = meta ? {
      url: typeof meta.url === 'string' ? meta.url.slice(0, 2000) : undefined,
      path: typeof meta.path === 'string' ? meta.path.slice(0, 500) : undefined,
      browser: typeof meta.browser === 'string' ? meta.browser.slice(0, 50) : undefined,
      os: typeof meta.os === 'string' ? meta.os.slice(0, 50) : undefined,
      viewport: typeof meta.viewport === 'string' ? meta.viewport.slice(0, 20) : undefined,
      userAgent: typeof meta.userAgent === 'string' ? meta.userAgent.slice(0, 500) : undefined,
      timestamp: typeof meta.timestamp === 'string' ? meta.timestamp.slice(0, 30) : undefined,
      // Pin position for canvas rendering (viewport coordinates)
      pinX: typeof meta.pinX === 'number' ? Math.round(meta.pinX) : undefined,
      pinY: typeof meta.pinY === 'number' ? Math.round(meta.pinY) : undefined,
      // Percentage-based coordinates (more accurate for rendering)
      pinXPercent: typeof meta.pinXPercent === 'number' ? meta.pinXPercent : undefined,
      pinYPercent: typeof meta.pinYPercent === 'number' ? meta.pinYPercent : undefined,
      // Document-relative coordinates (absolute position in page)
      pinDocumentX: typeof meta.pinDocumentX === 'number' ? Math.round(meta.pinDocumentX) : undefined,
      pinDocumentY: typeof meta.pinDocumentY === 'number' ? Math.round(meta.pinDocumentY) : undefined,
      // Scroll position when screenshot was taken
      scrollX: typeof meta.scrollX === 'number' ? Math.round(meta.scrollX) : undefined,
      scrollY: typeof meta.scrollY === 'number' ? Math.round(meta.scrollY) : undefined,
      // Viewport dimensions
      viewportWidth: typeof meta.viewportWidth === 'number' ? Math.round(meta.viewportWidth) : undefined,
      viewportHeight: typeof meta.viewportHeight === 'number' ? Math.round(meta.viewportHeight) : undefined,
    } : {}

    // Insert comment into database
    const { data: comment, error: insertError } = await supabase
      .from('comments')
      .insert({
        project_id,
        content: sanitizedContent,
        selector: selector ? String(selector).slice(0, 500) : null,
        url_path: String(url_path).slice(0, 500),
        meta: sanitizedMeta,
        screenshot_url: screenshot_base64 || null,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('[Feedback API] Insert error:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to save comment' },
        { status: 500, headers: corsHeaders }
      )
    }

    return NextResponse.json(
      { success: true, id: comment.id },
      { status: 201, headers: corsHeaders }
    )
  } catch (error) {
    console.error('[Feedback API] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: getCorsHeaders(origin, null) }
    )
  }
}
