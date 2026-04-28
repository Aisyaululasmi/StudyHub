import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { name, jurusan, bio, avatar_url } = body

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        name: name || undefined,
        jurusan: jurusan || undefined,
        bio: bio || undefined,
        avatar_url: avatar_url || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { data: null, error: error.message },
        { status: 400 }
      )
    }

    revalidatePath('/profile/[id]', 'page')

    return NextResponse.json({ data: profile, error: null })
  } catch (error) {
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
