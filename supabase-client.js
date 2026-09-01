/**
 * ============================================================================
 * EDUNOTES — SUPABASE CLIENT CONFIGURATION & ENGINE
 * Connects to Supabase PostgreSQL, Auth, Realtime, and Storage.
 * ============================================================================
 */

(function () {
  'use strict';

  // Environment / Runtime Configuration
  // Checks window.ENV, global variables, or runtime settings
  const getSupabaseConfig = () => {
    const env = window.ENV || {};
    return {
      url: env.SUPABASE_URL || window.NEXT_PUBLIC_SUPABASE_URL || localStorage.getItem('EDUNOTES_SUPABASE_URL') || '',
      anonKey: env.SUPABASE_ANON_KEY || window.NEXT_PUBLIC_SUPABASE_ANON_KEY || localStorage.getItem('EDUNOTES_SUPABASE_KEY') || ''
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
    isConfigured: () => Boolean(supabaseClient),
    reconfigure: (url, anonKey) => {
      if (url && anonKey) {
        localStorage.setItem('EDUNOTES_SUPABASE_URL', url);
        localStorage.setItem('EDUNOTES_SUPABASE_KEY', anonKey);
      }
      initSupabase();
      return Boolean(supabaseClient);
    }
  };

  initSupabase();
})();
