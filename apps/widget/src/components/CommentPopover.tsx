import { useState, useEffect, useRef } from 'preact/hooks'

interface Position {
  x: number
  y: number
}

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

interface CommentPopoverProps {
  position: Position
  screenshot?: string
  selector: string
  onCancel: () => void
  onSubmit: (text: string) => void
  submitStatus?: SubmitStatus
  submitError?: string | null
}

const POPOVER_WIDTH = 320
const POPOVER_HEIGHT = 280 // Approximate height
const MARGIN = 16

export function CommentPopover({
  position,
  screenshot,
  selector,
  onCancel,
  onSubmit,
  submitStatus = 'idle',
  submitError = null,
}: CommentPopoverProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [adjustedPosition, setAdjustedPosition] = useState(position)

  const isSubmitting = submitStatus === 'submitting'
  const isSuccess = submitStatus === 'success'
  const isError = submitStatus === 'error'

  // Calculate position to avoid going off-screen
  useEffect(() => {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let x = position.x + MARGIN
    let y = position.y

    // If would overflow right, show to the left of the cursor
    if (x + POPOVER_WIDTH > viewportWidth - MARGIN) {
      x = position.x - POPOVER_WIDTH - MARGIN
    }

    // If would overflow bottom, move up
    if (y + POPOVER_HEIGHT > viewportHeight - MARGIN) {
      y = viewportHeight - POPOVER_HEIGHT - MARGIN
    }

    // If would overflow top, move down
    if (y < MARGIN) {
      y = MARGIN
    }

    // If would overflow left, clamp to margin
    if (x < MARGIN) {
      x = MARGIN
    }

    setAdjustedPosition({ x, y })
  }, [position])

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleSubmit = () => {
    if (text.trim() && !isSubmitting && !isSuccess) {
      onSubmit(text.trim())
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    // Submit on Cmd/Ctrl + Enter
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
    // Cancel on Escape
    if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  // Get button content based on status
  const getButtonContent = () => {
    if (isSuccess) {
      return (
        <span class="flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Saved!
        </span>
      )
    }
    if (isSubmitting) {
      return (
        <span class="flex items-center gap-2">
          <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Saving...
        </span>
      )
    }
    return 'Submit'
  }

  // Get button styles based on status
  const getButtonStyles = () => {
    if (isSuccess) {
      return 'bg-green-500 text-white'
    }
    if (isSubmitting) {
      return 'bg-pink-400 text-white cursor-wait'
    }
    if (text.trim()) {
      return 'bg-pink-500 hover:bg-pink-600 text-white'
    }
    return 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
        width: `${POPOVER_WIDTH}px`,
        zIndex: 2147483647,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div class="bg-white rounded-lg shadow-2xl border border-zinc-200 overflow-hidden">
        {/* Header */}
        <div class="px-4 py-3 border-b border-zinc-100 bg-zinc-50">
          <h3 class="text-sm font-semibold text-zinc-900">
            {isSuccess ? 'Comment saved!' : 'Leave a comment'}
          </h3>
        </div>

        {/* Screenshot preview */}
        {screenshot && (
          <div class="border-b border-zinc-100">
            <img
              src={screenshot}
              alt="Screenshot"
              class="w-full h-20 object-cover object-top"
            />
          </div>
        )}

        {/* Content */}
        <div class="p-4">
          {/* Selector badge */}
          <div class="mb-3">
            <span class="inline-block px-2 py-1 bg-zinc-100 rounded text-xs font-mono text-zinc-600 max-w-full truncate">
              {selector.length > 40 ? selector.slice(0, 40) + '...' : selector}
            </span>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting || isSuccess}
            class={`
              w-full border border-zinc-300 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent placeholder-zinc-400
              ${(isSubmitting || isSuccess) ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            rows={3}
            placeholder="What's on your mind?"
          />

          {/* Error message */}
          {isError && submitError && (
            <div class="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-xs text-red-600">{submitError}</p>
            </div>
          )}

          {/* Hint */}
          {!isError && !isSuccess && (
            <p class="text-xs text-zinc-400 mt-2">
              Press <kbd class="px-1 py-0.5 bg-zinc-100 rounded text-zinc-500">⌘</kbd> + <kbd class="px-1 py-0.5 bg-zinc-100 rounded text-zinc-500">Enter</kbd> to submit
            </p>
          )}
        </div>

        {/* Actions */}
        <div class="px-4 py-3 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-2">
          <button
            onClick={onCancel}
            type="button"
            disabled={isSubmitting}
            class={`
              px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer
              ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isSuccess ? 'Close' : 'Cancel'}
          </button>
          {!isSuccess && (
            <button
              onClick={handleSubmit}
              type="button"
              disabled={!text.trim() || isSubmitting}
              class={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${getButtonStyles()}`}
            >
              {getButtonContent()}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
