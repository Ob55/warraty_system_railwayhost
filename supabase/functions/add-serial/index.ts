import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Serial number format validation
const SERIAL_FORMAT_REGEX = /^[A-Z0-9\-]{5,50}$/i;

interface AddSerialRequest {
  serialNumber: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify admin role from JWT
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body: AddSerialRequest = await req.json()
    const { serialNumber } = body

    if (!serialNumber) {
      return new Response(
        JSON.stringify({ error: 'Serial number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const trimmed = serialNumber.trim().toUpperCase()

    // Validate format
    if (!SERIAL_FORMAT_REGEX.test(trimmed)) {
      return new Response(
        JSON.stringify({ error: 'Invalid serial number format. Must be 5-50 alphanumeric characters or hyphens.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if already exists
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('serial_numbers')
      .select('id')
      .eq('serial_number', trimmed)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing serial:', checkError)
      return new Response(
        JSON.stringify({ error: 'Failed to check serial number' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'Serial number already exists' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert the serial number
    const { data: newSerial, error: insertError } = await supabaseAdmin
      .from('serial_numbers')
      .insert({
        serial_number: trimmed,
        status: 'unused'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting serial:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to add serial number', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Serial number added:', newSerial)

    return new Response(
      JSON.stringify({
        success: true,
        serial: newSerial
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
