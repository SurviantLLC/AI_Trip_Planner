"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSupabase = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Get Supabase URL and key from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables. Please check your .env file.');
    process.exit(1);
}
// Create Supabase client
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
// Helper function to initialize Supabase and check connection
const initSupabase = async () => {
    try {
        const { data, error } = await exports.supabase.from('conversations').select('count', { count: 'exact' }).limit(0);
        if (error) {
            throw new Error(`Supabase initialization error: ${error.message}`);
        }
        console.log('Supabase connected successfully');
        return true;
    }
    catch (error) {
        console.error('Failed to connect to Supabase:', error);
        return false;
    }
};
exports.initSupabase = initSupabase;
