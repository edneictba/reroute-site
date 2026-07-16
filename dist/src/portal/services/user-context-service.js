import { CapabilityDTO, OrganizationDTO, ProfileDTO, RoleDTO, UserContextDTO, WorkspaceDTO } from '../dtos/portal-dtos.js';
import { capabilityRepository } from '../repositories/capability-repository.js';
import { organizationRepository } from '../repositories/organization-repository.js';
import { profileRepository } from '../repositories/profile-repository.js';
import { roleRepository } from '../repositories/role-repository.js';
import { workspaceRepository } from '../repositories/workspace-repository.js';
import { getEffectiveCapabilities, hasAllCapabilities } from './authorization-service.js';

export const contextDeniedMessages = {
  missing_profile: 'Seu acesso ainda não foi configurado pela administração do REROUTE.',
  profile_invited: 'Seu convite ainda precisa ser ativado pela administração do REROUTE.',
  profile_suspended: 'Seu acesso ao Portal está temporariamente suspenso.',
  profile_disabled: 'Seu acesso ao Portal está desativado.',
  organization_missing: 'A organização vinculada ao seu acesso não está disponível.',
  organization_inactive: 'A organização vinculada ao seu acesso não está ativa.',
  no_workspace: 'Nenhum workspace ativo foi liberado para o seu acesso.',
  no_role: 'Nenhuma role ativa foi liberada para o seu acesso.',
  missing_capability: 'As permissões necessárias para acessar o Portal ainda não foram liberadas.',
  session_expired: 'Sua sessão expirou. Acesse novamente para continuar.',
  portal_not_configured: 'A estrutura de autorização do Portal ainda não está disponível neste ambiente.',
  context_error: 'Não foi possível carregar seu contexto de acesso.'
};

export const normalizeContextError = (error) => {
  const message = String(error?.message || '').toLowerCase();

  if (message.includes('does not exist') || message.includes('schema cache') || message.includes('relation')) {
    return {
      reason: 'portal_not_configured',
      message: contextDeniedMessages.portal_not_configured
    };
  }

  if (message.includes('failed to fetch') || message.includes('network')) {
    return {
      reason: 'network_error',
      message: 'Falha de rede ao carregar seu contexto de acesso.'
    };
  }

  return {
    reason: 'context_error',
    message: contextDeniedMessages.context_error
  };
};

const isActive = (record) => record?.status === 'active';

const isRoleActive = (role) => {
  if (role?.status !== 'active') {
    return false;
  }

  if (!role.expiresAt) {
    return true;
  }

  return new Date(role.expiresAt).getTime() > Date.now();
};

const filterActiveWorkspaces = (memberships, organizationId) => memberships
  .map(WorkspaceDTO.fromMembershipRecord)
  .filter(Boolean)
  .filter((workspace) => workspace.organizationId === organizationId)
  .filter((workspace) => workspace.status === 'active' && workspace.membershipStatus === 'active')
  .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

const filterActiveRoles = (userRoles, organizationId, workspaces) => {
  const workspaceIds = new Set(workspaces.map((workspace) => workspace.id));

  return userRoles
    .map(RoleDTO.fromUserRoleRecord)
    .filter(Boolean)
    .filter(isRoleActive)
    .filter((role) => role.organizationId === organizationId)
    .filter((role) => !role.workspaceId || workspaceIds.has(role.workspaceId));
};

const pickWorkspaceByStoredPreference = (workspaces, storedWorkspaceRef) => {
  if (!storedWorkspaceRef) {
    return null;
  }

  return workspaces.find((workspace) => workspace.slug === storedWorkspaceRef || workspace.id === storedWorkspaceRef) || null;
};

const pickWorkspaceByRole = (workspaces, roles) => {
  const roleWithWorkspace = roles.find((role) => role.workspaceId && workspaces.some((workspace) => workspace.id === role.workspaceId));

  if (roleWithWorkspace) {
    return workspaces.find((workspace) => workspace.id === roleWithWorkspace.workspaceId);
  }

  const roleSlugs = new Set(roles.map((role) => role.slug));
  const preferredSlug = roleSlugs.has('investor')
    ? 'investor'
    : (roleSlugs.has('admin') || roleSlugs.has('super_admin') ? 'admin' : '');

  return workspaces.find((workspace) => workspace.slug === preferredSlug) || null;
};

export const resolveActiveWorkspace = (workspaces, roles, storedWorkspaceRef) => (
  pickWorkspaceByStoredPreference(workspaces, storedWorkspaceRef)
  || pickWorkspaceByRole(workspaces, roles)
  || workspaces[0]
  || null
);

const denied = (reason, partialContext = {}) => ({
  success: false,
  reason,
  message: contextDeniedMessages[reason] || contextDeniedMessages.context_error,
  context: partialContext
});

export const loadRealUserContext = async (authUser, options = {}) => {
  if (!authUser?.id) {
    return denied('session_expired', { authUser: null });
  }

  const { data: profileRecord, error: profileError } = await profileRepository.getByAuthUserId(authUser.id);

  if (profileError) {
    throw profileError;
  }

  const profile = ProfileDTO.fromRecord(profileRecord);

  if (!profile) {
    return denied('missing_profile', { authUser });
  }

  if (profile.status !== 'active') {
    return denied(`profile_${profile.status || 'disabled'}`, { authUser, profile });
  }

  const { data: organizationRecord, error: organizationError } = await organizationRepository.getById(profile.organizationId);

  if (organizationError) {
    throw organizationError;
  }

  const organization = OrganizationDTO.fromRecord(organizationRecord);

  if (!organization) {
    return denied('organization_missing', { authUser, profile });
  }

  if (!isActive(organization)) {
    return denied('organization_inactive', { authUser, profile, organization });
  }

  const { data: membershipRecords, error: membershipError } = await workspaceRepository.listMembershipsForProfile(profile.id);

  if (membershipError) {
    throw membershipError;
  }

  const workspaces = filterActiveWorkspaces(membershipRecords || [], organization.id);

  if (!workspaces.length) {
    return denied('no_workspace', { authUser, profile, organization, workspaces });
  }

  const { data: userRoleRecords, error: rolesError } = await roleRepository.listUserRolesForProfile(profile.id);

  if (rolesError) {
    throw rolesError;
  }

  const roles = filterActiveRoles(userRoleRecords || [], organization.id, workspaces);

  if (!roles.length) {
    return denied('no_role', { authUser, profile, organization, workspaces, roles });
  }

  const roleIds = [...new Set(roles.map((role) => role.id))];
  const { data: roleCapabilityRecords, error: capabilitiesError } = await capabilityRepository.listForRoleIds(roleIds);

  if (capabilitiesError) {
    throw capabilitiesError;
  }

  const capabilityRecords = (roleCapabilityRecords || [])
    .map(CapabilityDTO.fromRoleCapabilityRecord)
    .filter(Boolean);
  const capabilities = getEffectiveCapabilities(capabilityRecords);
  const activeWorkspace = resolveActiveWorkspace(workspaces, roles, options.storedWorkspaceRef);
  const isAuthorized = hasAllCapabilities(capabilities, ['portal.access', 'workspace.access']) && Boolean(activeWorkspace);

  if (!isAuthorized) {
    return denied('missing_capability', { authUser, profile, organization, workspaces, roles, capabilities, activeWorkspace });
  }

  return {
    success: true,
    context: UserContextDTO.fromResolvedContext({
      authUser,
      profile,
      organization,
      workspaces,
      roles,
      capabilities,
      activeWorkspace,
      isAuthorized,
      refreshedAt: new Date().toISOString()
    })
  };
};
