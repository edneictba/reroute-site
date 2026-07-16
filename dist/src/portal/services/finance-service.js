import { BudgetDTO, CashFlowDTO, FinanceWidgetsDTO, FinancialSummaryDTO, TransactionDTO } from '../dtos/finance-dtos.js';
import { financeRepository } from '../repositories/finance-repository.js';
import { hasAnyCapability } from './authorization-service.js';

const financeReadCapabilities = ['finance.read', 'finance.manage'];

const normalizeFinanceError = (error) => {
  const message = String(error?.message || '').toLowerCase();

  if (message.includes('does not exist') || message.includes('schema cache') || message.includes('relation')) {
    return {
      status: 'schema_missing',
      message: 'As tabelas financeiras ainda não existem neste ambiente.'
    };
  }

  if (message.includes('permission') || message.includes('rls') || error?.code === '42501') {
    return {
      status: 'forbidden',
      message: 'Seu acesso não permite visualizar dados financeiros reais.'
    };
  }

  return {
    status: 'error',
    message: 'Não foi possível carregar os dados financeiros reais.'
  };
};

const getFinanceScope = (context) => ({
  organizationId: context?.organization?.id || '',
  workspaceId: context?.activeWorkspace?.id || ''
});

const validateFinanceAccess = (context) => {
  if (!context?.organization?.id || context.organization.status !== 'active') {
    return { valid: false, status: 'invalid_organization', message: 'Organização inválida para leitura financeira.' };
  }

  if (!context?.activeWorkspace?.id || context.activeWorkspace.status !== 'active') {
    return { valid: false, status: 'invalid_workspace', message: 'Workspace inválido para leitura financeira.' };
  }

  if (!hasAnyCapability(context.capabilities, financeReadCapabilities)) {
    return { valid: false, status: 'forbidden', message: 'Seu acesso não permite visualizar dados financeiros reais.' };
  }

  return { valid: true };
};

export const getFinanceReadCapabilities = () => [...financeReadCapabilities];

export const getRealFinanceWidgets = async (context) => {
  const access = validateFinanceAccess(context);

  if (!access.valid) {
    return {
      status: access.status,
      message: access.message,
      data: null
    };
  }

  const scope = getFinanceScope(context);

  try {
    const [summaryResult, transactionsResult, budgetsResult, cashFlowResult] = await Promise.all([
      financeRepository.getSummary(scope),
      financeRepository.listTransactions(scope),
      financeRepository.listBudgets(scope),
      financeRepository.listCashFlow(scope)
    ]);

    const firstError = [summaryResult, transactionsResult, budgetsResult, cashFlowResult].find((result) => result.error)?.error;

    if (firstError) {
      const normalized = normalizeFinanceError(firstError);
      return { ...normalized, data: null };
    }

    if (!summaryResult.data) {
      return {
        status: 'empty',
        message: 'Nenhum resumo financeiro real foi encontrado para este workspace.',
        data: null
      };
    }

    const summary = FinancialSummaryDTO.fromRecord(summaryResult.data);
    const transactions = (transactionsResult.data || []).map(TransactionDTO.fromRecord);
    const budgets = (budgetsResult.data || []).map(BudgetDTO.fromRecord);
    const cashFlow = (cashFlowResult.data || []).map(CashFlowDTO.fromRecord);

    return {
      status: 'success',
      message: 'Dados financeiros reais carregados com segurança.',
      data: FinanceWidgetsDTO.fromRecords({ summary, transactions, budgets, cashFlow })
    };
  } catch (error) {
    const normalized = normalizeFinanceError(error);
    return { ...normalized, data: null };
  }
};
