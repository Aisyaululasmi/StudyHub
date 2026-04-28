'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MessageSquare, ExternalLink, FileText, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/lib/time'
import UpvoteButton from './UpvoteButton'
import BookmarkButton from './BookmarkButton'

interface PostCardProps {
  id: string
  title: string
  description: string | null
  type: 'link' | 'file' | 'text'
  url: string | null
  mata_kuliah: string
  jurusan: string
  tags: string[] | null
  created_at: string
  profiles: {
    id: string
    name: string
    avatar_url: string | null
  } | null
  vote_count: number
  comment_count: number
  initialVoted?: boolean
  initialBookmarked?: boolean
}

const typeConfig = {
  link: {
    label: 'Link',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    icon: ExternalLink,
  },
  file: {
    label: 'File',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    icon: FileText,
  },
  text: {
    label: 'Teks',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    icon: FileText,
  },
}

export default function PostCard({
  id,
  title,
  description,
  type,
  url,
  mata_kuliah,
  jurusan,
  tags,
  created_at,
  profiles,
  vote_count,
  comment_count,
  initialVoted = false,
  initialBookmarked = false,
}: PostCardProps) {
  const router = useRouter()
  const typeStyle = typeConfig[type]
  const TypeIcon = typeStyle.icon

  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    if (
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('a')
    ) {
      return
    }

    router.push(`/post/${id}`)
  }

  return (
    <article
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="p-6">
        {/* Header: Type, Title, Description */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium',
                  typeStyle.bgColor,
                  typeStyle.textColor
                )}
              >
                <TypeIcon className="w-3 h-3" />
                {typeStyle.label}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                {jurusan}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-700">
                {mata_kuliah}
              </span>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 hover:text-[#2563EB] transition-colors mb-2">
            <Link href={`/post/${id}`} className="hover:underline">
              {title}
            </Link>
          </h3>

          {description && (
            <p className="text-gray-600 line-clamp-2 text-sm">
              {description}
            </p>
          )}

          {type === 'link' && url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-[#2563EB] hover:underline mt-2"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3 h-3" />
              {url}
            </a>
          )}
        </div>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600 hover:bg-gray-100"
              >
                <Hash className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer: User info, actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          {/* User info */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] flex items-center justify-center text-white font-medium text-sm">
              {profiles?.name.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">
                {profiles?.name || 'Anonymous'}
              </p>
              <p className="text-xs text-gray-500">{timeAgo(created_at)}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Vote button */}
            <UpvoteButton
              postId={id}
              initialVoteCount={vote_count}
              initialVoted={initialVoted}
              variant="compact"
            />

            {/* Comment count */}
            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              <span className="font-medium">{comment_count}</span>
            </Button>

            {/* Bookmark button */}
            <BookmarkButton
              postId={id}
              initialBookmarked={initialBookmarked}
              variant="compact"
            />
          </div>
        </div>
      </div>
    </article>
  )
}
