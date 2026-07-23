import { getSupabaseClient } from '../lib/supabase-client.js';
import { PortalReadModelDTO } from '../dtos/read-model-dtos.js';

const getScope = (context) => ({
  organizationId: context?.organization?.id || '',
  workspaceId: context?.activeWorkspace?.id || ''
});

export const readPortalModule = async (table, context) => {
  const scope = getScope(context);

  if (!scope.organizationId || !scope.workspaceId) {
    return { status: 'empty', data: null, message: 'Contexto do workspace indisponível.' };
  }

  try {
    const { data, error } = await getSupabaseClient()
      .from(table)
      .select('payload, updated_at')
      .eq('organization_id', scope.organizationId)
      .eq('workspace_id', scope.workspaceId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      const message = String(error.message || '').toLowerCase();
      const schemaMissing = message.includes('does not exist') || message.includes('schema cache') || message.includes('relation');
      return {
        status: schemaMissing ? 'empty' : 'error',
        data: null,
        message: schemaMissing ? 'Nenhum dado publicado para este módulo.' : 'Não foi possível carregar este módulo.'
      };
    }

    return data?.payload
      ? { status: 'success', data: data.payload, message: 'Dados carregados.' }
      : { status: 'empty', data: null, message: 'Nenhum registro disponível.' };
  } catch {
    return { status: 'error', data: null, message: 'Não foi possível carregar este módulo.' };
  }
};

export const readPortalRepository = async (repository, context) => {
  const scope = getScope(context);

  if (!scope.organizationId || !scope.workspaceId) {
    return { status: 'empty', data: null, message: 'Contexto do workspace indisponível.' };
  }

  try {
    const { data, error } = await repository.getLatestPublished(scope);

    if (error) {
      const message = String(error.message || '').toLowerCase();
      const schemaMissing = message.includes('does not exist') || message.includes('schema cache') || message.includes('relation');
      return {
        status: schemaMissing ? 'empty' : 'error',
        data: null,
        message: schemaMissing ? 'Nenhum dado publicado para este módulo.' : 'Não foi possível carregar este módulo.'
      };
    }

    const readModel = PortalReadModelDTO.fromRecord(data);
    return readModel
      ? { status: 'success', data: readModel.payload, metadata: readModel, message: 'Dados carregados.' }
      : { status: 'empty', data: null, message: 'Nenhum registro publicado.' };
  } catch {
    return { status: 'error', data: null, message: 'Não foi possível carregar este módulo.' };
  }
};
