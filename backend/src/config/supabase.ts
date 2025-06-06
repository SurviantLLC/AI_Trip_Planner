import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Get Supabase URL and key from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  process.exit(1);
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to initialize Supabase and check connection
export const initSupabase = async () => {
  try {
    const { data, error } = await supabase.from('conversations').select('count', { count: 'exact' }).limit(0);
    
    if (error) {
      throw new Error(`Supabase initialization error: ${error.message}`);
    }
    
    console.log('Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
    return false;
  }
};
