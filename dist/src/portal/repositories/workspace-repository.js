import { getSupabaseClient } from '../lib/supabase-client.js';

export const workspaceRepository = {
  listMembershipsForProfile: (profileId) => getSupabaseClient()
    .from('workspace_members')
    .select(`
      status,
      joined_at,
      workspace:workspaces(
        id,
        organization_id,
        name,
        slug,
        description,
        status,
        display_order,
        created_at,
        updated_at
      )
    `)
    .eq('profile_id', profileId)
};
