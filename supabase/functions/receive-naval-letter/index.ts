/**
 * Supabase Edge Function: receive-naval-letter
 *
 * Receives naval letter data from NLF, stores it in Supabase Storage,
 * creates a document record, and updates the EDMS request.
 *
 * Deploy with: supabase functions deploy receive-naval-letter
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface NLFPayload {
  attachment: {
    version: string
    createdAt: string
    edmsId: string
    ssic: string
    ssicTitle: string
    subject: string
    from: string
    to: string
    via: string[]
    paragraphs: any[]
    references: string[]
    enclosures: string[]
    copyTos: string[]
    letterType: string
    headerType: string
    originatorCode: string
    date: string
    signature: string
    unit: {
      line1: string
      line2: string
      line3: string
    }
  }
  filename: string
  unitCode: string | null
  recordUpdates: {
    ssic: string
    subject: string
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role for storage/db access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse the incoming payload
    const payload: NLFPayload = await req.json()
    const { attachment, filename, unitCode, recordUpdates } = payload

    if (!attachment?.edmsId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: edmsId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const requestId = attachment.edmsId
    const timestamp = Date.now()

    // 1. Upload JSON to Supabase Storage
    const storagePath = `${unitCode || 'unknown'}/${requestId}/${timestamp}-0-${filename}`
    const jsonContent = JSON.stringify(attachment, null, 2)

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('edms-docs')
      .upload(storagePath, jsonContent, {
        contentType: 'application/json',
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return new Response(
        JSON.stringify({ error: `Storage upload failed: ${uploadError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the public URL for the uploaded file
    const { data: urlData } = supabase
      .storage
      .from('edms-docs')
      .getPublicUrl(storagePath)

    const fileUrl = urlData?.publicUrl || storagePath

    // 2. Create document record in edms_documents
    const documentId = `doc-${timestamp}-${Math.random().toString(36).substr(2, 9)}`

    const documentRecord = {
      id: documentId,
      name: filename,
      type: 'application/json',
      size: new Blob([jsonContent]).size,
      uploaded_at: new Date().toISOString(),
      category: 'naval-letter',
      tags: ['naval-letter', attachment.letterType, attachment.ssic].filter(Boolean),
      unit_uic: unitCode,
      subject: attachment.subject,
      due_date: null,
      notes: `Naval letter generated via NLF. SSIC: ${attachment.ssic}`,
      uploaded_by_id: null, // NLF doesn't have user auth
      current_stage: 'draft',
      request_id: requestId,
      file_url: fileUrl,
      source: 'naval-letter-formatter'
    }

    const { error: docInsertError } = await supabase
      .from('edms_documents')
      .insert(documentRecord)

    if (docInsertError) {
      console.error('Document insert error:', docInsertError)
      // Continue anyway - we can still update the request
    }

    // 3. Update the edms_requests record
    // First, get the current document_ids array
    const { data: requestData, error: fetchError } = await supabase
      .from('edms_requests')
      .select('document_ids, activity')
      .eq('id', requestId)
      .single()

    if (fetchError) {
      console.error('Request fetch error:', fetchError)
      return new Response(
        JSON.stringify({
          error: `Request not found: ${requestId}`,
          documentId,
          fileUrl
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Append the new document ID to the array
    const currentDocIds = requestData?.document_ids || []
    const updatedDocIds = [...currentDocIds, documentId]

    // Add activity log entry
    const currentActivity = requestData?.activity || []
    const activityEntry = {
      timestamp: new Date().toISOString(),
      action: 'document_added',
      description: `Naval letter added via NLF: ${filename}`,
      documentId,
      source: 'naval-letter-formatter'
    }
    const updatedActivity = [...currentActivity, activityEntry]

    // Update the request
    const { error: updateError } = await supabase
      .from('edms_requests')
      .update({
        ssic: recordUpdates.ssic || attachment.ssic,
        subject: recordUpdates.subject || attachment.subject,
        document_ids: updatedDocIds,
        activity: updatedActivity
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('Request update error:', updateError)
      return new Response(
        JSON.stringify({
          error: `Failed to update request: ${updateError.message}`,
          documentId,
          fileUrl
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Naval letter saved to EDMS',
        documentId,
        fileUrl,
        requestId
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
