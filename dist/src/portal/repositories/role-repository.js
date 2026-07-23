import { getSupabaseClient } from '../lib/supabase-client.js';

export const roleRepository = {
  listUserRolesForProfile: (profileId) => getSupabaseClient()
    .from('user_roles')
    .select(`
      status,
      assigned_at,
      expires_at,
      workspace_id,
      role:roles(
        id,
        organization_id,
        name,
        slug,
        description,
        is_system_role,
        status
      )
    `)
    .eq('profile_id', profileId)
};
