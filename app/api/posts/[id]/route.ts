import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    if (error) {
      return NextResponse.json(
        { data: null, error: error.message },
        { status: 404 }
      )
    }

    // Get vote count
    const { data: votes } = await supabase
      .from('votes')
      .select('value')
      .eq('post_id', id)

    const voteCount = votes?.reduce((sum, v) => sum + v.value, 0) || 0

    // Get comment count
    const { count: commentCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', id)

    // Get user's vote if authenticated
    const { data: { user } } = await supabase.auth.getUser()
    let userVote = false
    let userBookmarked = false

    if (user) {
      const { data: userVoteData } = await supabase
        .from('votes')
        .select('value')
        .eq('user_id', user.id)
        .eq('post_id', id)
        .single()

      userVote = !!userVoteData

      const { data: bookmarkData } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', id)
        .single()

      userBookmarked = !!bookmarkData
    }

    const postData = {
      ...post,
      vote_count: voteCount,
      comment_count: commentCount || 0,
      user_vote: userVote,
      is_bookmarked: userBookmarked,
    }

    return NextResponse.json({ data: postData, error: null })
  } catch (error) {
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user owns this post
    const { data: existingPost } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existingPost) {
      return NextResponse.json(
        { data: null, error: 'Post not found' },
        { status: 404 }
      )
    }

    if (existingPost.user_id !== user.id) {
      return NextResponse.json(
        { data: null, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Update post
    const { data: post, error } = await supabase
      .from('posts')
      .update({
        title: body.title,
        description: body.description || null,
        mata_kuliah: body.mata_kuliah,
        jurusan: body.jurusan,
        tags: body.tags || null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { data: null, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ data: post, error: null })
  } catch (error) {
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user owns this post
    const { data: existingPost } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existingPost) {
      return NextResponse.json(
        { data: null, error: 'Post not found' },
        { status: 404 }
      )
    }

    if (existingPost.user_id !== user.id) {
      return NextResponse.json(
        { data: null, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { data: null, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ data: { success: true }, error: null })
  } catch (error) {
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
