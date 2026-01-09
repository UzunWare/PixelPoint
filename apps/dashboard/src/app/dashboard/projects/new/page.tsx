'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function NewProjectPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const url = formData.get('url') as string

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create project
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name,
          url,
          owner_id: user.id,
        })
        .select()
        .single()

      if (error) throw error

      // Redirect to project details
      router.push(`/dashboard/projects/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
      setIsLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <Link href="/dashboard" className="text-zinc-500 hover:text-zinc-700 text-sm">
          ← Back to Projects
        </Link>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Create New Project</h1>
        <p className="text-zinc-600 mt-1">Set up a new project to start collecting feedback</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 rounded-xl p-6">
        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-2">
              Project Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="My Portfolio"
            />
            <p className="mt-1 text-sm text-zinc-500">A friendly name to identify this project</p>
          </div>

          <div>
            <label htmlFor="url" className="block text-sm font-medium text-zinc-700 mb-2">
              Website URL
            </label>
            <input
              id="url"
              name="url"
              type="url"
              required
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="https://example.com"
            />
            <p className="mt-1 text-sm text-zinc-500">The website where you'll install the widget</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white font-medium rounded-lg transition-colors"
            >
              {isLoading ? 'Creating...' : 'Create Project'}
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-2 text-zinc-600 hover:text-zinc-900 font-medium rounded-lg transition-colors"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
