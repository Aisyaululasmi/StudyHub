import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { post_id } = await request.json()

    if (!post_id) {
      return NextResponse.json(
        { data: null, error: 'post_id is required' },
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

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id, value')
      .eq('user_id', user.id)
      .eq('post_id', post_id)
      .single()

    let voteCount = 0

    if (existingVote) {
      // Remove existing vote (toggle off)
      const { error: deleteError } = await supabase
        .from('votes')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', post_id)

      if (deleteError) {
        return NextResponse.json(
          { data: null, error: deleteError.message },
          { status: 400 }
        )
      }

      // Get updated vote count
      const { data: votes } = await supabase
        .from('votes')
        .select('value')
        .eq('post_id', post_id)

      voteCount = votes?.reduce((sum, v) => sum + v.value, 0) || 0

      return NextResponse.json({
        data: {
          voted: false,
          vote_count: voteCount,
        },
        error: null,
      })
    } else {
      // Add new vote
      const { error: insertError } = await supabase
        .from('votes')
        .insert({
          user_id: user.id,
          post_id,
          value: 1,
        })

      if (insertError) {
        return NextResponse.json(
          { data: null, error: insertError.message },
          { status: 400 }
        )
      }

      // Get updated vote count
      const { data: votes } = await supabase
        .from('votes')
        .select('value')
        .eq('post_id', post_id)

      voteCount = votes?.reduce((sum, v) => sum + v.value, 0) || 0

      return NextResponse.json({
        data: {
          voted: true,
          vote_count: voteCount,
        },
        error: null,
      })
    }
  } catch (error) {
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
