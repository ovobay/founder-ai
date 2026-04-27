import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

async function getUser(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.replace("Bearer ", "");

  const {
    data: { user },
  } = await supabaseAdmin.auth.getUser(token);

  return user;
}

function systemPrompt() {
  return `
You are a senior full-stack engineer.

Your job:
Generate a COMPLETE SaaS project in MULTI-FILE FORMAT.

STRICT FORMAT:

FILE: app/page.tsx
<code>

FILE: app/api/hello/route.ts
<code>

FILE: lib/db.ts
<code>

RULES:
- Use Next.js App Router
- Use TypeScript
- Use Tailwind
- Include API routes
- Include simple DB layer
- Include auth placeholder
- Include Stripe placeholder
- No explanations
- ONLY FILE OUTPUT
`;
}

export async function POST(req: Request) {
  try {
    const user = await getUser(req);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { idea } = await req.json();

    const { data: usage } = await supabaseAdmin
      .from("usage_limits")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const plan = usage?.plan || "free";
    const generations = usage?.generations || 0;

    if (plan === "free" && generations >= 5) {
      return Response.json(
        { error: "Free limit reached", upgrade: true },
        { status: 403 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt() },
        { role: "user", content: idea },
      ],
    });

    const result = completion.choices[0].message.content || "";

    await supabaseAdmin.from("usage_limits").upsert(
      {
        user_id: user.id,
        generations: generations + 1,
        plan,
      },
      { onConflict: "user_id" }
    );

    return Response.json({ result });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}