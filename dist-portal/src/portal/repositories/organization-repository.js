import { getSupabaseClient } from '../lib/supabase-client.js';

export const organizationRepository = {
  getById: (organizationId) => getSupabaseClient()
    .from('organizations')
    .select('id, name, slug, status, created_at, updated_at')
    .eq('id', organizationId)
    .maybeSingle()
};
