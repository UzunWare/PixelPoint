'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Project, Comment, CommentMeta } from '@pixelpoint/shared-types'

type CommentWithMeta = Omit<Comment, 'meta'> & { meta: CommentMeta }

export default function ProjectDetailsPage() {
  const params = useParams()
  const projectId = params.id as string
  const supabase = createClient()

  const [project, setProject] = useState<Project | null>(null)
  const [comments, setComments] = useState<CommentWithMeta[]>([])
  const [selectedComment, setSelectedComment] = useState<CommentWithMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  const fetchComments = useCallback(async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setComments(data as CommentWithMeta[])
      // Select first comment by default if none selected
      if (data.length > 0 && !selectedComment) {
        setSelectedComment(data[0] as CommentWithMeta)
      }
    }
  }, [projectId, selectedComment])

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch project
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single()

        if (projectError) throw projectError
        setProject(projectData)

        // Fetch comments
        await fetchComments()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch project')
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      fetchData()
    }
  }, [projectId, fetchComments])

  const installScript = `<script src="http://localhost:3001/pixelpoint.js" data-project-id="${projectId}" defer></script>`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(installScript)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleResolve = async (commentId: string) => {
    setResolvingId(commentId)
    try {
      const { error } = await supabase
        .from('comments')
        .update({ status: 'resolved' })
        .eq('id', commentId)

      if (error) throw error

      // Update local state
      setComments(prev =>
        prev.map(c => (c.id === commentId ? { ...c, status: 'resolved' as const } : c))
      )
      if (selectedComment?.id === commentId) {
        setSelectedComment(prev => prev ? { ...prev, status: 'resolved' as const } : null)
      }
    } catch (err) {
      console.error('Failed to resolve comment:', err)
    } finally {
      setResolvingId(null)
    }
  }

  const handleReopen = async (commentId: string) => {
    setResolvingId(commentId)
    try {
      const { error } = await supabase
        .from('comments')
        .update({ status: 'open' })
        .eq('id', commentId)

      if (error) throw error

      // Update local state
      setComments(prev =>
        prev.map(c => (c.id === commentId ? { ...c, status: 'open' as const } : c))
      )
      if (selectedComment?.id === commentId) {
        setSelectedComment(prev => prev ? { ...prev, status: 'open' as const } : null)
      }
    } catch (err) {
      console.error('Failed to reopen comment:', err)
    } finally {
      setResolvingId(null)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-zinc-500">Loading project...</div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="p-8">
        <nav className="mb-6">
          <Link href="/dashboard" className="text-zinc-500 hover:text-zinc-700 text-sm">
            ← Back to Projects
          </Link>
        </nav>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error || 'Project not found'}
        </div>
      </div>
    )
  }

  const openComments = comments.filter(c => c.status === 'open')
  const resolvedComments = comments.filter(c => c.status === 'resolved')

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <Link href="/dashboard" className="text-zinc-500 hover:text-zinc-700 text-sm">
          ← Back to Projects
        </Link>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
            <GlobeIcon className="w-6 h-6 text-pink-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">{project.name}</h1>
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-500 hover:text-pink-600"
            >
              {project.url}
            </a>
          </div>
        </div>
      </div>

      {/* Installation Section (Collapsible) */}
      <details className="bg-white border border-zinc-200 rounded-xl mb-6">
        <summary className="px-6 py-4 cursor-pointer text-lg font-semibold text-zinc-900 hover:bg-zinc-50 rounded-xl">
          Installation Instructions
        </summary>
        <div className="px-6 pb-6">
          <p className="text-zinc-600 text-sm mb-4">
            Add this script tag to your website's HTML, just before the closing <code className="bg-zinc-100 px-1 rounded">&lt;/body&gt;</code> tag.
          </p>

          <div className="relative">
            <pre className="bg-zinc-900 text-zinc-100 rounded-lg p-4 overflow-x-auto text-sm">
              <code>{installScript}</code>
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-xs font-medium rounded-md transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 text-sm">
              <strong>Note:</strong> During development, the widget is served from <code className="bg-amber-100 px-1 rounded">localhost:3001</code>.
              For production, update the script URL to your deployed widget endpoint.
            </p>
          </div>
        </div>
      </details>

      {/* Feedback Canvas Section */}
      {comments.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-2">Feedback</h2>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageIcon className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-medium text-zinc-900 mb-2">No feedback yet</h3>
            <p className="text-zinc-600">
              Once you install the widget on your website, feedback from your users will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Canvas with Screenshot and Pins */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-zinc-900">Screenshot</h2>
                  {selectedComment && (
                    <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">
                      Comment #{comments.findIndex(c => c.id === selectedComment.id) + 1}
                    </span>
                  )}
                </div>
                {selectedComment && (
                  <span className="text-sm text-zinc-500">
                    {selectedComment.url_path}
                  </span>
                )}
              </div>
              <div className="bg-zinc-100 overflow-auto" style={{ maxHeight: '70vh' }}>
                {selectedComment?.screenshot_url ? (
                  <div style={{ display: 'inline-block', verticalAlign: 'top', lineHeight: 0 }}>
                    {/* Screenshot Image - pin is baked into the image */}
                    <img
                      src={selectedComment.screenshot_url}
                      alt="Screenshot"
                      style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-zinc-400">
                    No screenshot available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Comments Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-200">
                <h2 className="font-semibold text-zinc-900">
                  Comments ({comments.length})
                </h2>
              </div>
              <div className="divide-y divide-zinc-100 max-h-[70vh] overflow-y-auto">
                {/* Open Comments */}
                {openComments.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-zinc-50 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                      Open ({openComments.length})
                    </div>
                    {openComments.map((comment, index) => (
                      <CommentCard
                        key={comment.id}
                        comment={comment}
                        index={comments.indexOf(comment) + 1}
                        isSelected={selectedComment?.id === comment.id}
                        onSelect={() => setSelectedComment(comment)}
                        onResolve={() => handleResolve(comment.id)}
                        onReopen={() => handleReopen(comment.id)}
                        isResolving={resolvingId === comment.id}
                      />
                    ))}
                  </div>
                )}

                {/* Resolved Comments */}
                {resolvedComments.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-zinc-50 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                      Resolved ({resolvedComments.length})
                    </div>
                    {resolvedComments.map((comment, index) => (
                      <CommentCard
                        key={comment.id}
                        comment={comment}
                        index={comments.indexOf(comment) + 1}
                        isSelected={selectedComment?.id === comment.id}
                        onSelect={() => setSelectedComment(comment)}
                        onResolve={() => handleResolve(comment.id)}
                        onReopen={() => handleReopen(comment.id)}
                        isResolving={resolvingId === comment.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Info */}
      <div className="mt-6 text-sm text-zinc-500">
        <p>Project ID: <code className="bg-zinc-100 px-1 rounded">{project.id}</code></p>
        <p className="mt-1">Created: {new Date(project.created_at).toLocaleDateString()}</p>
      </div>
    </div>
  )
}

// Pins Overlay Component - Shows only the selected comment's pin on its screenshot
interface PinsOverlayProps {
  comments: CommentWithMeta[]
  selectedComment: CommentWithMeta | null
}

function PinsOverlay({ comments, selectedComment }: PinsOverlayProps) {
  // Only show the pin for the currently selected comment on its own screenshot
  if (!selectedComment) return null

  const comment = selectedComment
  const index = comments.findIndex(c => c.id === comment.id)

  // Get pin position - prefer percentage coordinates
  const hasPercentCoords = comment.meta?.pinXPercent !== undefined && comment.meta?.pinYPercent !== undefined
  const hasPixelCoords = comment.meta?.pinX !== undefined && comment.meta?.pinY !== undefined
  const hasPinPosition = hasPercentCoords || hasPixelCoords

  let xPercent: number
  let yPercent: number

  if (hasPercentCoords) {
    xPercent = comment.meta!.pinXPercent!
    yPercent = comment.meta!.pinYPercent!
  } else if (hasPixelCoords) {
    // Fall back to calculating from pixel coordinates
    const vw = comment.meta?.viewportWidth || 1920
    const vh = comment.meta?.viewportHeight || 1080
    xPercent = (comment.meta!.pinX! / vw) * 100
    yPercent = (comment.meta!.pinY! / vh) * 100
  } else {
    // No position data - center the pin
    xPercent = 50
    yPercent = 50
  }

  // Debug: log the coordinates
  console.log('[Dashboard] Pin position:', {
    commentId: comment.id,
    pinX: comment.meta?.pinX,
    pinY: comment.meta?.pinY,
    pinXPercent: comment.meta?.pinXPercent,
    pinYPercent: comment.meta?.pinYPercent,
    viewportWidth: comment.meta?.viewportWidth,
    viewportHeight: comment.meta?.viewportHeight,
    calculatedXPercent: xPercent,
    calculatedYPercent: yPercent,
  })

  const isResolved = comment.status === 'resolved'

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
      <div
        className={`
          absolute pointer-events-auto
          w-8 h-8 rounded-full flex items-center justify-center
          text-sm font-bold text-white shadow-lg
          ${isResolved ? 'bg-green-500' : 'bg-pink-500'}
          ${!hasPinPosition ? 'opacity-70 border-2 border-dashed border-white' : ''}
        `}
        style={{
          left: `${xPercent}%`,
          top: `${yPercent}%`,
          transform: 'translate(-50%, -50%)',
        }}
        title={comment.content}
      >
        {index + 1}
      </div>
    </div>
  )
}

// Comment Card Component
interface CommentCardProps {
  comment: CommentWithMeta
  index: number
  isSelected: boolean
  onSelect: () => void
  onResolve: () => void
  onReopen: () => void
  isResolving: boolean
}

function CommentCard({
  comment,
  index,
  isSelected,
  onSelect,
  onResolve,
  onReopen,
  isResolving,
}: CommentCardProps) {
  const isResolved = comment.status === 'resolved'

  return (
    <div
      onClick={onSelect}
      className={`
        p-4 cursor-pointer transition-colors
        ${isSelected ? 'bg-pink-50 border-l-2 border-pink-500' : 'hover:bg-zinc-50'}
        ${isResolved ? 'opacity-75' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Pin Number */}
        <div
          className={`
            flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center
            text-xs font-bold text-white
            ${isResolved ? 'bg-green-500' : 'bg-pink-500'}
          `}
        >
          {index}
        </div>

        <div className="flex-1 min-w-0">
          {/* Comment Content */}
          <p className={`text-sm text-zinc-900 mb-2 ${isResolved ? 'line-through' : ''}`}>
            {comment.content}
          </p>

          {/* Metadata */}
          <div className="text-xs text-zinc-500 space-y-0.5">
            <div className="flex items-center gap-2">
              <span>{comment.meta?.browser || 'Unknown'}</span>
              <span className="text-zinc-300">•</span>
              <span>{comment.meta?.os || 'Unknown'}</span>
            </div>
            <div>{comment.url_path}</div>
            <div>{new Date(comment.created_at).toLocaleString()}</div>
          </div>

          {/* Actions */}
          <div className="mt-3 flex gap-2">
            {isResolved ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onReopen()
                }}
                disabled={isResolving}
                className="px-3 py-1 text-xs font-medium rounded-md bg-zinc-100 text-zinc-700 hover:bg-zinc-200 disabled:opacity-50"
              >
                {isResolving ? 'Reopening...' : 'Reopen'}
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onResolve()
                }}
                disabled={isResolving}
                className="px-3 py-1 text-xs font-medium rounded-md bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
              >
                {isResolving ? 'Resolving...' : 'Resolve'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Icons
function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  )
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}
