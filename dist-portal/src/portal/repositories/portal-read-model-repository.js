import { getSupabaseClient } from '../lib/supabase-client.js';

const publishedColumns = 'payload, version, published_at, updated_at';

export const createPortalReadModelRepository = (table) => ({
  getLatestPublished: (scope) => getSupabaseClient()
    .from(table)
    .select(publishedColumns)
    .eq('organization_id', scope.organizationId)
    .eq('workspace_id', scope.workspaceId)
    .eq('publication_status', 'published')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle()
});
