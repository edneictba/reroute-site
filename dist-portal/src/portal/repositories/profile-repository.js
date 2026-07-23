import { getSupabaseClient } from '../lib/supabase-client.js';

export const profileRepository = {
  getByAuthUserId: (authUserId) => getSupabaseClient()
    .from('profiles')
    .select('id, organization_id, display_name, full_name, email, phone, avatar_url, status, preferred_language, timezone, created_at, updated_at')
    .eq('id', authUserId)
    .maybeSingle()
};
