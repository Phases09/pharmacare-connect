import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Send SMS via Arkesel API V2
async function sendSMS(to: string, message: string): Promise<{ success: boolean; error?: string }> {
  const apiKey = Deno.env.get("ARKESEL_API_KEY");
  const senderId = Deno.env.get("ARKESEL_SENDER_ID") || "PharmyCare";

  if (!apiKey) {
    return { success: false, error: "ARKESEL_API_KEY not configured" };
  }

  // Format phone number - ensure it starts with country code (Ghana: 233)
  let formattedPhone = to.replace(/\s+/g, "").replace(/^0/, "233");
  if (!formattedPhone.startsWith("233") && !formattedPhone.startsWith("+")) {
    formattedPhone = "233" + formattedPhone;
  }
  formattedPhone = formattedPhone.replace("+", "");

  try {
    const response = await fetch("https://sms.arkesel.com/api/v2/sms/send", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: senderId,
        message: message,
        recipients: [formattedPhone],
      }),
    });

    const result = await response.json();
    console.log("Arkesel SMS response:", result);

    if (response.ok && result.status === "success") {
      return { success: true };
    } else {
      return { success: false, error: result.message || "Failed to send SMS" };
    }
  } catch (error: unknown) {
    console.error("Error sending SMS via Arkesel:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all pending reminders that are due
    const now = new Date().toISOString();
    const { data: reminders, error: fetchError } = await supabase
      .from("reminders")
      .select(`
        *,
        patient:patients(*)
      `)
      .eq("status", "pending")
      .lte("scheduled_at", now)
      .limit(100);

    if (fetchError) {
      console.error("Error fetching reminders:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${reminders?.length || 0} pending reminders to send`);

    const results = [];

    for (const reminder of reminders || []) {
      const phone = reminder.patient?.phone;
      if (!phone) {
        console.log(`No phone number for reminder ${reminder.id}`);
        continue;
      }

      console.log(`Sending reminder to ${phone}: ${reminder.message}`);

      const { success, error } = await sendSMS(phone, reminder.message);

      if (success) {
        // Update reminder status to sent
        await supabase
          .from("reminders")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("id", reminder.id);

        results.push({ id: reminder.id, status: "sent" });
        console.log(`Sent SMS reminder to ${reminder.patient.full_name}`);
      } else {
        // Update reminder status to failed
        await supabase
          .from("reminders")
          .update({
            status: "failed",
            error_message: error,
          })
          .eq("id", reminder.id);

        results.push({ id: reminder.id, status: "failed", error });
        console.error(`Failed to send reminder ${reminder.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} reminders`,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-reminders function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
