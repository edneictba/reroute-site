import { initAuth, signOut, subscribe } from '../providers/auth-provider.js';
import { clearUserContext, loadUserContext } from '../auth/user-context.js';
import { hasAllCapabilities } from '../services/authorization-service.js';

const loginPath = '/portal/login/';
const dashboardPath = '/portal/dashboard/';
const accessDeniedPath = '/portal/acesso-negado/';
const accessValidationTimeoutMs = 12000;

const withAccessTimeout = (promise, step) => {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(`Tempo limite excedido ao validar ${step}.`));
    }, accessValidationTimeoutMs);
  });

  return Promise.race([promise, timeout])
    .finally(() => window.clearTimeout(timeoutId));
};

export const getSafeReturnPath = (fallback = dashboardPath) => {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('returnTo');

  if (!requested) {
    return fallback;
  }

  try {
    const parsed = new URL(requested, window.location.origin);
    const isSameOrigin = parsed.origin === window.location.origin;
    const isPortalPath = parsed.pathname.startsWith('/portal/');
    const isAuthPage = ['/portal/login/', '/portal/recuperar-senha/', '/portal/redefinir-senha/'].includes(parsed.pathname);

    if (isSameOrigin && isPortalPath && !isAuthPage) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch (_error) {
    return fallback;
  }

  return fallback;
};

const buildLoginRedirect = () => {
  const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const params = new URLSearchParams();

  if (returnTo.startsWith('/portal/') && returnTo !== loginPath) {
    params.set('returnTo', returnTo);
  }

  const query = params.toString();
  return query ? `${loginPath}?${query}` : loginPath;
};

const setElementHidden = (selector, hidden) => {
  document.querySelectorAll(selector).forEach((element) => {
    element.hidden = hidden;
  });
};

const showAuthError = (message) => {
  const loading = document.querySelector('[data-auth-loading]');
  const errorShell = document.querySelector('[data-auth-error]');
  const errorTarget = document.querySelector('[data-auth-error-message]');

  if (loading) {
    loading.hidden = true;
  }

  if (errorShell) {
    errorShell.hidden = false;
  }

  if (errorTarget) {
    errorTarget.textContent = message;
  }
};

const buildAccessDeniedRedirect = (reason = 'not_authorized') => {
  const params = new URLSearchParams();
  params.set('reason', reason);
  return `${accessDeniedPath}?${params.toString()}`;
};

const hydrateUser = (user) => {
  const email = user?.email || 'Usuario autenticado';
  document.querySelectorAll('[data-user-email]').forEach((element) => {
    element.textContent = email;
  });
};

export const requireAuth = (authState) => Boolean(authState?.isAuthenticated && authState?.user);

export const requireProfile = (context) => Boolean(context?.profile);

export const requireActiveProfile = (context) => context?.profile?.status === 'active';

export const requireOrganization = (context) => context?.organization?.status === 'active';

export const requireWorkspace = (context) => Boolean(context?.activeWorkspace);

export const requireCapability = (context, capabilityKey) => context?.capabilities?.has(capabilityKey) === true;

export const requireCapabilities = (context, capabilityKeys = []) => hasAllCapabilities(context?.capabilities, capabilityKeys);

export const protectPrivatePage = async () => {
  setElementHidden('[data-private-content]', true);
  setElementHidden('[data-auth-loading]', false);

  try {
    const state = await withAccessTimeout(initAuth(), 'a sessão');

    if (state.authError) {
      showAuthError(state.authError);
      return;
    }

    if (!requireAuth(state)) {
      clearUserContext();
      window.location.replace(buildLoginRedirect());
      return;
    }

    const requiresContext = document.body.matches('[data-context-required="true"]');

    if (requiresContext) {
      const context = await withAccessTimeout(loadUserContext(state.user), 'o contexto do usuário');
      const requiredCapabilities = String(document.body.dataset.requiredCapabilities || '')
        .split(',')
        .map((capability) => capability.trim())
        .filter(Boolean);
      const hasRequiredCapabilities = requireCapabilities(context, requiredCapabilities);

      if (!context.isAuthorized || !hasRequiredCapabilities) {
        window.location.replace(buildAccessDeniedRedirect(context.deniedReason || 'missing_capability'));
        return;
      }
    }

    hydrateUser(state.user);
    setElementHidden('[data-auth-loading]', true);
    setElementHidden('[data-auth-error]', true);
    setElementHidden('[data-private-content]', false);

    subscribe((nextState) => {
      if (!nextState.isLoading && !nextState.isAuthenticated) {
        clearUserContext();
        window.location.replace(buildLoginRedirect());
        return;
      }

      if (nextState.user) {
        hydrateUser(nextState.user);
      }
    });
  } catch (error) {
    clearUserContext();
    showAuthError(error?.message || 'Não foi possível concluir a validação do acesso.');
  }
};

export const redirectAuthenticatedUser = async () => {
  const state = await initAuth();

  if (state.authError) {
    const message = document.querySelector('[data-login-message]');
    if (message) {
      message.classList.add('error');
      message.textContent = state.authError;
    }
    return;
  }

  if (state.isAuthenticated) {
    window.location.replace(getSafeReturnPath());
  }
};

export const bindLogout = () => {
  document.querySelectorAll('[data-logout]').forEach((button) => {
    button.addEventListener('click', async () => {
      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = 'Saindo...';

      const result = await signOut();

      if (!result.success) {
        button.disabled = false;
        button.textContent = originalText;
        showAuthError(result.error);
        return;
      }

      window.location.replace(loginPath);
    });
  });
};
