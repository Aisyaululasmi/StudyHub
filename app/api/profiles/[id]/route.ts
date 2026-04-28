import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { data: null, error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Get user's posts
    const { data: posts } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })

    // Get user's bookmarks with post details
    const { data: { user } } = await supabase.auth.getUser()
    let bookmarks = []

    if (user && user.id === id) {
      const { data: bookmarkData } = await supabase
        .from('bookmarks')
        .select(`
          *,
          posts (
            id,
            title,
            description,
            type,
            mata_kuliah,
            jurusan,
            created_at
          )
        `)
        .eq('user_id', id)
        .order('created_at', { ascending: false })

      bookmarks = bookmarkData || []
    }

    // Calculate stats
    const totalPosts = posts?.length || 0
    const totalUpvotes = posts?.reduce((sum, p) => sum + (p.upvotes || 0), 0) || 0

    // Get comment count (sum of comments on user's posts)
    const postIds = posts?.map((p) => p.id) || []
    let totalComments = 0

    if (postIds.length > 0) {
      const { count } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .in('post_id', postIds)

      totalComments = count || 0
    }

    const profileData = {
      ...profile,
      stats: {
        totalPosts,
        totalUpvotes,
        totalComments,
      },
    }

    return NextResponse.json({
      data: {
        profile: profileData,
        posts: posts || [],
        bookmarks,
        isOwnProfile: user?.id === id,
      },
      error: null,
    })
  } catch (error) {
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
