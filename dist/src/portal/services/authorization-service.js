export const hasCapability = (capabilities, capabilityKey) => capabilities instanceof Set && capabilities.has(capabilityKey);

export const hasAnyCapability = (capabilities, capabilityKeys = []) => (
  capabilityKeys.some((capabilityKey) => hasCapability(capabilities, capabilityKey))
);

export const hasAllCapabilities = (capabilities, capabilityKeys = []) => (
  capabilityKeys.every((capabilityKey) => hasCapability(capabilities, capabilityKey))
);

export const getEffectiveCapabilities = (capabilityRecords = []) => {
  const denied = new Set();
  const granted = new Set();

  capabilityRecords.forEach((capability) => {
    if (!capability?.key) {
      return;
    }

    if (capability.granted === false) {
      denied.add(capability.key);
      granted.delete(capability.key);
      return;
    }

    if (!denied.has(capability.key)) {
      granted.add(capability.key);
    }
  });

  return granted;
};

export const canAccessWorkspace = (workspaces = [], workspaceRef) => (
  workspaces.some((workspace) => workspace.id === workspaceRef || workspace.slug === workspaceRef)
);
