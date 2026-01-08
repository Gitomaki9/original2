// supabase.js - USAR window.supabaseClient SOLAMENTE
const SUPABASE_URL = 'https://grchvnewfkakaqfkgbzy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyY2h2bmV3Zmtha2FxZmtnYnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMTk3NjAsImV4cCI6MjA4MTU5NTc2MH0.v8N-ATIXbR37rTNQ7KU9fW7e1_V-3neweTS6oljwciw';

// Solo crear si no existe
if (!window.supabaseClient && window.supabase) {
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('✅ Supabase configurado como window.supabaseClient');
}
