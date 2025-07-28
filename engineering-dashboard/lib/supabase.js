import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabase = createClient(
  'https://zzukdaijrskkqbbeuzod.supabase.co',  // Replace with your Supabase URL
  'sb_publishable_SpCk2TICeBsUAKeQtunNJg_ijhLRmeZ'                 // Replace with your Supabase anon/public key
);

export default supabase;

