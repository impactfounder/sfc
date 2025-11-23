import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  
  const authCookies = allCookies.filter(c => 
    c.name.includes('auth') || 
    c.name.includes('access') || 
    c.name.includes('refresh') ||
    c.name.includes('supabase')
  )

  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  const { data: { session } } = await supabase.auth.getSession()

  return NextResponse.json({
    user: user ? { id: user.id, email: user.email } : null,
    session: session ? { expiresAt: session.expires_at } : null,
    error: error?.message,
    cookies: {
      total: allCookies.length,
      authCookies: authCookies.map(c => ({
        name: c.name,
        hasValue: !!c.value,
        valueLength: c.value?.length || 0,
      })),
      allCookieNames: allCookies.map(c => c.name),
    },
  })
}

