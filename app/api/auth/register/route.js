import { NextResponse } from 'next/server'
import { isSupabaseConfigured } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { name, email, password } = await request.json()
    
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Supabase not configured. Add credentials to .env' },
        { status: 500 }
      )
    }

    // TODO: Implement Supabase auth
    // const { data, error } = await supabase.auth.signUp({
    //   email,
    //   password,
    //   options: {
    //     data: {
    //       name,
    //     },
    //   },
    // })

    return NextResponse.json({
      success: true,
      message: 'Registration placeholder - Supabase integration pending'
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    )
  }
}
