'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Edit, User as UserIcon, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ProfileHeaderProps {
  profile: {
    id: string
    name: string
    jurusan: string | null
    avatar_url: string | null
    bio: string | null
  }
  stats: {
    totalPosts: number
    totalUpvotes: number
    totalComments: number
  }
  isOwnProfile: boolean
}

export default function ProfileHeader({
  profile,
  stats,
  isOwnProfile,
}: ProfileHeaderProps) {
  const router = useRouter()

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] flex items-center justify-center text-white font-bold text-3xl border-4 border-gray-100">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
              {profile.jurusan && (
                <p className="text-sm text-gray-600 mt-1">{profile.jurusan}</p>
              )}
            </div>

            {isOwnProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/profile/edit')}
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit Profil
              </Button>
            )}
          </div>

          {profile.bio && (
            <p className="text-gray-700 mb-4">{profile.bio}</p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-[#2563EB]">{stats.totalPosts}</div>
              <div className="text-xs text-gray-600 mt-1">Materi</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.totalUpvotes}</div>
              <div className="text-xs text-gray-600 mt-1">Upvotes</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.totalComments}</div>
              <div className="text-xs text-gray-600 mt-1">Komentar</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
