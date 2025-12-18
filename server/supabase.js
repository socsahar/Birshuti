// ==========================================
// Supabase Client Configuration
// ==========================================
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Check your .env file.');
}

// Client for regular operations (uses RLS)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for privileged operations (bypasses RLS)
const supabaseAdmin = supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

module.exports = {
    supabase,
    supabaseAdmin
};
