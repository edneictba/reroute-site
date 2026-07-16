import {
  createCapability,
  createOrganization,
  createProfile,
  createRole,
  createUserContext,
  createWorkspace
} from '../models/user-context-models.js';

export const ProfileDTO = {
  fromRecord: (record) => record ? createProfile({
    id: record.id,
    organizationId: record.organization_id,
    displayName: record.display_name || '',
    fullName: record.full_name || '',
    email: record.email || '',
    phone: record.phone || '',
    avatarUrl: record.avatar_url || '',
    status: record.status || 'invited',
    preferredLanguage: record.preferred_language || 'pt-BR',
    timezone: record.timezone || 'America/Sao_Paulo',
    createdAt: record.created_at || null,
    updatedAt: record.updated_at || null
  }) : null
};

export const OrganizationDTO = {
  fromRecord: (record) => record ? createOrganization({
    id: record.id,
    name: record.name || '',
    slug: record.slug || '',
    status: record.status || 'disabled',
    createdAt: record.created_at || null,
    updatedAt: record.updated_at || null
  }) : null
};

export const WorkspaceDTO = {
  fromMembershipRecord: (membership) => {
    const workspace = membership?.workspace;

    if (!workspace) {
      return null;
    }

    return createWorkspace({
      id: workspace.id,
      organizationId: workspace.organization_id,
      name: workspace.name || '',
      slug: workspace.slug || '',
      description: workspace.description || '',
      status: workspace.status || 'disabled',
      displayOrder: workspace.display_order || 0,
      membershipStatus: membership.status || 'removed',
      joinedAt: membership.joined_at || null,
      createdAt: workspace.created_at || null,
      updatedAt: workspace.updated_at || null
    });
  }
};

export const RoleDTO = {
  fromUserRoleRecord: (userRole) => {
    const role = userRole?.role;

    if (!role) {
      return null;
    }

    return createRole({
      id: role.id,
      organizationId: role.organization_id,
      name: role.name || '',
      slug: role.slug || '',
      description: role.description || '',
      isSystemRole: Boolean(role.is_system_role),
      status: role.status || 'disabled',
      workspaceId: userRole.workspace_id || null,
      assignedAt: userRole.assigned_at || null,
      expiresAt: userRole.expires_at || null
    });
  }
};

export const CapabilityDTO = {
  fromRoleCapabilityRecord: (roleCapability) => {
    const capability = roleCapability?.capability;

    if (!capability?.key) {
      return null;
    }

    return createCapability({
      id: capability.id || null,
      key: capability.key,
      module: capability.module || '',
      action: capability.action || '',
      description: capability.description || '',
      granted: roleCapability.granted === true
    });
  }
};

export const UserContextDTO = {
  fromResolvedContext: (record) => createUserContext(record)
};
