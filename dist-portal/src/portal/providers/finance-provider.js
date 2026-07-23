import { getRealFinanceWidgets } from '../services/finance-service.js';

const baseFinanceData = {
  page: {
    eyebrow: 'Investor Intelligence Center',
    title: 'Saúde Financeira',
    description: 'Painel executivo para acompanhar saldo, receitas, despesas, fluxo de caixa e orçamento do REROUTE.'
  },
  dashboard: {
    title: 'Saúde Financeira',
    description: 'Resumo atualizado do caixa e da execução financeira.'
  }
};

const emptyFinanceCollections = () => ({
  overview: [],
  indicators: [],
  charts: {
    cashflow: { title: 'Fluxo de Caixa', labels: [], entries: [], exits: [], balance: [] },
    distribution: { title: 'Distribuição das despesas', labels: [], values: [] },
    budget: { title: 'Orçamento previsto x realizado', labels: [], planned: [], actual: [] }
  },
  widgets: {
    monthlyEvolution: [],
    largestExpenses: [],
    forecastComparison: [],
    financialSummary: []
  },
  timeline: [],
  alerts: []
});

export const getFinanceData = async (context) => {
  if (!context?.isAuthorized) {
    return {
      ...baseFinanceData,
      ...emptyFinanceCollections(),
      financeState: {
        status: 'forbidden',
        message: 'Contexto autorizado indisponível para leitura financeira.'
      }
    };
  }

  const result = await getRealFinanceWidgets(context);

  if (result.status !== 'success') {
    return {
      ...baseFinanceData,
      ...emptyFinanceCollections(),
      financeState: { status: result.status, message: result.message }
    };
  }

  return {
    ...baseFinanceData,
    ...result.data,
    financeState: { status: 'success', message: result.message }
  };
};

