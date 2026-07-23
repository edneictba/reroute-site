import { getSupabaseClient } from '../lib/supabase-client.js';

export const authRepository = {
  getSession: () => getSupabaseClient().auth.getSession(),
  getCurrentUser: () => getSupabaseClient().auth.getUser(),
  signInWithPassword: (email, password) => getSupabaseClient().auth.signInWithPassword({ email, password }),
  signOut: () => getSupabaseClient().auth.signOut(),
  onAuthStateChange: (callback) => getSupabaseClient().auth.onAuthStateChange(callback),
  requestPasswordReset: (email, redirectTo) => getSupabaseClient().auth.resetPasswordForEmail(email, { redirectTo }),
  updatePassword: (password) => getSupabaseClient().auth.updateUser({ password }),
  refreshSession: () => getSupabaseClient().auth.refreshSession()
};
