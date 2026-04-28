'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Upload, X } from 'lucide-react'

const jurusanList = [
  'Teknik Informatika',
  'Sistem Informasi',
  'Manajemen',
  'Akuntansi',
  'Hukum',
  'Kedokteran',
  'Psikologi',
  'Ilmu Komunikasi',
  'Desain Komunikasi Visual',
  'Arsitektur',
]

export default function EditProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [name, setName] = useState('')
  const [jurusan, setJurusan] = useState('')
  const [bio, setBio] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  useEffect(() => {
    const getUserProfile = async () => {
      try {
        const supabase = createBrowserClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          router.push('/auth/login')
          return
        }

        const res = await fetch('/api/auth/profile')
        const data = await res.json()

        if (data.data) {
          setUser(data.data)
          setName(data.data.name || '')
          setJurusan(data.data.jurusan || '')
          setBio(data.data.bio || '')
          setAvatarPreview(data.data.avatar_url || null)
        }
      } catch (error) {
        toast.error('Gagal memuat profil')
      }
    }

    getUserProfile()
  }, [router])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Format harus berupa gambar (JPG, PNG)')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 2MB')
      return
    }

    setAvatarFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile || uploadingAvatar) return

    setUploadingAvatar(true)

    try {
      const supabase = createBrowserClient()
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) {
        throw error
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      setAvatarPreview(publicUrl)
      setAvatarFile(null)

      toast.success('Avatar berhasil diupload!')
    } catch (error) {
      toast.error('Gagal mengupload avatar')
      console.error(error)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Nama harus diisi')
      return
    }

    if (bio.length > 500) {
      toast.error('Bio maksimal 500 karakter')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/profiles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          jurusan: jurusan || null,
          bio: bio.trim() || null,
          avatar_url: avatarPreview,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update profile')
      }

      toast.success('Profil berhasil diupdate!')
      router.back()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengupdate profil')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-20">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#2563EB]" />
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Profil</h1>
        <p className="text-gray-600">Update informasi profilmu</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div>
            <Label>Avatar</Label>
            <div className="flex items-center gap-6 mt-2">
              <div className="relative">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] flex items-center justify-center text-white font-bold text-3xl border-4 border-gray-200">
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="avatar"
                    className="cursor-pointer inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Pilih Foto
                  </label>
                  <input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={uploadingAvatar}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAvatarUpload}
                    disabled={!avatarFile || uploadingAvatar}
                  >
                    {uploadingAvatar ? 'Mengupload...' : 'Upload'}
                  </Button>
                  {avatarPreview && avatarPreview !== user?.avatar_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAvatarPreview(user?.avatar_url || null)
                        setAvatarFile(null)
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  JPG atau PNG, maksimal 2MB
                </p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="name">
              Nama Lengkap <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              disabled={loading}
              required
            />
          </div>

          {/* Jurusan */}
          <div>
            <Label htmlFor="jurusan">Jurusan</Label>
            <select
              id="jurusan"
              value={jurusan}
              onChange={(e) => setJurusan(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
            >
              <option value="">Pilih Jurusan</option>
              {jurusanList.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ceritakan sedikit tentang dirimu..."
              rows={4}
              maxLength={500}
              disabled={loading}
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">{bio.length}/500 karakter</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Perubahan'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Batal
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
