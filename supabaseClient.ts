import { createClient } from "@supabase/supabase-js";

// Access environment variables.
// We use simple assignment to allow the build-time substitution to work cleanly.
const supabaseUrl = "https://jajnueotoourhmfupepb.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;
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
export const uploadFile = async (
  file: Blob | File,
  bucket: string = "public-files",
  path?: string,
): Promise<string | null> => {
  if (!supabase) return null;

  try {
    const fileName = path ||
      `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const { data, error } = await supabase.storage.from(bucket).upload(
      fileName,
      file,
      {
        cacheControl: "3600",
        upsert: false,
      },
    );

    if (error) {
      console.warn(
        `Supabase Storage upload failed (Bucket: ${bucket}):`,
        error.message,
      );
      return null;
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(
      data.path,
    );
    return urlData.publicUrl;
  } catch (err) {
    console.warn("Unexpected error during file upload:", err);
    return null;
  }
};

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
