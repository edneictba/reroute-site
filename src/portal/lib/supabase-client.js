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
    const createClient = globalThis.supabase?.createClient;

    if (typeof createClient !== 'function') {
      const error = new Error('Nao foi possivel carregar o cliente Supabase do Portal.');
      error.code = 'SUPABASE_CLIENT_UNAVAILABLE';
      throw error;
    }

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
