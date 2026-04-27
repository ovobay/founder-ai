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

function getSystemPrompt(mode: string) {
  switch (mode) {
    case "web":
      return `
You are a senior web developer.

Output:
- Full website structure
- Pages
- Components
- Tailwind + Next.js code
- File structure
- Deployment steps

Return REAL code blocks.
`;

    case "app":
      return `
You are a senior full-stack engineer.

Output:
- Full SaaS architecture
- Database schema
- API routes
- Auth
- Stripe integration
- Frontend pages
- Folder structure
- Full code snippets

Be practical and production-ready.
`;

    case "shopify":
      return `
You are a Shopify expert.

Output:
- Store niche
- Product strategy
- Theme structure
- Sections
- Apps needed
- SEO structure
- Launch checklist
`;

    case "marketing":
      return `
You are a growth marketer.

Output:
- ICP
- Offer
- Channels
- Campaign plan
- Ad copy
- Email sequence
`;

    default:
      return `You are a startup operator. Give a structured plan.`;
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUser(req);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { idea, mode } = await req.json();

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
        { role: "system", content: getSystemPrompt(mode) },
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