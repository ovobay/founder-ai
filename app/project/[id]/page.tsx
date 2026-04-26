// Import Supabase client so this server page can read from Supabase
import { createClient } from "@supabase/supabase-js";

// Create Supabase client using server-side environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// This page loads one saved project using the ID from the URL
export default async function ProjectPage({
  params,
}: {
  // Next.js 16 can treat params as async, so we handle it safely
  params: Promise<{ id: string }>;
}) {
  // Get the project ID from the URL
  const { id } = await params;

  // Ask Supabase for the project with this exact ID
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  // If Supabase cannot find the project, show a helpful debug message
  if (!data || error) {
    return (
      <main className="min-h-screen bg-white px-6 py-10 text-black">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-bold">Project not found</h1>

          <p className="mt-3 text-gray-600">
            No project was found for this ID:
          </p>

          <pre className="mt-4 rounded-xl bg-gray-100 p-4 text-sm">
            {id}
          </pre>

          {error && (
            <pre className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error.message}
            </pre>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-black">
      <div className="mx-auto max-w-4xl">
        {/* Project title */}
        <h1 className="text-3xl font-bold">
          {data.title || "Untitled Project"}
        </h1>

        {/* Original idea */}
        <p className="mt-2 text-gray-500">{data.idea}</p>

        {/* Full AI output */}
        <div className="mt-6 whitespace-pre-wrap text-sm leading-6">
          {data.result}
        </div>
      </div>
    </main>
  );
}