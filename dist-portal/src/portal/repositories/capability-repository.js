import { getSupabaseClient } from '../lib/supabase-client.js';

export const capabilityRepository = {
  listForRoleIds: (roleIds) => getSupabaseClient()
    .from('role_capabilities')
    .select(`
      granted,
      capability:capabilities(
        id,
        key,
        module,
        action,
        description
      )
    `)
    .in('role_id', roleIds)
};
