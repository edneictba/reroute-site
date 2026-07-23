export const createProfile = (record) => ({
  id: record.id,
  organizationId: record.organizationId,
  displayName: record.displayName,
  fullName: record.fullName,
  email: record.email,
  phone: record.phone,
  avatarUrl: record.avatarUrl,
  status: record.status,
  preferredLanguage: record.preferredLanguage,
  timezone: record.timezone,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt
});

export const createOrganization = (record) => ({
  id: record.id,
  name: record.name,
  slug: record.slug,
  status: record.status,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt
});

export const createWorkspace = (record) => ({
  id: record.id,
  organizationId: record.organizationId,
  name: record.name,
  slug: record.slug,
  description: record.description,
  status: record.status,
  displayOrder: record.displayOrder,
  membershipStatus: record.membershipStatus,
  joinedAt: record.joinedAt,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt
});

export const createRole = (record) => ({
  id: record.id,
  organizationId: record.organizationId,
  name: record.name,
  slug: record.slug,
  description: record.description,
  isSystemRole: record.isSystemRole,
  status: record.status,
  workspaceId: record.workspaceId,
  assignedAt: record.assignedAt,
  expiresAt: record.expiresAt
});

export const createCapability = (record) => ({
  id: record.id,
  key: record.key,
  module: record.module,
  action: record.action,
  description: record.description,
  granted: record.granted
});

export const createUserContext = (record) => ({
  authUser: record.authUser,
  profile: record.profile,
  organization: record.organization,
  workspaces: record.workspaces,
  roles: record.roles,
  capabilities: new Set(record.capabilities),
  activeWorkspace: record.activeWorkspace,
  loading: false,
  error: null,
  deniedReason: null,
  isAuthenticated: Boolean(record.authUser),
  isAuthorized: Boolean(record.isAuthorized),
  refreshedAt: record.refreshedAt,
  loadedAt: record.refreshedAt
});
