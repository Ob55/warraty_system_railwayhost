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
  serialNumber?: string
  productId?: string
}

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
    if (!fullName || !email || !phone || !productType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: fullName, email, phone, productType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
          phone: phone,
          access_code: accessCode
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

    // Get or create the product
    let finalProductId = productId

    if (!productId) {
      // Create a new product if none provided (static QR code, never changes)
      const qrCode = `product-${Date.now()}-${Math.random().toString(36).substring(7)}`
      const { data: newProduct, error: productError } = await supabaseAdmin
        .from('products')
        .insert({
          product_type: productType,
          serial_number: serialNumber || `SN-${Date.now()}`,
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
      finalProductId = newProduct.id
      console.log('Created new product:', finalProductId)
    } else {
      // Verify the product exists
      const { data: existingProduct, error: productCheckError } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('id', productId)
        .maybeSingle()

      if (productCheckError || !existingProduct) {
        console.error('Product not found:', productId)
        return new Response(
          JSON.stringify({ error: 'Product not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      console.log('Using existing product:', productId)
    }

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
