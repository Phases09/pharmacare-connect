import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { fileContent, fileName } = await req.json();

    if (!fileContent || !fileName) {
      throw new Error("fileContent and fileName are required");
    }

    const prompt = `You are a data extraction assistant. Extract patient information from the following document content.

Return ONLY a valid JSON array of patient objects. Each patient should have these fields:
- "full_name" (string, required)
- "phone" (string, required - Ghana phone format)
- "age" (number or null)
- "medications" (array of objects, each with "name" (string), "duration" (string - number of days), "quantity" (string - dosage info))

If a field is missing, use null for age and empty array for medications. 
Try to infer medication duration in days if given in weeks/months.
Phone numbers should be in the format they appear, don't modify them.

IMPORTANT: Return ONLY the JSON array, no markdown, no explanation.

Document filename: ${fileName}
Document content:
${fileContent}`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI Gateway error [${response.status}]: ${errorText}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    // Parse the JSON from the AI response
    let patients;
    try {
      // Try to extract JSON array from response (may be wrapped in markdown)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        patients = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON array found in AI response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error(
        "Could not extract patient data from the file. Please ensure the file contains patient information in a readable format."
      );
    }

    // Validate the structure
    const validatedPatients = patients.map((p: any) => ({
      full_name: String(p.full_name || "").trim(),
      phone: String(p.phone || "").trim(),
      age: p.age ? Number(p.age) : null,
      medications: Array.isArray(p.medications)
        ? p.medications.map((m: any) => ({
            name: String(m.name || "").trim(),
            duration: String(m.duration || "").trim(),
            quantity: String(m.quantity || "").trim(),
          }))
        : [],
    })).filter((p: any) => p.full_name && p.phone);

    return new Response(
      JSON.stringify({ success: true, patients: validatedPatients }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Error parsing patient file:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
