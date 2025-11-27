import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Get reminders that were scheduled but not confirmed within 3 hours
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000)
    
    const { data: missedReminders, error: fetchError } = await supabaseClient
      .from('reminders')
      .select(`
        *,
        patient:patients(*),
        patient_medication:patient_medications(
          *,
          medication:medications(*)
        )
      `)
      .eq('reminder_type', 'dose')
      .eq('status', 'sent')
      .lte('scheduled_at', threeHoursAgo.toISOString())

    if (fetchError) throw fetchError

    console.log(`Found ${missedReminders?.length || 0} potentially missed doses`)

    // Create adherence reminders for missed doses
    const adherenceReminders = []

    for (const reminder of missedReminders || []) {
      const medication = reminder.patient_medication.medication
      
      adherenceReminders.push({
        patient_id: reminder.patient_id,
        patient_medication_id: reminder.patient_medication_id,
        reminder_type: 'adherence',
        message: `You missed a dose of ${medication.name} 3 hours ago. Please take it as soon as possible.`,
        scheduled_at: new Date().toISOString(),
        delivery_channel: 'sms',
        status: 'pending'
      })

      adherenceReminders.push({
        patient_id: reminder.patient_id,
        patient_medication_id: reminder.patient_medication_id,
        reminder_type: 'adherence',
        message: `You missed a dose of ${medication.name} 3 hours ago. Please take it as soon as possible.`,
        scheduled_at: new Date().toISOString(),
        delivery_channel: 'whatsapp',
        status: 'pending'
      })

      // Mark original reminder as acknowledged
      await supabaseClient
        .from('reminders')
        .update({ status: 'acknowledged' })
        .eq('id', reminder.id)
    }

    if (adherenceReminders.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('reminders')
        .insert(adherenceReminders)

      if (insertError) throw insertError

      console.log(`Created ${adherenceReminders.length} adherence reminders`)
    }

    return new Response(
      JSON.stringify({ success: true, adherenceRemindersCreated: adherenceReminders.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error checking adherence:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})