import { getSupabaseClient } from '../lib/supabase-client.js';

export const investorsRepository = {
  listLatestPublishedForProfile: (scope, profileId) => getSupabaseClient()
    .from('portal_investors')
    .select('profile_id, payload, version, published_at, updated_at')
    .eq('organization_id', scope.organizationId)
    .eq('workspace_id', scope.workspaceId)
    .eq('publication_status', 'published')
    .or(`profile_id.eq.${profileId},profile_id.is.null`)
    .order('published_at', { ascending: false })
    .limit(2)
};
