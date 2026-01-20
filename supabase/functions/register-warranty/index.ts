import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RegisterWarrantyRequest {
  fullName: string
  email: string
  phone: string
  productType: string
  serialNumber: string
  productId?: string
}

// Serial number format validation
const SERIAL_FORMAT_REGEX = /^[A-Z0-9\-]{5,50}$/i;

// Default warranty limit per phone number (fallback if not set in DB)
const DEFAULT_WARRANTY_LIMIT = 2;

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body: RegisterWarrantyRequest = await req.json()
    console.log('Registering warranty:', body)

    const { fullName, email, phone, productType, serialNumber, productId } = body

    // Validate required fields
    if (!fullName || !email || !phone || !productType || !serialNumber) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: fullName, email, phone, productType, serialNumber' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const trimmedSerial = serialNumber.trim().toUpperCase()
    const trimmedPhone = phone.trim()

    // Validate serial number format
    if (!SERIAL_FORMAT_REGEX.test(trimmedSerial)) {
      return new Response(
        JSON.stringify({ error: 'Invalid serial number format. Please check and try again.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if serial number exists in the system
    const { data: serialData, error: serialError } = await supabaseAdmin
      .from('serial_numbers')
      .select('*')
      .eq('serial_number', trimmedSerial)
      .maybeSingle()

    if (serialError) {
      console.error('Error checking serial:', serialError)
      return new Response(
        JSON.stringify({ error: 'Failed to verify serial number' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!serialData) {
      return new Response(
        JSON.stringify({ error: 'Serial number not found. Please check the serial number again.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (serialData.status === 'used') {
      return new Response(
        JSON.stringify({ error: 'This serial number has already been registered.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch global default warranty limit from settings table
    const { data: settingsData } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'default_warranty_limit')
      .maybeSingle()

    const globalDefaultLimit = settingsData ? parseInt(settingsData.value) : DEFAULT_WARRANTY_LIMIT
    console.log('Global warranty limit:', globalDefaultLimit)

    // Check phone number warranty limit - count ALL warranties across ALL owners with this phone
    // This prevents bypass by using different emails with the same phone number
    const { data: ownersWithPhone, error: ownersPhoneError } = await supabaseAdmin
      .from('warranty_owners')
      .select('id')
      .eq('phone', trimmedPhone)

    if (ownersPhoneError) {
      console.error('Error fetching owners by phone:', ownersPhoneError)
    }

    // Count total warranties for this phone number across all owner accounts
    const ownerIds = ownersWithPhone?.map(o => o.id) || []
    let totalWarrantiesForPhone = 0

    if (ownerIds.length > 0) {
      const { count, error: countError } = await supabaseAdmin
        .from('warranties')
        .select('*', { count: 'exact', head: true })
        .in('owner_id', ownerIds)

      if (countError) {
        console.error('Error counting warranties:', countError)
      } else {
        totalWarrantiesForPhone = count || 0
      }
    }

    console.log(`Phone ${trimmedPhone} has ${totalWarrantiesForPhone} warranties, limit is ${globalDefaultLimit}`)

    // Check if phone has reached the warranty limit
    if (totalWarrantiesForPhone >= globalDefaultLimit) {
      return new Response(
        JSON.stringify({ 
          error: 'You have reached the maximum number of warranties for this phone number. Kindly contact customer care for assistance.' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if warranty owner already exists with this email
    let ownerId: string
    let accessCode: string

    const { data: existingOwner, error: ownerCheckError } = await supabaseAdmin
      .from('warranty_owners')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (ownerCheckError) {
      console.error('Error checking existing owner:', ownerCheckError)
      return new Response(
        JSON.stringify({ error: 'Failed to check existing owner', details: ownerCheckError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (existingOwner) {
      // Reuse existing owner and access code
      ownerId = existingOwner.id
      accessCode = existingOwner.access_code
      console.log('Using existing owner:', ownerId)
    } else {
      // Create new warranty owner
      accessCode = Math.random().toString(36).substring(2, 10).toUpperCase()
      const { data: newOwner, error: createOwnerError } = await supabaseAdmin
        .from('warranty_owners')
        .insert({
          full_name: fullName,
          email: email.toLowerCase(),
          phone: trimmedPhone,
          access_code: accessCode,
          warranty_limit: globalDefaultLimit
        })
        .select()
        .single()

      if (createOwnerError) {
        console.error('Error creating owner:', createOwnerError)
        return new Response(
          JSON.stringify({ error: 'Failed to create warranty owner', details: createOwnerError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      ownerId = newOwner.id
      console.log('Created new owner:', ownerId)
    }

    // Create a new product with the validated serial number
    const qrCode = `product-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const { data: newProduct, error: productError } = await supabaseAdmin
      .from('products')
      .insert({
        product_type: productType,
        serial_number: trimmedSerial,
        qr_code: qrCode
      })
      .select()
      .single()

    if (productError) {
      console.error('Error creating product:', productError)
      return new Response(
        JSON.stringify({ error: 'Failed to create product', details: productError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const finalProductId = newProduct.id
    console.log('Created new product:', finalProductId)

    // Create the warranty
    const { data: warranty, error: warrantyError } = await supabaseAdmin
      .from('warranties')
      .insert({
        product_id: finalProductId,
        owner_id: ownerId
      })
      .select()
      .single()

    if (warrantyError) {
      console.error('Error creating warranty:', warrantyError)
      return new Response(
        JSON.stringify({ error: 'Failed to create warranty', details: warrantyError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update serial number status to 'used' and link to warranty
    const { error: updateSerialError } = await supabaseAdmin
      .from('serial_numbers')
      .update({
        status: 'used',
        warranty_id: warranty.id,
        used_at: new Date().toISOString()
      })
      .eq('id', serialData.id)

    if (updateSerialError) {
      console.error('Error updating serial status:', updateSerialError)
      // Don't fail the request, warranty is already created
    }

    console.log('Warranty created successfully:', warranty.id)

    return new Response(
      JSON.stringify({
        success: true,
        warranty: {
          id: warranty.id,
          product_id: warranty.product_id,
          owner_id: warranty.owner_id,
          activation_date: warranty.activation_date,
          expiry_date: warranty.expiry_date,
          status: warranty.status
        },
        accessCode
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