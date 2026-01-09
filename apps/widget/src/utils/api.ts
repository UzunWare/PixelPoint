// API configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/feedback'

import type { BrowserMetadata } from './metadata'

export interface CommentPayload {
  project_id: string
  content: string
  selector: string | null
  url_path: string
  meta: BrowserMetadata & { pinX?: number; pinY?: number; pinXPercent?: number; pinYPercent?: number }
  screenshot_base64: string | null
}

export interface SubmitResult {
  success: boolean
  id?: string
  error?: string
}

export interface ExistingComment {
  id: string
  selector: string | null
  url_path: string
  meta: {
    pinX?: number
    pinY?: number
    pinXPercent?: number
    pinYPercent?: number
    pinDocumentX?: number
    pinDocumentY?: number
    scrollX?: number
    scrollY?: number
    viewportWidth?: number
    viewportHeight?: number
    viewport?: string
  }
  status: string
  created_at: string
}

export interface FetchCommentsResult {
  success: boolean
  comments?: ExistingComment[]
  error?: string
}

export async function fetchComments(projectId: string): Promise<FetchCommentsResult> {
  try {
    const response = await fetch(`${API_URL}?project_id=${encodeURIComponent(projectId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Request failed with status ${response.status}`,
      }
    }

    return {
      success: true,
      comments: data.comments || [],
    }
  } catch (error) {
    console.error('[PixelPoint] Failed to fetch comments:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function submitComment(payload: CommentPayload): Promise<SubmitResult> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Request failed with status ${response.status}`,
      }
    }

    return {
      success: true,
      id: data.id,
    }
  } catch (error) {
    console.error('[PixelPoint] API request failed:', error)

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Network error - please check your connection',
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
