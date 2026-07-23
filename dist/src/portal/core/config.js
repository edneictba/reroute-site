export const getPortalConfig = () => {
  const runtimeConfig = window.REROUTE_PORTAL_ENV || {};
  return {
    supabaseUrl: String(runtimeConfig.supabaseUrl || ''),
    supabaseAnonKey: String(runtimeConfig.supabaseAnonKey || ''),
    environment: String(runtimeConfig.environment || 'development')
  };
};

export const validatePortalConfig = () => {
  const config = getPortalConfig();
  const missing = [];

  if (!config.supabaseUrl) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_URL');
  }

  if (!config.supabaseAnonKey) {
    missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY ou SUPABASE_ANON_KEY');
  }

  return {
    valid: missing.length === 0,
    missing,
    config
  };
};
