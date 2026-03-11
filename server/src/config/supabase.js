const { createClient } = require("@supabase/supabase-js");
const config = require("./index");

/**
 * Admin client — uses the service-role key.
 * Bypasses RLS. Use only in server-side services.
 */
const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  },
);

/**
 * Returns a per-request Supabase client scoped to the user's JWT.
 * Respects RLS policies — use for operations that should honour row access.
 */
function supabaseClient(accessToken) {
  return createClient(config.supabase.url, config.supabase.anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

module.exports = { supabaseAdmin, supabaseClient };
