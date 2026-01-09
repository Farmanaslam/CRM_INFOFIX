import { createClient } from "@supabase/supabase-js";

// Access environment variables.
// We use simple assignment to allow the build-time substitution to work cleanly.
const supabaseUrl = "https://jajnueotoourhmfupepb.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impham51ZW90b291cmhtZnVwZXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MjA3MzgsImV4cCI6MjA4MzA5NjczOH0.GR1X4q2JSZo6e7EnZkhIkFsucXheBE6DmbfCczeg-Ek";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impham51ZW90b291cmhtZnVwZXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzUyMDczOCwiZXhwIjoyMDgzMDk2NzM4fQ.GrSuoMWlE59DErcOBtGrsSkYesp-ThJIhey4QKHp3U4";
// Boolean check to verify configuration is present
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// Admin client (for admin operations - server-side only)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
