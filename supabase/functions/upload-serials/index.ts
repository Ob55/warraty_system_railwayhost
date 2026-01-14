import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Serial number format validation - adjust pattern as needed
const SERIAL_FORMAT_REGEX = /^[A-Z0-9\-]{5,50}$/i;

interface UploadSerialsRequest {
  serialNumbers: string[]
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

    const body: UploadSerialsRequest = await req.json()
    const { serialNumbers } = body

    if (!serialNumbers || !Array.isArray(serialNumbers) || serialNumbers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No serial numbers provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${serialNumbers.length} serial numbers`)

    // Get existing serial numbers to check for duplicates
    const { data: existingSerials, error: fetchError } = await supabaseAdmin
      .from('serial_numbers')
      .select('serial_number')

    if (fetchError) {
      console.error('Error fetching existing serials:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to check existing serial numbers' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const existingSet = new Set((existingSerials || []).map(s => s.serial_number.toUpperCase()))
    const processedInFile = new Set<string>()

    const results = {
      added: 0,
      duplicates: 0,
      invalid: 0,
      errors: [] as string[]
    }

    const validSerials: { serial_number: string; status: string }[] = []

    for (const serial of serialNumbers) {
      const trimmed = serial.trim().toUpperCase()
      
      if (!trimmed) continue

      // Validate format
      if (!SERIAL_FORMAT_REGEX.test(trimmed)) {
        results.invalid++
        results.errors.push(`Invalid format: ${serial}`)
        continue
      }

      // Check for duplicates in file
      if (processedInFile.has(trimmed)) {
        results.duplicates++
        results.errors.push(`Duplicate in file: ${serial}`)
        continue
      }

      // Check for duplicates in DB
      if (existingSet.has(trimmed)) {
        results.duplicates++
        results.errors.push(`Already exists: ${serial}`)
        continue
      }

      processedInFile.add(trimmed)
      validSerials.push({
        serial_number: trimmed,
        status: 'unused'
      })
    }

    // Insert valid serials in batch
    if (validSerials.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('serial_numbers')
        .insert(validSerials)

      if (insertError) {
        console.error('Error inserting serials:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to insert serial numbers', details: insertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      results.added = validSerials.length
    }

    console.log('Upload results:', results)

    return new Response(
      JSON.stringify({
        success: true,
        results
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
