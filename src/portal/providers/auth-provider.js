import {
  getCurrentUser,
  getSession,
  onAuthStateChange,
  refreshSession as authRefreshSession,
  signIn as authSignIn,
  signOut as authSignOut
} from '../services/auth-service.js';

const state = {
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  authError: null
};

const listeners = new Set();
let initialized = false;
let initPromise = null;
let authSubscription = null;

const setState = (nextState) => {
  Object.assign(state, nextState);
  listeners.forEach((listener) => listener({ ...state }));
};

const setSessionState = (session, authError = null) => {
  setState({
    session,
    user: session?.user || null,
    isAuthenticated: Boolean(session?.user),
    isLoading: false,
    authError
  });
};

export const getAuthState = () => ({ ...state });

export const subscribe = (listener) => {
  listeners.add(listener);
  listener({ ...state });

  return () => {
    listeners.delete(listener);
  };
};

export const initAuth = async () => {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    setState({ isLoading: true, authError: null });

    const sessionResult = await getSession();

    if (sessionResult.error) {
      setState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        authError: sessionResult.error
      });
      return getAuthState();
    }

    setSessionState(sessionResult.session);

    if (!initialized) {
      initialized = true;

      try {
        const { data } = onAuthStateChange((_event, session) => {
          setSessionState(session);
        });

        authSubscription = data?.subscription || null;
      } catch (error) {
        setState({
          authError: error.message || 'Nao foi possivel observar a sessao.',
          isLoading: false
        });
      }
    }

    return getAuthState();
  })();

  return initPromise;
};

export const signIn = async (email, password) => {
  setState({ isLoading: true, authError: null });

  const result = await authSignIn(email, password);

  if (!result.success) {
    setState({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      authError: result.error
    });
    return result;
  }

  const session = result.data?.session || null;
  setSessionState(session);

  if (!session?.user) {
    const userResult = await getCurrentUser();
    setState({
      user: userResult.user,
      isAuthenticated: Boolean(userResult.user),
      authError: userResult.error,
      isLoading: false
    });
  }

  return result;
};

export const signOut = async () => {
  setState({ isLoading: true, authError: null });

  const result = await authSignOut();

  setState({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: false,
    authError: result.error
  });

  return result;
};

export const refreshSession = async () => {
  setState({ isLoading: true, authError: null });

  const result = await authRefreshSession();

  if (result.error) {
    setState({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      authError: result.error
    });
    return result;
  }

  setSessionState(result.session);
  return result;
};

export const destroyAuth = () => {
  authSubscription?.unsubscribe?.();
  authSubscription = null;
  initialized = false;
  initPromise = null;
  listeners.clear();
};
