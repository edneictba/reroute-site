import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { validatePortalConfig } from '../core/config.js';

let supabaseClient = null;

export const getSupabaseClient = () => {
  const validation = validatePortalConfig();

  if (!validation.valid) {
    const error = new Error(`Configuracao do Supabase ausente: ${validation.missing.join(', ')}`);
    error.code = 'MISSING_SUPABASE_CONFIG';
    error.missing = validation.missing;
    throw error;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(validation.config.supabaseUrl, validation.config.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }

  return supabaseClient;
};
