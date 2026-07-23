import { authRepository } from '../repositories/auth-repository.js';

const genericAuthMessage = 'Credenciais invalidas ou acesso nao autorizado.';
const recoveryMessage = 'Se existir uma conta vinculada a este e-mail, enviaremos as instrucoes para redefinir sua senha.';

export const normalizeAuthError = (error) => {
  if (!error) {
    return 'Falha temporaria de autenticacao. Tente novamente.';
  }

  if (error.code === 'MISSING_SUPABASE_CONFIG') {
    return error.message;
  }

  const message = String(error.message || '').toLowerCase();
  const status = Number(error.status || 0);

  if (message.includes('email not confirmed') || message.includes('not confirmed')) {
    return 'Conta ainda nao confirmada. Verifique sua caixa de entrada, Spam ou Lixo Eletronico.';
  }

  if (message.includes('too many') || message.includes('rate limit') || status === 429) {
    return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.';
  }

  if (message.includes('network') || message.includes('failed to fetch') || message.includes('load failed')) {
    return 'Falha de conexao. Verifique sua internet e tente novamente.';
  }

  if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
    return genericAuthMessage;
  }

  if (message.includes('expired') || message.includes('otp expired')) {
    return 'O link expirou. Solicite uma nova redefinicao de senha.';
  }

  if (message.includes('recovery') || message.includes('token') || message.includes('invalid')) {
    return 'Link de recuperacao invalido ou expirado. Solicite uma nova redefinicao.';
  }

  return 'Nao foi possivel concluir o acesso agora. Tente novamente em instantes.';
};

export const signIn = async (email, password) => {
  try {
    const { data, error } = await authRepository.signInWithPassword(email, password);

    if (error) {
      return { success: false, error: normalizeAuthError(error), data: null };
    }

    return { success: true, error: null, data };
  } catch (error) {
    return { success: false, error: normalizeAuthError(error), data: null };
  }
};

export const signOut = async () => {
  try {
    const { error } = await authRepository.signOut();

    if (error) {
      return { success: false, error: normalizeAuthError(error) };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: normalizeAuthError(error) };
  }
};

export const requestPasswordReset = async (email, redirectTo) => {
  try {
    const { error } = await authRepository.requestPasswordReset(email, redirectTo);

    if (error) {
      return { success: false, error: normalizeAuthError(error), message: recoveryMessage };
    }

    return { success: true, error: null, message: recoveryMessage };
  } catch (error) {
    return { success: false, error: normalizeAuthError(error), message: recoveryMessage };
  }
};

export const updatePassword = async (password) => {
  try {
    const { data, error } = await authRepository.updatePassword(password);

    if (error) {
      return { success: false, error: normalizeAuthError(error), data: null };
    }

    return { success: true, error: null, data };
  } catch (error) {
    return { success: false, error: normalizeAuthError(error), data: null };
  }
};

export const getSession = async () => {
  try {
    const { data, error } = await authRepository.getSession();

    if (error) {
      return { session: null, error: normalizeAuthError(error) };
    }

    return { session: data.session || null, error: null };
  } catch (error) {
    return { session: null, error: normalizeAuthError(error) };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data, error } = await authRepository.getCurrentUser();

    if (error) {
      return { user: null, error: normalizeAuthError(error) };
    }

    return { user: data.user || null, error: null };
  } catch (error) {
    return { user: null, error: normalizeAuthError(error) };
  }
};

export const onAuthStateChange = (callback) => {
  return authRepository.onAuthStateChange(callback);
};

export const refreshSession = async () => {
  try {
    const { data, error } = await authRepository.refreshSession();

    if (error) {
      return { session: null, error: normalizeAuthError(error), data: null };
    }

    return { session: data.session || null, error: null, data };
  } catch (error) {
    return { session: null, error: normalizeAuthError(error), data: null };
  }
};
