import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')
const TWILIO_WHATSAPP_NUMBER = Deno.env.get('TWILIO_WHATSAPP_NUMBER')

async function sendSMS(to: string, message: string) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
  
  const body = new URLSearchParams({
    To: to,
    From: TWILIO_PHONE_NUMBER!,
    Body: message
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  })

  return response.json()
}

async function sendWhatsApp(to: string, message: string) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
  
  const body = new URLSearchParams({
    To: `whatsapp:${to}`,
    From: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
    Body: message
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  })

  return response.json()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get pending reminders that are due
    const now = new Date()
    const { data: dueReminders, error: fetchError } = await supabaseClient
      .from('reminders')
      .select(`
        *,
        patient:patients(*)
      `)
      .eq('status', 'pending')
      .lte('scheduled_at', now.toISOString())
      .limit(100)

    if (fetchError) throw fetchError

    console.log(`Found ${dueReminders?.length || 0} due reminders`)

    const results = []

    for (const reminder of dueReminders || []) {
      try {
        let result

        if (reminder.delivery_channel === 'sms') {
          result = await sendSMS(reminder.patient.phone, reminder.message)
        } else if (reminder.delivery_channel === 'whatsapp') {
          result = await sendWhatsApp(reminder.patient.phone, reminder.message)
        }

        // Update reminder status
        await supabaseClient
          .from('reminders')
          .update({
            status: 'sent',
            sent_at: now.toISOString()
          })
          .eq('id', reminder.id)

        results.push({ id: reminder.id, status: 'sent', result })
        console.log(`Sent ${reminder.delivery_channel} reminder to ${reminder.patient.full_name}`)
      } catch (error) {
        // Update reminder with error
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        await supabaseClient
          .from('reminders')
          .update({
            status: 'failed',
            error_message: errorMessage
          })
          .eq('id', reminder.id)

        results.push({ id: reminder.id, status: 'failed', error: errorMessage })
        console.error(`Failed to send reminder ${reminder.id}:`, error)
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in send-reminders:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})