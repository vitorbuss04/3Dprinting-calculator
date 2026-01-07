import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vkhpkmlfimbacgmjvkiy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZraHBrbWxmaW1iYWNnbWp2a2l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3ODgwNzgsImV4cCI6MjA4MzM2NDA3OH0.NpnaisDPqCDfKWzdtl5v2S3WgSlgM39bvqN8Prq2Oe4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);