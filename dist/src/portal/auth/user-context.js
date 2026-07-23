import {
  canAccessWorkspace as canAccessWorkspaceRef,
  hasAllCapabilities as contextHasAllCapabilities,
  hasAnyCapability as contextHasAnyCapability,
  hasCapability as contextHasCapability
} from '../services/authorization-service.js';
import { contextDeniedMessages, loadRealUserContext, normalizeContextError } from '../services/user-context-service.js';

const activeWorkspaceStorageKey = 'reroute.portal.activeWorkspace';

const initialState = {
  authUser: null,
  profile: null,
  organization: null,
  workspaces: [],
  roles: [],
  capabilities: new Set(),
  activeWorkspace: null,
  loading: false,
  error: null,
  deniedReason: null,
  isAuthenticated: false,
  isAuthorized: false,
  refreshedAt: null,
  loadedAt: null
};

let state = { ...initialState, capabilities: new Set() };
const listeners = new Set();

const emit = () => {
  const snapshot = getUserContext();
  listeners.forEach((listener) => listener(snapshot));
};

const setState = (nextState) => {
  state = {
    ...state,
    ...nextState,
    capabilities: nextState.capabilities instanceof Set ? new Set(nextState.capabilities) : state.capabilities
  };
  emit();
};

const getStoredWorkspaceRef = () => {
  try {
    return window.localStorage?.getItem(activeWorkspaceStorageKey) || '';
  } catch (_error) {
    return '';
  }
};

const setStoredWorkspaceRef = (workspaceRef) => {
  try {
    if (workspaceRef) {
      window.localStorage?.setItem(activeWorkspaceStorageKey, workspaceRef);
    }
  } catch (_error) {
    // Storage is a convenience only. Authorization never depends on it.
  }
};

export const getUserContext = () => ({
  ...state,
  capabilities: new Set(state.capabilities)
});

export const subscribeUserContext = (listener) => {
  listeners.add(listener);
  listener(getUserContext());

  return () => {
    listeners.delete(listener);
  };
};

export const clearUserContext = () => {
  state = { ...initialState, capabilities: new Set() };
  emit();
};

export const hasRole = (roleSlug) => state.roles.some((role) => role.slug === roleSlug);

export const hasCapability = (capabilityKey) => contextHasCapability(state.capabilities, capabilityKey);

export const hasAnyCapability = (capabilityKeys) => contextHasAnyCapability(state.capabilities, capabilityKeys);

export const hasAllCapabilities = (capabilityKeys) => contextHasAllCapabilities(state.capabilities, capabilityKeys);

export const canAccessWorkspace = (workspaceRef) => canAccessWorkspaceRef(state.workspaces, workspaceRef);

export const getActiveWorkspace = () => state.activeWorkspace;

export const setActiveWorkspace = (workspaceRef) => {
  const workspace = state.workspaces.find((item) => item.slug === workspaceRef || item.id === workspaceRef);

  if (!workspace) {
    return getUserContext();
  }

  setStoredWorkspaceRef(workspace.slug);
  setState({ activeWorkspace: workspace });
  return getUserContext();
};

const setDeniedContext = (authUser, result) => {
  const context = result.context || {};
  setState({
    authUser,
    profile: context.profile || null,
    organization: context.organization || null,
    workspaces: context.workspaces || [],
    roles: context.roles || [],
    capabilities: context.capabilities instanceof Set ? context.capabilities : new Set(),
    activeWorkspace: context.activeWorkspace || null,
    loading: false,
    error: result.message || contextDeniedMessages[result.reason] || contextDeniedMessages.context_error,
    deniedReason: result.reason || 'context_error',
    isAuthenticated: Boolean(authUser?.id),
    isAuthorized: false,
    refreshedAt: null,
    loadedAt: null
  });
};

export const loadUserContext = async (authUser) => {
  clearUserContext();

  if (!authUser?.id) {
    setDeniedContext(null, {
      reason: 'session_expired',
      message: contextDeniedMessages.session_expired
    });
    return getUserContext();
  }

  setState({ authUser, loading: true, isAuthenticated: true });

  try {
    const result = await loadRealUserContext(authUser, {
      storedWorkspaceRef: getStoredWorkspaceRef()
    });

    if (!result.success) {
      setDeniedContext(authUser, result);
      return getUserContext();
    }

    const nextContext = result.context;

    if (nextContext.activeWorkspace) {
      setStoredWorkspaceRef(nextContext.activeWorkspace.slug);
    }

    setState(nextContext);
    return getUserContext();
  } catch (error) {
    const normalized = normalizeContextError(error);
    setState({
      authUser,
      loading: false,
      error: normalized.message,
      deniedReason: normalized.reason,
      isAuthenticated: Boolean(authUser?.id),
      isAuthorized: false
    });
    return getUserContext();
  }
};

export const refreshUserContext = async () => loadUserContext(state.authUser);
