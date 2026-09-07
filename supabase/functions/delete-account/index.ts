// supabase/functions/delete-account/index.ts
// Deno Edge Function — deletes the calling user's account entirely.
// Called from contexts/AuthContext.tsx via supabase.functions.invoke,
// which forwards the caller's own JWT in the Authorization header.
//
// Uses the service-role key (only available server-side, set as a
// Supabase secret — see deploy notes below) because deleting an auth
// user requires admin privileges that must never live in client code.
//
// Deploy:
//   supabase functions deploy delete-account
//   supabase secrets set SUPABASE_URL=https://<project>.supabase.co
//   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service role key, from Project Settings > API>
// (SUPABASE_URL/SERVICE_ROLE_KEY may already be auto-injected as
// project secrets in newer Supabase projects — check `supabase secrets list`
// before setting them manually.)

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401 });
  }

  // A client scoped to the caller's own JWT — used only to verify who
  // is asking. Never used to perform the deletion itself.
  const callerClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await callerClient.auth.getUser();

  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid or expired session' }), { status: 401 });
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Cloud progress first: the FK's ON DELETE CASCADE would clean this
  // up too, but doing it explicitly means a failure here stops the
  // deletion instead of silently racing it.
  const { error: progressError } = await adminClient.from('user_progress').delete().eq('user_id', user.id);
  if (progressError) {
    return new Response(JSON.stringify({ error: progressError.message }), { status: 500 });
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
