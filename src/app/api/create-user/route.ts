import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email, password, fullName, role } = await request.json();
    if (password.length < 12) {
  return NextResponse.json({ error: 'Password must be at least 12 characters long.' }, { status: 400 });
}

    // 1. Initialize a Supabase client using the SECRET key (Server-side only!)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 2. Create the user in Supabase Authentication
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm their email
      user_metadata: { full_name: fullName, role: role } // Trigger will use this!
    });

    if (error) throw error;

    // 3. Update their profile to be active immediately
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ role: role, active: true })
      .eq('id', data.user.id);

    if (profileError) throw profileError;

    return NextResponse.json({ message: 'User created successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}