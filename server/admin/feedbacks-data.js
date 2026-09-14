const { serviceRoleRequest } = require('./admin-auth');

const TYPES = ['sugestao', 'problema', 'elogio', 'outro'];
const STATUSES = ['novo', 'em_analise', 'resolvido'];

const getFeedbacks = async (fetchImpl = fetch) => {
  const feedbackResponse = await serviceRoleRequest(
    '/rest/v1/feedbacks?select=id,auth_user_id,tipo,mensagem,nota,rota,app_version,status,created_at&order=created_at.desc&limit=1000',
    { method: 'GET' }, fetchImpl
  );
  if (!feedbackResponse.ok) return null;
  const feedbacks = await feedbackResponse.json();
  if (!Array.isArray(feedbacks)) return null;

  const userIds = [...new Set(feedbacks.map((item) => item.auth_user_id).filter(Boolean))];
  const profiles = new Map();
  if (userIds.length) {
    const profileFilter = userIds.map((id) => `"${String(id).replaceAll('"', '')}"`).join(',');
    const profileResponse = await serviceRoleRequest(
      `/rest/v1/profiles?id=in.(${profileFilter})&select=id,display_name,full_name,email`,
      { method: 'GET' }, fetchImpl
    );
    if (profileResponse.ok) {
      for (const profile of await profileResponse.json()) profiles.set(profile.id, profile);
    }
  }

  const users = new Map();
  await Promise.all(userIds.map(async (id) => {
    try {
      const response = await serviceRoleRequest(`/auth/v1/admin/users/${encodeURIComponent(id)}`, { method: 'GET' }, fetchImpl);
      if (response.ok) {
        const user = await response.json();
        users.set(id, { email: user.email || '', name: user.user_metadata?.full_name || user.user_metadata?.name || '' });
      }
    } catch { /* profile/id fallback remains available */ }
  }));

  return feedbacks.map((feedback) => {
    const profile = profiles.get(feedback.auth_user_id) || {};
    const authUser = users.get(feedback.auth_user_id) || {};
    return {
      ...feedback,
      name: profile.display_name || profile.full_name || authUser.name || '',
      email: profile.email || authUser.email || '',
      auth_user_id: feedback.auth_user_id || ''
    };
  });
};

const updateFeedbackStatus = async (id, status, fetchImpl = fetch) => {
  if (!/^[0-9a-f-]{36}$/i.test(String(id || '')) || !STATUSES.includes(status)) return false;
  const response = await serviceRoleRequest(`/rest/v1/feedbacks?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ status })
  }, fetchImpl);
  return response.ok;
};

module.exports = { getFeedbacks, updateFeedbackStatus, TYPES, STATUSES };
