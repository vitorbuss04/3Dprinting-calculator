import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://knmjazaxqjtefkzqrqla.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubWphemF4cWp0ZWZrenFycWxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0ODY1MDQsImV4cCI6MjA5MTA2MjUwNH0.MM93ME5V0efJRwArwET653MHQY8kN_K8GQ82fNaudB0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);