import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

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

    // Check if user owns this comment
    const { data: comment } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!comment) {
      return NextResponse.json(
        { data: null, error: 'Comment not found' },
        { status: 404 }
      )
    }

    if (comment.user_id !== user.id) {
      return NextResponse.json(
        { data: null, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('comments')
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
