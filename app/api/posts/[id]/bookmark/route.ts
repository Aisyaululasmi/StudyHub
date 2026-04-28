import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(
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

    const { data: bookmark, error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: user.id,
        post_id: id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { data: null, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ data: bookmark, error: null })
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
      .from('bookmarks')
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
