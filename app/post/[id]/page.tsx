import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import PostDetailPageClient from './PostDetailPageClient'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

async function getPost(id: string) {
  const supabase = await createClient()

  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id (
        id,
        name,
        avatar_url,
        jurusan,
        bio
      )
    `)
    .eq('id', id)
    .single()

  if (error || !post) {
    return null
  }

  return post
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const post = await getPost(id)

  if (!post) {
    notFound()
  }

  return <PostDetailPageClient params={params} />
}
