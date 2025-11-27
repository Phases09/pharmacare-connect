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

    const { patientMedicationId } = await req.json()

    // Get patient medication details with medication info
    const { data: patientMed, error: medError } = await supabaseClient
      .from('patient_medications')
      .select(`
        *,
        patient:patients(*),
        medication:medications(*)
      `)
      .eq('id', patientMedicationId)
      .single()

    if (medError) throw medError

    const medication = patientMed.medication
    const patient = patientMed.patient
    const startDate = new Date(patientMed.start_date)
    const reminders = []

    // Create dose reminders based on dosage frequency
    if (medication.dosage_frequency_hours && medication.treatment_duration_days) {
      const dosesPerDay = 24 / medication.dosage_frequency_hours
      const totalDoses = dosesPerDay * medication.treatment_duration_days

      for (let i = 0; i < totalDoses; i++) {
        const scheduledAt = new Date(startDate.getTime() + (i * medication.dosage_frequency_hours * 60 * 60 * 1000))
        
        reminders.push({
          patient_id: patient.id,
          patient_medication_id: patientMedicationId,
          reminder_type: 'dose',
          message: `Time to take your ${medication.name}. Dosage: ${patientMed.custom_dosage || medication.standard_dosage}`,
          scheduled_at: scheduledAt.toISOString(),
          delivery_channel: 'sms',
          status: 'pending'
        })

        // Also create WhatsApp reminder
        reminders.push({
          patient_id: patient.id,
          patient_medication_id: patientMedicationId,
          reminder_type: 'dose',
          message: `Time to take your ${medication.name}. Dosage: ${patientMed.custom_dosage || medication.standard_dosage}`,
          scheduled_at: scheduledAt.toISOString(),
          delivery_channel: 'whatsapp',
          status: 'pending'
        })
      }
    }

    // Create therapy completion reminders
    for (let day = 1; day <= medication.treatment_duration_days; day++) {
      const scheduledAt = new Date(startDate.getTime() + (day * 24 * 60 * 60 * 1000))
      
      reminders.push({
        patient_id: patient.id,
        patient_medication_id: patientMedicationId,
        reminder_type: 'therapy_completion',
        message: `You have completed Day ${day} of your ${medication.name} treatment.`,
        scheduled_at: scheduledAt.toISOString(),
        delivery_channel: 'sms',
        status: 'pending'
      })
    }

    // Create refill reminder if chronic medication
    if (medication.is_chronic && medication.refill_reminder_days) {
      const refillDate = new Date(startDate.getTime() + (medication.treatment_duration_days - medication.refill_reminder_days) * 24 * 60 * 60 * 1000)
      
      reminders.push({
        patient_id: patient.id,
        patient_medication_id: patientMedicationId,
        reminder_type: 'refill',
        message: `Time to refill your ${medication.name} prescription. Please contact your pharmacy.`,
        scheduled_at: refillDate.toISOString(),
        delivery_channel: 'sms',
        status: 'pending'
      })
    }

    // Insert all reminders
    const { error: insertError } = await supabaseClient
      .from('reminders')
      .insert(reminders)

    if (insertError) throw insertError

    // Create follow-up record
    const followUpDate = new Date(startDate.getTime() + (medication.follow_up_day * 24 * 60 * 60 * 1000))
    
    const { error: followUpError } = await supabaseClient
      .from('follow_ups')
      .insert({
        patient_id: patient.id,
        patient_medication_id: patientMedicationId,
        pharmacist_id: patient.pharmacist_id,
        scheduled_date: followUpDate.toISOString().split('T')[0],
        status: 'pending'
      })

    if (followUpError) throw followUpError

    console.log(`Scheduled ${reminders.length} reminders for patient ${patient.full_name}`)

    return new Response(
      JSON.stringify({ success: true, remindersScheduled: reminders.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error scheduling reminders:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})