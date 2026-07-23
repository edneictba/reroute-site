import { getSupabaseClient } from '../lib/supabase-client.js';

const getScopedQuery = (table, scope) => {
  let query = getSupabaseClient()
    .from(table)
    .select('*')
    .eq('organization_id', scope.organizationId);

  if (scope.workspaceId) {
    query = query.eq('workspace_id', scope.workspaceId);
  }

  return query;
};

export const financeRepository = {
  getSummary: (scope) => getScopedQuery('financial_summaries', scope)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle(),

  listTransactions: (scope) => getScopedQuery('financial_transactions', scope)
    .order('transaction_date', { ascending: false })
    .limit(100),

  listBudgets: (scope) => getScopedQuery('financial_budgets', scope)
    .order('created_at', { ascending: false })
    .limit(50),

  listCashFlow: (scope) => getScopedQuery('financial_cash_flows', scope)
    .order('period_start', { ascending: true })
    .limit(24)
};
