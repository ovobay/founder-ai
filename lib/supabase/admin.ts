import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AuthenticatedUser = {
  id: string;
  email?: string;
};

export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.");
  }

  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY environment variable."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export function getBearerToken(request?: Request) {
  if (!request) return null;

  const authorization = request.headers.get("authorization");

  if (!authorization) return null;

  const [scheme, token] = authorization.split(" ");

  if (scheme?.toLowerCase() !== "bearer") return null;
  if (!token) return null;

  return token;
}

export async function getAuthenticatedUser(
  request?: Request
): Promise<AuthenticatedUser | null> {
  const bearerToken = getBearerToken(request);

  if (bearerToken) {
    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin.auth.getUser(bearerToken);

    if (!error && data.user) {
      return {
        id: data.user.id,
        email: data.user.email ?? undefined,
      };
    }
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email ?? undefined,
  };
}

export function jsonError(message: string, status = 400) {
  return Response.json(
    {
      ok: false,
      error: message,
    },
    {
      status,
    }
  );
}

export function jsonOk<T>(data: T, status = 200) {
  return Response.json(
    {
      ok: true,
      data,
    },
    {
      status,
    }
  );
}