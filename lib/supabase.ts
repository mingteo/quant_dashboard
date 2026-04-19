import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Export instance supabase agar bisa dipanggil dari mana saja
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
