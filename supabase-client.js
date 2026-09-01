/**
 * ============================================================================
 * EDUNOTES — SUPABASE CLIENT CONFIGURATION & ENGINE
 * Connects to Supabase PostgreSQL, Auth, Realtime, and Storage.
 * ============================================================================
 */

(function () {
  'use strict';

  // Environment / Runtime Configuration
  // Reads from deployment environment or global window config
  const getSupabaseConfig = () => {
    const env = window.ENV || {};
    return {
      url: env.SUPABASE_URL || window.NEXT_PUBLIC_SUPABASE_URL || window.SUPABASE_URL || '',
      anonKey: env.SUPABASE_ANON_KEY || window.NEXT_PUBLIC_SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY || ''
    };
  };

  let supabaseClient = null;

  function initSupabase() {
    const { url, anonKey } = getSupabaseConfig();
    if (window.supabase && url && anonKey) {
      try {
        supabaseClient = window.supabase.createClient(url, anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        });
        console.log('✓ Supabase Production Client initialized successfully.');
      } catch (err) {
        console.warn('Supabase initialization error:', err);
        supabaseClient = null;
      }
    } else {
      supabaseClient = null;
    }
  }

  window.EduNotesSupabase = {
    getClient: () => supabaseClient,
    isConfigured: () => Boolean(supabaseClient)
  };

  initSupabase();
})();
