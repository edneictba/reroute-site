const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0
});

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 1
});

export const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));

export const formatPercent = (value) => `${percentFormatter.format(Number(value || 0))}%`;

const formatDate = (value) => {
  if (!value) return 'Data indisponível';
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? 'Data indisponível' : date.toLocaleDateString('pt-BR');
};

export const FinancialSummaryDTO = {
  fromRecord: (record) => ({
    currentCash: Number(record?.current_cash || 0),
    monthlyBurnRate: Number(record?.monthly_burn_rate || 0),
    estimatedRunwayMonths: Number(record?.estimated_runway_months || 0),
    totalInvested: Number(record?.total_invested || 0),
    totalExecuted: Number(record?.total_executed || 0),
    availableBalance: Number(record?.available_balance || 0),
    reserveAmount: Number(record?.reserve_amount || 0),
    budgetUsagePercentage: Number(record?.budget_usage_percentage || 0),
    updatedAt: record?.updated_at || null
  })
};

export const TransactionDTO = {
  fromRecord: (record) => ({
    id: record?.id,
    date: record?.transaction_date || record?.created_at || null,
    type: record?.type || 'expense',
    category: record?.category || 'Operacional',
    description: record?.description || '',
    amount: Number(record?.amount || 0),
    status: record?.status || 'posted'
  })
};

export const BudgetDTO = {
  fromRecord: (record) => ({
    id: record?.id,
    label: record?.label || record?.category || 'Orçamento',
    plannedAmount: Number(record?.planned_amount || 0),
    actualAmount: Number(record?.actual_amount || 0),
    reserveAmount: Number(record?.reserve_amount || 0),
    status: record?.status || 'active'
  })
};

export const CashFlowDTO = {
  fromRecord: (record) => ({
    label: record?.period_label || record?.month || '',
    entries: Number(record?.entries || 0),
    exits: Number(record?.exits || 0),
    balance: Number(record?.balance || 0)
  })
};

export const RunwayDTO = {
  fromSummary: (summary) => ({
    months: summary.estimatedRunwayMonths,
    burnRate: summary.monthlyBurnRate,
    label: `${percentFormatter.format(summary.estimatedRunwayMonths)} meses`
  })
};

export const FinanceWidgetsDTO = {
  fromRecords: ({ summary, transactions = [], budgets = [], cashFlow = [] }) => {
    const postedTransactions = transactions.filter((transaction) => transaction.status === 'posted');
    const totalRevenue = postedTransactions
      .filter((transaction) => transaction.type === 'income')
      .reduce((total, transaction) => total + transaction.amount, 0);
    const totalExpenses = postedTransactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((total, transaction) => total + transaction.amount, 0);
    const categoryTotals = postedTransactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((totals, transaction) => {
        totals.set(transaction.category, (totals.get(transaction.category) || 0) + transaction.amount);
        return totals;
      }, new Map());
    const largestExpenses = transactions
      .filter((transaction) => transaction.type !== 'income')
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
      .slice(0, 4)
      .map((transaction) => ({
        label: transaction.category,
        value: formatCurrency(Math.abs(transaction.amount))
      }));

    const forecastComparison = budgets.slice(0, 4).map((budget) => ({
      label: budget.label,
      planned: formatCurrency(budget.plannedAmount),
      actual: formatCurrency(budget.actualAmount)
    }));

    const monthlyEvolution = cashFlow.slice(-6).map((period) => ({
      month: period.label,
      value: formatCurrency(period.exits),
      note: `Saldo: ${formatCurrency(period.balance)}`
    }));

    const runway = RunwayDTO.fromSummary(summary);

    return {
      overview: [
        { label: 'Caixa Atual', value: formatCurrency(summary.currentCash), tone: 'online' },
        { label: 'Receitas', value: formatCurrency(totalRevenue), tone: 'online' },
        { label: 'Despesas', value: formatCurrency(totalExpenses), tone: 'progress' },
        { label: 'Burn Rate Mensal', value: formatCurrency(summary.monthlyBurnRate), tone: 'progress' },
        { label: 'Runway Estimado', value: runway.label, tone: 'online' },
        { label: 'Saldo Disponível', value: formatCurrency(summary.availableBalance), tone: 'online' }
      ],
      indicators: [
        { label: 'Investimento previsto', value: formatCurrency(summary.totalInvested) },
        { label: 'Investimento realizado', value: formatCurrency(summary.totalExecuted) },
        { label: 'Percentual utilizado', value: formatPercent(summary.budgetUsagePercentage) },
        { label: 'Reserva', value: formatCurrency(summary.reserveAmount) },
        { label: 'Runway', value: runway.label }
      ],
      widgets: {
        monthlyEvolution,
        largestExpenses,
        forecastComparison,
        financialSummary: [
          `Runway atual: ${runway.label}.`,
          `Burn rate mensal: ${formatCurrency(runway.burnRate)}.`,
          `Saldo disponível: ${formatCurrency(summary.availableBalance)}.`
        ]
      },
      charts: {
        cashflow: {
          title: 'Fluxo de Caixa',
          labels: cashFlow.map((period) => period.label),
          entries: cashFlow.map((period) => period.entries),
          exits: cashFlow.map((period) => period.exits),
          balance: cashFlow.map((period) => period.balance)
        },
        distribution: {
          title: 'Distribuição das despesas',
          labels: [...categoryTotals.keys()],
          values: [...categoryTotals.values()]
        },
        budget: {
          title: 'Orçamento previsto x realizado',
          labels: budgets.map((budget) => budget.label),
          planned: budgets.map((budget) => budget.plannedAmount),
          actual: budgets.map((budget) => budget.actualAmount)
        }
      },
      timeline: transactions.slice(0, 12).map((transaction) => ({
        title: transaction.description || transaction.category,
        status: transaction.type === 'income' ? 'Receita' : transaction.type === 'expense' ? 'Despesa' : 'Transferência',
        amount: formatCurrency(transaction.amount),
        date: transaction.date,
        formattedDate: formatDate(transaction.date),
        tone: transaction.status === 'posted' ? 'done' : transaction.status === 'pending' ? 'current' : 'planned'
      })),
      alerts: [
        {
          title: summary.availableBalance >= summary.reserveAmount ? 'Reserva preservada' : 'Reserva abaixo do previsto',
          description: `Saldo disponível de ${formatCurrency(summary.availableBalance)} e reserva de ${formatCurrency(summary.reserveAmount)}.`,
          tone: summary.availableBalance >= summary.reserveAmount ? 'success' : 'warning'
        },
        {
          title: 'Execução orçamentária',
          description: `${formatPercent(summary.budgetUsagePercentage)} do orçamento utilizado.`,
          tone: summary.budgetUsagePercentage <= 80 ? 'success' : 'warning'
        },
        {
          title: 'Movimentação financeira',
          description: `${formatCurrency(totalRevenue)} em receitas e ${formatCurrency(totalExpenses)} em despesas no período carregado.`,
          tone: totalRevenue >= totalExpenses ? 'success' : 'progress'
        }
      ]
    };
  }
};
