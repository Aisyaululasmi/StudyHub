'use client'

import { useState } from 'react'
import { FileText, Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProfileTabsProps {
  activeTab: 'posts' | 'bookmarks'
  onTabChange: (tab: 'posts' | 'bookmarks') => void
  postCount: number
  bookmarkCount: number
  showBookmarks: boolean
}

export default function ProfileTabs({
  activeTab,
  onTabChange,
  postCount,
  bookmarkCount,
  showBookmarks,
}: ProfileTabsProps) {
  return (
    <div className="border-b border-gray-200 mb-6">
      <div className="flex gap-6">
        <button
          onClick={() => onTabChange('posts')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 border-b-2 transition-colors',
            activeTab === 'posts'
              ? 'border-[#2563EB] text-[#2563EB]'
              : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
          )}
        >
          <FileText className="w-4 h-4" />
          <span className="font-medium">Materi Saya</span>
          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
            {postCount}
          </span>
        </button>

        {showBookmarks && (
          <button
            onClick={() => onTabChange('bookmarks')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 border-b-2 transition-colors',
              activeTab === 'bookmarks'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            )}
          >
            <Bookmark className="w-4 h-4" />
            <span className="font-medium">Disimpan</span>
            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
              {bookmarkCount}
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
