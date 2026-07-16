import { getDocumentsData } from './documents-provider.js';
import { getInvestorsData } from './investors-provider.js';
import { getRoadmapData } from './roadmap-provider.js';
import { getUpdatesData } from './updates-provider.js';

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const getDisplayName = (context) => (
  context?.profile?.display_name || context?.profile?.full_name || context?.authUser?.email || 'Cotista REROUTE'
);

const getInvestorPosition = () => {
  const investorsData = getInvestorsData();
  return investorsData.capTable.find((item) => item.investorNumber === '01') || investorsData.capTable.find((item) => item.quantityOfQuotas > 0);
};

const getAnonymizedCapTable = (position) => {
  const { capTable } = getInvestorsData();
  return capTable
    .filter((item) => item.quantityOfQuotas > 0)
    .map((item) => ({
      label: item.investorNumber === position.investorNumber ? `Cotista ${item.investorNumber} - sua posicao` : `Cotista ${item.investorNumber}`,
      quotas: item.quantityOfQuotas,
      ownership: item.ownershipPercentage,
      status: item.investorNumber === position.investorNumber ? 'Sua participacao' : 'Agregado autorizado'
    }));
};

const getIndividualDocuments = (position) => {
  const documents = getDocumentsData().documents.slice(0, 8).map((documentItem, index) => ({
    ...documentItem,
    accessLevel: index < 2 ? 'Exclusivo do cotista' : index < 5 ? 'Geral autorizado' : 'Estrategico',
    relation: index < 2 ? `Cotista ${position.investorNumber}` : 'REROUTE'
  }));

  return [
    {
      title: `Contrato individual - Cotista ${position.investorNumber}`,
      category: 'Juridico',
      status: 'Atual',
      version: 'v1.0',
      date: '2026-07-05',
      format: 'PDF',
      size: '248 KB',
      accessLevel: 'Exclusivo do cotista',
      relation: `Cotista ${position.investorNumber}`
    },
    {
      title: `Recibo de integralizacao - Cotista ${position.investorNumber}`,
      category: 'Financeiro',
      status: 'Atual',
      version: 'v1.0',
      date: position.lastContributionAt || '2026-07-05',
      format: 'PDF',
      size: '126 KB',
      accessLevel: 'Exclusivo do cotista',
      relation: `Cotista ${position.investorNumber}`
    },
    ...documents
  ];
};

const getNotifications = () => ([
  { title: 'Novo documento disponivel', type: 'novo documento', status: 'nao lida', date: '2026-07-15', important: true },
  { title: 'Atualizacao do Portal publicada', type: 'atualizacao publicada', status: 'nao lida', date: '2026-07-14', important: false },
  { title: 'Marco de autenticacao concluido', type: 'marco concluido', status: 'lida', date: '2026-07-13', important: false },
  { title: 'Aceite de confidencialidade pendente', type: 'aceite pendente', status: 'importante', date: '2026-07-12', important: true },
  { title: 'Comunicado oficial demonstrativo', type: 'comunicacao oficial', status: 'arquivada', date: '2026-07-10', important: false }
]);

const getAcceptances = () => ([
  { title: 'Termos de uso do Portal', status: 'Aceito', date: '2026-07-05' },
  { title: 'Termo de confidencialidade', status: 'Pendente', date: '2026-07-12' },
  { title: 'Ciencia de documentos societarios', status: 'Pendente', date: '2026-07-14' },
  { title: 'Confirmacao de leitura de comunicado', status: 'Aceito', date: '2026-07-15' }
]);

export const investorWorkspaceNav = [
  { label: 'Visao geral', route: '/portal/investidor/dashboard/' },
  { label: 'Minha participacao', route: '/portal/investidor/participacao/' },
  { label: 'Aportes', route: '/portal/investidor/aportes/' },
  { label: 'Documentos', route: '/portal/investidor/documentos/' },
  { label: 'Atualizacoes', route: '/portal/investidor/atualizacoes/' },
  { label: 'Notificacoes', route: '/portal/investidor/notificacoes/' },
  { label: 'Perfil', route: '/portal/investidor/perfil/' }
];

export const getInvestorWorkspaceData = (context) => {
  const position = getInvestorPosition();
  const updates = getUpdatesData().updates.slice(0, 6);
  const roadmap = getRoadmapData();

  if (!position) {
    return {
      page: { eyebrow: 'Workspace do Cotista', title: 'Módulo do Investidor', description: 'Nenhuma posição de investidor disponível.' },
      investor: {}, position: {}, dashboard: {}, capTable: [], contributions: [], documents: [], updates,
      notifications: [], acceptances: [], finance: { summary: [], note: 'Nenhum indicador financeiro disponível.' }, sensitiveFields: []
    };
  }

  const documents = getIndividualDocuments(position);
  const notifications = getNotifications();
  const paid = position.paidAmount;
  const pending = position.pendingAmount;

  return {
    page: {
      eyebrow: 'Workspace do Cotista',
      title: 'Modulo do Investidor',
      description: 'Visao individual demonstrativa do cotista, com dados privados anonimizados e conteudo autorizado.'
    },
    investor: {
      displayName: getDisplayName(context),
      fullName: context?.profile?.full_name || 'Dado sensivel protegido',
      email: context?.authUser?.email || 'E-mail protegido',
      phone: 'Telefone protegido',
      language: 'Portugues (Brasil)',
      timezone: 'America/Sao_Paulo',
      avatar: context?.profile?.avatarUrl || '',
      status: context?.profile?.status || 'active',
      investorNumber: position.investorNumber,
      accessStatus: 'Ativo',
      joinedAt: position.joinedAt,
      lastContributionAt: position.lastContributionAt
    },
    position: {
      ...position,
      formattedNumber: `Cotista no ${position.investorNumber}`,
      committed: currencyFormatter.format(position.committedAmount),
      paid: currencyFormatter.format(paid),
      pending: currencyFormatter.format(pending),
      ownership: `${position.ownershipPercentage}%`,
      consistency: position.committedAmount === paid + pending ? 'Consistente' : 'Revisar'
    },
    dashboard: {
      projectProgress: roadmap.summary?.progress || 84,
      currentSprint: roadmap.summary?.currentSprint || 'Dashboard do Investidor',
      nextMilestone: roadmap.summary?.nextSprint || 'Financeiro real',
      financialHealth: 'Consulte o módulo Financeiro',
      pendingNotifications: notifications.filter((item) => item.status !== 'lida' && item.status !== 'arquivada').length
    },
    capTable: getAnonymizedCapTable(position),
    contributions: position.contributions.map((item) => ({
      ...item,
      amountLabel: currencyFormatter.format(item.amount),
      note: 'Registro demonstrativo autorizado para o workspace do cotista.'
    })),
    documents,
    updates,
    notifications,
    acceptances: getAcceptances(),
    finance: {
      summary: [],
      note: 'Consulte o módulo Financeiro para indicadores autorizados.'
    },
    sensitiveFields: ['CPF', 'RG', 'Endereco', 'Dados bancarios', 'KYC', 'Documentos pessoais']
  };
};
