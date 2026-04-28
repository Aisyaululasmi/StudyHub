import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const jurusan = searchParams.get('jurusan')
    const mataKuliah = searchParams.get('mata_kuliah')
    const type = searchParams.get('type')
    const sort = searchParams.get('sort') || 'newest'
    const search = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = await createClient()

    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (
          id,
          name,
          avatar_url,
          jurusan
        )
      `)

    // Apply filters
    if (jurusan) {
      query = query.eq('jurusan', jurusan)
    }

    if (mataKuliah) {
      query = query.eq('mata_kuliah', mataKuliah)
    }

    if (type && type !== 'all') {
      query = query.eq('type', type)
    }

    // Full-text search
    if (search) {
      query = query.textSearch('search_vector', search.replace(/\s+/g, ' & '), {
        type: 'websearch',
        config: 'indonesian',
      })
    }

    // Sorting
    switch (sort) {
      case 'most_upvotes':
        query = query.order('upvotes', { ascending: false })
        break
      case 'most_comments':
        // Will need to join with comments table
        query = query.order('created_at', { ascending: false })
        break
      case 'oldest':
        query = query.order('created_at', { ascending: true })
        break
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false })
        break
    }

    query = query.range(offset, offset + limit - 1)

    const { data: posts, error } = await query

    if (error) {
      return NextResponse.json(
        { data: null, error: error.message },
        { status: 400 }
      )
    }

    // Get vote counts for each post
    const postIds = posts?.map((p) => p.id) || []
    const { data: votes } = await supabase
      .from('votes')
      .select('post_id, value')
      .in('post_id', postIds)

    // Get comment counts
    const { data: commentCounts } = await supabase
      .from('comments')
      .select('post_id')
      .in('post_id', postIds)

    // Calculate counts
    const voteCounts = new Map<string, number>()
    votes?.forEach((v) => {
      voteCounts.set(v.post_id, (voteCounts.get(v.post_id) || 0) + v.value)
    })

    const commentCountMap = new Map<string, number>()
    commentCounts?.forEach((c) => {
      commentCountMap.set(c.post_id, (commentCountMap.get(c.post_id) || 0) + 1)
    })

    // Add counts to posts
    const postsWithCounts = posts?.map((post) => ({
      ...post,
      vote_count: voteCounts.get(post.id) || 0,
      comment_count: commentCountMap.get(post.id) || 0,
    }))

    return NextResponse.json({
      data: postsWithCounts || [],
      error: null,
    })
  } catch (error) {
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, type, url, mata_kuliah, jurusan, tags, content } = body

    if (!title || !type || !mata_kuliah || !jurusan) {
      return NextResponse.json(
        { data: null, error: 'Missing required fields' },
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

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        title,
        description: description || null,
        type,
        url: type === 'link' ? url : null,
        file_url: null, // Will be set separately if file uploaded
        mata_kuliah,
        jurusan,
        tags: tags || [],
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { data: null, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ data: post, error: null }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
