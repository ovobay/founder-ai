// Secure AI generation route.
// The frontend sends a Supabase access token.
// The backend verifies the token, gets the real user, checks usage, then generates.

import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get the real logged-in user from Authorization: Bearer <token>
async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}

// POST: Generate AI output
export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { idea, mode } = await req.json();

    if (!idea) {
      return Response.json({ error: "Missing idea." }, { status: 400 });
    }

    // Load current usage row
    let { data: usage, error: usageError } = await supabaseAdmin
      .from("usage_limits")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (usageError) {
      return Response.json({ error: usageError.message }, { status: 500 });
    }

    // Create usage row if it does not exist
    if (!usage) {
      const { data: newUsage, error: createUsageError } = await supabaseAdmin
        .from("usage_limits")
        .insert({
          user_id: user.id,
          generations: 0,
          plan: "free",
        })
        .select("*")
        .single();

      if (createUsageError) {
        return Response.json({ error: createUsageError.message }, { status: 500 });
      }

      usage = newUsage;
    }

    // Free users get 5 generations
    if (usage.plan === "free" && usage.generations >= 5) {
      return Response.json(
        { error: "Free limit reached. Upgrade required." },
        { status: 403 }
      );
    }

    const selectedMode = mode || "full";

    const prompt = `
You are Founder AI, a SaaS operator.

MODE: ${selectedMode}

You MUST follow all rules below.

If any rule is broken, correct it before returning the answer.

HARD CONSTRAINTS:
- NEVER recommend microservices for MVP
- ALWAYS use modular monolith architecture
- ALWAYS include multi-tenant SaaS structure where relevant:
  organisations, organisation_members, roles, subscriptions
- NEVER include password storage
- ALWAYS assume auth provider such as Supabase, Clerk, or Auth0
- Enterprise pricing MUST be "Custom" or "Talk to Sales", NEVER a fixed price
- Marketing MUST include ONE primary channel AND a real example
- Sales MUST include:
  - Ideal Customer Profile
  - Example cold message
  - Follow-up sequence: Day 1, Day 3, Day 7

MODE RULES:
If mode is "pricing": ONLY output pricing structure.
If mode is "frontend": ONLY output UI/UX structure.
If mode is "backend": ONLY output database + API design.
If mode is "marketing": ONLY output marketing strategy.
If mode is "sales": ONLY output sales strategy.

If mode is "full", output these sections in order:
1. Product Overview
2. Target Users
3. Core Workflow
4. Core Features
5. Frontend Structure
6. Backend Architecture
7. Database Tables
8. API Endpoints
9. Pricing Model
10. Marketing Plan
11. Sales Strategy
12. Launch Checklist

USER TASK:
${idea}

Do internal verification silently.
Do not include a Verification section.
No fluff.
`;

    const response = await openai.responses.create({
      model: "gpt-5.4-mini",
      input: prompt,
    });

    const output = response.output_text;

    if (!output) {
      return Response.json(
        { error: "OpenAI returned no output." },
        { status: 500 }
      );
    }

    // Count successful generations only
    const { error: updateError } = await supabaseAdmin
      .from("usage_limits")
      .update({
        generations: usage.generations + 1,
      })
      .eq("user_id", user.id);

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    return Response.json({
      result: output,
      plan: usage.plan,
      remaining:
        usage.plan === "pro" ? "unlimited" : Math.max(0, 5 - (usage.generations + 1)),
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}