export const portalNavigationItems = [
  ['Meu Portal', '/portal/investidor/dashboard/', 5, ['portal.access', 'workspace.access']],
  ['Dashboard', '/portal/dashboard/', 10, ['portal.access', 'workspace.access']],
  ['Roadmap', '/portal/roadmap/', 20, ['portal.access', 'workspace.access']],
  ['Atualizações', '/portal/atualizacoes/', 30, ['portal.access', 'workspace.access']],
  ['Documentos', '/portal/documentos/', 40, ['portal.access', 'workspace.access']],
  ['Projetos', '/portal/projetos/', 50, ['portal.access', 'workspace.access']],
  ['Financeiro', '/portal/financeiro/', 60, ['portal.access', 'workspace.access']],
  ['Investidores', '/portal/investidores/', 70, ['portal.access', 'workspace.access', 'investor.manage']],
  ['Admin Center', '/portal/admin/', 75, ['portal.access', 'workspace.access', 'users.manage', 'roles.view', 'audit.view']],
  ['Configurações', '/portal/manutencao/', 80, ['portal.access', 'workspace.access']]
].map(([label, route, displayOrder, requiredCapabilities]) => ({
  label, route, displayOrder, requiredCapabilities,
  status: label === 'Configurações' ? 'soon' : 'active'
}));

export const getNavigationForContext = (context) => {
  const capabilities = context?.capabilities || new Set();
  const activeWorkspace = context?.activeWorkspace?.slug;
  const workspaceSlugs = new Set((context?.workspaces || []).map((workspace) => workspace.slug));

  return portalNavigationItems
    .filter((item) => !item.workspace || item.workspace === 'any' || item.workspace === activeWorkspace || workspaceSlugs.has(item.workspace))
    .filter((item) => item.requiredCapabilities.every((capability) => capabilities.has(capability)))
    .sort((a, b) => a.displayOrder - b.displayOrder);
};
