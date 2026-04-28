import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { value } = await request.json()

    if (value !== 1 && value !== -1) {
      return NextResponse.json(
        { data: null, error: 'Invalid vote value' },
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

    const { data: vote, error } = await supabase
      .from('votes')
      .upsert(
        {
          user_id: user.id,
          post_id: id,
          value,
        },
        {
          onConflict: 'user_id,post_id',
        }
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { data: null, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ data: vote, error: null })
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

    const { error } = await supabase
      .from('votes')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', id)

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
