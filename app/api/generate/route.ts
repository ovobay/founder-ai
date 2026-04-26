import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Supabase (server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { idea, mode, user_id } = await req.json();

    // Basic validation
    if (!idea) {
      return Response.json({ error: "Missing idea" }, { status: 400 });
    }

    if (!user_id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get usage record
    let { data: usage, error: usageError } = await supabase
      .from("usage_limits")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle();

    if (usageError) {
      return Response.json({ error: usageError.message }, { status: 500 });
    }

    // Create usage record if not exists
    if (!usage) {
      const { data: newUsage, error: createError } = await supabase
        .from("usage_limits")
        .insert({
          user_id,
          generations: 0,
          plan: "free",
        })
        .select()
        .single();

      if (createError) {
        return Response.json({ error: createError.message }, { status: 500 });
      }

      usage = newUsage;
    }

    // 🚨 LIMIT LOGIC (THIS is what you were looking for)
    if (usage.plan === "free" && usage.generations >= 5) {
      return Response.json(
        { error: "Free limit reached. Upgrade required." },
        { status: 403 }
      );
    }

    // Call OpenAI
    const response = await openai.responses.create({
      model: "gpt-5.4-mini",
      input: idea,
    });

    const output = response.output_text;

    if (!output) {
      return Response.json(
        { error: "OpenAI returned no output." },
        { status: 500 }
      );
    }

    // Increment usage AFTER success
    const { error: updateError } = await supabase
      .from("usage_limits")
      .update({
        generations: usage.generations + 1,
      })
      .eq("user_id", user_id);

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    return Response.json({
      result: output,
      remaining:
        usage.plan === "free" ? 5 - (usage.generations + 1) : "unlimited",
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}