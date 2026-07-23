import { InvestorReadModelDTO } from '../dtos/read-model-dtos.js';
import { investorsRepository } from '../repositories/investors-repository.js';

export const getInvestorsModule = async (context) => {
  const scope = {
    organizationId: context?.organization?.id || '',
    workspaceId: context?.activeWorkspace?.id || ''
  };
  const profileId = context?.profile?.id || '';

  if (!scope.organizationId || !scope.workspaceId || !profileId) {
    return { status: 'empty', data: null, message: 'Contexto do investidor indisponível.' };
  }

  try {
    const { data, error } = await investorsRepository.listLatestPublishedForProfile(scope, profileId);

    if (error) {
      const message = String(error.message || '').toLowerCase();
      const schemaMissing = message.includes('does not exist') || message.includes('schema cache') || message.includes('relation');
      return {
        status: schemaMissing ? 'empty' : 'error',
        data: null,
        message: schemaMissing ? 'Nenhum dado de investidor foi publicado.' : 'Não foi possível carregar os dados do investidor.'
      };
    }

    const readModel = InvestorReadModelDTO.fromRecords(data || [], profileId);
    return readModel
      ? { status: 'success', data: readModel.payload, metadata: readModel, message: 'Dados carregados.' }
      : { status: 'empty', data: null, message: 'Nenhum dado de investidor foi publicado.' };
  } catch {
    return { status: 'error', data: null, message: 'Não foi possível carregar os dados do investidor.' };
  }
};
