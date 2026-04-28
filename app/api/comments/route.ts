import { createClient } from '@/lib/supabase'
import { NextResponse, NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')

    if (!postId) {
      return NextResponse.json(
        { data: null, error: 'postId is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id (
          id,
          name,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json(
        { data: null, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ data: comments || [], error: null })
  } catch (error) {
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    const { content } = await request.json()

    if (!postId) {
      return NextResponse.json(
        { data: null, error: 'postId is required' },
        { status: 400 }
      )
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: 'Comment content is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        post_id: postId,
        content: content.trim(),
      })
      .select(`
        *,
        profiles:user_id (
          id,
          name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      return NextResponse.json(
        { data: null, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ data: comment, error: null }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
