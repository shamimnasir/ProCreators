import { NextResponse } from 'next/server'
import { isSupabaseConfigured } from '@/lib/supabase'

export async function GET(request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Supabase not configured. Add credentials to .env' },
        { status: 500 }
      )
    }

    // TODO: Implement Supabase query
    // const { data, error } = await supabase
    //   .from('library')
    //   .select('*')
    //   .eq('userId', userId)
    //   .order('createdAt', { ascending: false })

    return NextResponse.json({
      success: true,
      items: [],
      message: 'Library placeholder - Supabase integration pending'
    })
  } catch (error) {
    console.error('List error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch library' },
      { status: 500 }
    )
  }
}
