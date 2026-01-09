import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import { Highlighter } from './components/Highlighter'
import { CommentPopover } from './components/CommentPopover'
import { Pin } from './components/Pin'
import { getUniqueSelector, getElementRect, isWidgetElement, isWidgetEvent } from './utils/selector'
import { captureViewportWithPin } from './utils/screenshot'
import { getBrowserMetadata } from './utils/metadata'
import { submitComment, fetchComments } from './utils/api'
import { useWidgetConfig } from './context/WidgetContext'

interface PendingComment {
  selector: string
  element: Element
  rect: DOMRect
  screenshot: string
  position: { x: number; y: number }
  pinXPercent: number
  pinYPercent: number
}

interface SavedComment {
  id: string
  selector: string
  text?: string
  screenshot?: string
  meta?: {
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
  pinPosition: { x: number; y: number }
  // Store offset from element's top-left for accurate repositioning on scroll
  pinOffset: { x: number; y: number }
  createdAt: string
  // Whether this comment was loaded from the server (vs created in current session)
  isFromServer?: boolean
}

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

export function App() {
  const { projectId } = useWidgetConfig()
  const [isCommentMode, setIsCommentMode] = useState(false)
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null)
  const [pendingComment, setPendingComment] = useState<PendingComment | null>(null)
  const [savedComments, setSavedComments] = useState<SavedComment[]>([])
  const [isCapturing, setIsCapturing] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Refs for cleanup
  const successTimeoutRef = useRef<number | null>(null)
  const isSubmittingRef = useRef(false)
  const isMountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current)
      }
    }
  }, [])

  // Load existing comments from the server on mount
  useEffect(() => {
    if (!projectId) return

    async function loadExistingComments() {
      const result = await fetchComments(projectId!)
      if (!result.success || !result.comments || !isMountedRef.current) return

      // Convert server comments to SavedComment format
      const existingComments: SavedComment[] = result.comments.map((comment) => {
        // Calculate pin position using document-relative coordinates
        let pinX = window.innerWidth / 2 // Default to center
        let pinY = window.innerHeight / 2

        // Prefer document coordinates (absolute position in page)
        if (comment.meta?.pinDocumentX !== undefined && comment.meta?.pinDocumentY !== undefined) {
          // Convert document coordinates to current viewport position
          pinX = comment.meta.pinDocumentX - window.scrollX
          pinY = comment.meta.pinDocumentY - window.scrollY
        } else if (comment.meta?.pinXPercent !== undefined && comment.meta?.pinYPercent !== undefined) {
          // Fall back to reconstructing from percentage + original scroll
          const originalScrollX = comment.meta.scrollX ?? 0
          const originalScrollY = comment.meta.scrollY ?? 0
          const originalVW = comment.meta.viewportWidth ?? window.innerWidth
          const originalVH = comment.meta.viewportHeight ?? window.innerHeight

          // Calculate original viewport position
          const originalViewportX = (comment.meta.pinXPercent / 100) * originalVW
          const originalViewportY = (comment.meta.pinYPercent / 100) * originalVH

          // Calculate document position (where it was in the full page)
          const documentX = originalViewportX + originalScrollX
          const documentY = originalViewportY + originalScrollY

          // Convert to current viewport position
          pinX = documentX - window.scrollX
          pinY = documentY - window.scrollY
        } else if (comment.meta?.pinX !== undefined && comment.meta?.pinY !== undefined) {
          // Last resort: use raw pixel values (legacy data)
          pinX = comment.meta.pinX
          pinY = comment.meta.pinY
        }

        return {
          id: comment.id,
          selector: comment.selector || '',
          createdAt: comment.created_at,
          pinPosition: { x: pinX, y: pinY },
          pinOffset: { x: 0, y: 0 }, // We don't have the original offset
          isFromServer: true,
          meta: comment.meta,
        }
      })

      if (isMountedRef.current && existingComments.length > 0) {
        setSavedComments(existingComments)
        console.log(`[PixelPoint] Loaded ${existingComments.length} existing comments`)
      }
    }

    loadExistingComments()
  }, [projectId])

  // Update pin positions on scroll/resize
  useEffect(() => {
    if (savedComments.length === 0) return

    const updatePinPositions = () => {
      if (!isMountedRef.current) return

      setSavedComments(prev =>
        prev.map(comment => {
          // For server-loaded comments, use document-relative coordinates
          if (comment.isFromServer) {
            // Prefer document coordinates (absolute position in page)
            if (comment.meta?.pinDocumentX !== undefined && comment.meta?.pinDocumentY !== undefined) {
              // Convert document coordinates to viewport by subtracting scroll
              return {
                ...comment,
                pinPosition: {
                  x: comment.meta.pinDocumentX - window.scrollX,
                  y: comment.meta.pinDocumentY - window.scrollY,
                },
              }
            }
            // Fall back to percentage + scroll offset if we have the original scroll position
            if (comment.meta?.pinXPercent !== undefined && comment.meta?.pinYPercent !== undefined) {
              const originalScrollX = comment.meta.scrollX ?? 0
              const originalScrollY = comment.meta.scrollY ?? 0
              const originalVW = comment.meta.viewportWidth ?? window.innerWidth
              const originalVH = comment.meta.viewportHeight ?? window.innerHeight

              // Calculate original viewport position
              const originalViewportX = (comment.meta.pinXPercent / 100) * originalVW
              const originalViewportY = (comment.meta.pinYPercent / 100) * originalVH

              // Calculate document position (where it was in the full page)
              const documentX = originalViewportX + originalScrollX
              const documentY = originalViewportY + originalScrollY

              // Convert back to current viewport position
              return {
                ...comment,
                pinPosition: {
                  x: documentX - window.scrollX,
                  y: documentY - window.scrollY,
                },
              }
            }
          }

          // For locally created comments, use selector-based positioning
          try {
            const element = document.querySelector(comment.selector)
            if (element) {
              const rect = element.getBoundingClientRect()
              // Use stored offset to maintain accurate click position
              return {
                ...comment,
                pinPosition: {
                  x: rect.left + comment.pinOffset.x,
                  y: rect.top + comment.pinOffset.y,
                },
              }
            }
          } catch (e) {
            // Invalid selector - element may have been removed
            console.warn('[PixelPoint] Could not find element for selector:', comment.selector)
          }
          return comment
        })
      )
    }

    // Use passive listener for better scroll performance
    window.addEventListener('scroll', updatePinPositions, { passive: true, capture: true })
    window.addEventListener('resize', updatePinPositions, { passive: true })

    return () => {
      window.removeEventListener('scroll', updatePinPositions, true)
      window.removeEventListener('resize', updatePinPositions)
    }
  }, [savedComments.length])

  // Handle mouse move for highlighting
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isCommentMode || pendingComment || isCapturing) return

      const target = e.target as Element

      if (isWidgetElement(target)) {
        setHoveredRect(null)
        return
      }

      const rect = getElementRect(target)
      setHoveredRect(rect)
    },
    [isCommentMode, pendingComment, isCapturing]
  )

  // Handle click for selection
  const handleClick = useCallback(
    async (e: MouseEvent) => {
      if (!isCommentMode || pendingComment || isCapturing) return

      if (isWidgetEvent(e)) {
        return
      }

      const target = e.target as Element

      e.preventDefault()
      e.stopPropagation()

      const rect = getElementRect(target)
      if (!rect) return

      const selector = getUniqueSelector(target)

      // Hide highlighter and capture screenshot
      setHoveredRect(null)
      setIsCapturing(true)

      try {
        await new Promise(resolve => setTimeout(resolve, 50))

        // Get click position BEFORE capture
        const clickX = e.clientX
        const clickY = e.clientY

        // Capture screenshot with pin marker drawn at click position
        // Use the returned percentages which match the screenshot dimensions
        const { dataUri: screenshot, pinXPercent, pinYPercent } = await captureViewportWithPin(clickX, clickY)

        if (!isMountedRef.current) return

        setPendingComment({
          selector,
          element: target,
          rect,
          screenshot,
          position: { x: clickX, y: clickY },
          pinXPercent,
          pinYPercent,
        })

        // Reset submit status for new comment
        setSubmitStatus('idle')
        setSubmitError(null)

        console.log('[PixelPoint] Element selected, ready for comment:', { selector })
      } catch (error) {
        console.error('[PixelPoint] Screenshot capture failed:', error)
        // Restore comment mode state on error
        if (isMountedRef.current) {
          setIsCapturing(false)
        }
      } finally {
        if (isMountedRef.current) {
          setIsCapturing(false)
        }
      }
    },
    [isCommentMode, pendingComment, isCapturing]
  )

  // Handle mouse leave to clear highlight
  const handleMouseLeave = useCallback(() => {
    if (isCommentMode && !pendingComment && !isCapturing) {
      setHoveredRect(null)
    }
  }, [isCommentMode, pendingComment, isCapturing])

  // Set up event listeners with proper cleanup
  useEffect(() => {
    if (isCommentMode && !pendingComment) {
      document.addEventListener('mousemove', handleMouseMove, true)
      document.addEventListener('click', handleClick, true)
      document.addEventListener('mouseleave', handleMouseLeave)

      if (!isCapturing) {
        document.body.style.cursor = 'crosshair'
      }
    } else {
      document.body.style.cursor = ''
    }

    // Always return cleanup function
    return () => {
      document.removeEventListener('mousemove', handleMouseMove, true)
      document.removeEventListener('click', handleClick, true)
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.body.style.cursor = ''
    }
  }, [isCommentMode, pendingComment, isCapturing, handleMouseMove, handleClick, handleMouseLeave])

  // Toggle comment mode
  const toggleCommentMode = (e: MouseEvent) => {
    e.stopPropagation()
    if (isCommentMode) {
      // Exiting comment mode
      setIsCommentMode(false)
      setHoveredRect(null)
      setPendingComment(null)
      setSubmitStatus('idle')
      setSubmitError(null)
    } else {
      // Entering comment mode
      setIsCommentMode(true)
    }
  }

  // Cancel pending comment
  const handleCancelComment = () => {
    setPendingComment(null)
    setSubmitStatus('idle')
    setSubmitError(null)
  }

  // Submit comment with race condition protection
  const handleSubmitComment = async (text: string) => {
    // Prevent double submission
    if (isSubmittingRef.current) {
      console.warn('[PixelPoint] Submission already in progress')
      return
    }

    if (!pendingComment || !projectId) {
      if (!projectId) {
        setSubmitError('Widget not configured properly - missing project ID')
        setSubmitStatus('error')
      }
      return
    }

    isSubmittingRef.current = true
    setSubmitStatus('submitting')
    setSubmitError(null)

    const baseMeta = getBrowserMetadata()

    // Store both viewport-relative AND document-relative coordinates
    // This ensures correct pin positioning regardless of screenshot capture method
    const viewportX = pendingComment.position.x
    const viewportY = pendingComment.position.y
    const scrollX = window.scrollX
    const scrollY = window.scrollY
    const contentWidth = document.documentElement.clientWidth
    const contentHeight = document.documentElement.clientHeight

    // Document-relative position (absolute position in page)
    const documentX = viewportX + scrollX
    const documentY = viewportY + scrollY

    // Use the percentages from screenshot capture (matches screenshot dimensions)
    const { pinXPercent, pinYPercent } = pendingComment

    const meta = {
      ...baseMeta,
      // Viewport-relative (click position)
      pinX: viewportX,
      pinY: viewportY,
      // Percentage of screenshot (from captureViewportWithPin)
      pinXPercent,
      pinYPercent,
      // Document-relative (absolute position in page)
      pinDocumentX: documentX,
      pinDocumentY: documentY,
      // Scroll position when screenshot was taken
      scrollX,
      scrollY,
      // Content dimensions (excludes scrollbar, matches screenshot)
      viewportWidth: contentWidth,
      viewportHeight: contentHeight,
    }

    try {
      const result = await submitComment({
        project_id: projectId,
        content: text,
        selector: pendingComment.selector,
        url_path: window.location.pathname,
        meta,
        screenshot_base64: pendingComment.screenshot,
      })

      if (!isMountedRef.current) return

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit comment')
      }

      // Validate response has ID
      if (!result.id) {
        console.warn('[PixelPoint] API returned success but no ID')
      }

      console.log('[PixelPoint] Comment saved successfully:', result.id)

      // Create local saved comment for pin display
      // Use click position for more accurate pin placement
      // Store offset from element's top-left corner for scroll repositioning
      const newComment: SavedComment = {
        id: result.id || `local-${Date.now()}`,
        selector: pendingComment.selector,
        text,
        screenshot: pendingComment.screenshot,
        meta,
        pinPosition: {
          x: pendingComment.position.x,
          y: pendingComment.position.y,
        },
        pinOffset: {
          x: pendingComment.position.x - pendingComment.rect.left,
          y: pendingComment.position.y - pendingComment.rect.top,
        },
        createdAt: new Date().toISOString(),
      }

      // Show success state
      setSubmitStatus('success')

      // Add to saved comments
      setSavedComments(prev => [...prev, newComment])

      // Close popover after brief success display
      // Clear any existing timeout
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current)
      }

      successTimeoutRef.current = window.setTimeout(() => {
        if (isMountedRef.current) {
          setPendingComment(null)
          setSubmitStatus('idle')
        }
        successTimeoutRef.current = null
      }, 1000)
    } catch (error) {
      console.error('[PixelPoint] Failed to submit comment:', error)
      if (isMountedRef.current) {
        setSubmitError(error instanceof Error ? error.message : 'Failed to submit comment')
        setSubmitStatus('error')
      }
    } finally {
      isSubmittingRef.current = false
    }
  }

  // Handle pin click (for future expansion)
  const handlePinClick = (comment: SavedComment) => {
    console.log('[PixelPoint] Pin clicked:', comment.id, comment.text)
  }

  return (
    <div>
      {/* Highlighter overlay */}
      <Highlighter rect={hoveredRect} visible={isCommentMode && !pendingComment && !isCapturing} />

      {/* Pins for saved comments */}
      {savedComments.map((comment, index) => (
        <Pin
          key={comment.id}
          number={index + 1}
          x={comment.pinPosition.x}
          y={comment.pinPosition.y}
          onClick={() => handlePinClick(comment)}
        />
      ))}

      {/* Comment Popover */}
      {pendingComment && (
        <CommentPopover
          position={pendingComment.position}
          screenshot={pendingComment.screenshot}
          selector={pendingComment.selector}
          onCancel={handleCancelComment}
          onSubmit={handleSubmitComment}
          submitStatus={submitStatus}
          submitError={submitError}
        />
      )}

      {/* Widget UI */}
      <div class="fixed bottom-4 right-4 flex flex-col items-end gap-3" style={{ zIndex: 2147483647 }}>
        {/* Capturing indicator */}
        {isCapturing && (
          <div class="bg-pink-500 text-white text-sm px-4 py-2 rounded-full shadow-lg animate-pulse">
            Capturing...
          </div>
        )}

        {/* Comment count badge */}
        {savedComments.length > 0 && !isCommentMode && (
          <div class="bg-white text-zinc-700 text-sm px-3 py-1.5 rounded-full shadow-md border border-zinc-200">
            {savedComments.length} comment{savedComments.length !== 1 ? 's' : ''}
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={toggleCommentMode}
          type="button"
          class={`
            flex items-center gap-2 px-4 py-2 rounded-full shadow-lg font-medium text-sm transition-all cursor-pointer
            ${
              isCommentMode
                ? 'bg-pink-500 text-white hover:bg-pink-600'
                : 'bg-white text-zinc-700 hover:bg-zinc-50 border border-zinc-200'
            }
          `}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {isCommentMode ? 'Done' : 'Comment'}
        </button>
      </div>
    </div>
  )
}
