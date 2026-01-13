import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const adminEmail = 'brian55mwangi@gmail.com'
    const adminPassword = 'draggonne..'

    // Check if admin already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingAdmin = existingUsers?.users?.find(u => u.email === adminEmail)

    if (existingAdmin) {
      // Check if role already exists
      const { data: existingRole } = await supabaseAdmin
        .from('user_roles')
        .select('*')
        .eq('user_id', existingAdmin.id)
        .eq('role', 'admin')
        .maybeSingle()

      if (existingRole) {
        return new Response(
          JSON.stringify({ message: 'Admin already exists and has admin role', userId: existingAdmin.id }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Add admin role to existing user
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: existingAdmin.id, role: 'admin' })

      if (roleError) {
        console.error('Error adding admin role:', roleError)
        return new Response(
          JSON.stringify({ error: 'Failed to add admin role', details: roleError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ message: 'Admin role added to existing user', userId: existingAdmin.id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create new admin user
    console.log('Creating admin user...')
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true
    })

    if (createError) {
      console.error('Error creating admin user:', createError)
      return new Response(
        JSON.stringify({ error: 'Failed to create admin user', details: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Admin user created:', newUser.user.id)

    // Insert admin role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: newUser.user.id, role: 'admin' })

    if (roleError) {
      console.error('Error inserting admin role:', roleError)
      return new Response(
        JSON.stringify({ error: 'Failed to assign admin role', details: roleError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Admin role assigned successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin user created and role assigned',
        userId: newUser.user.id 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Unexpected error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
