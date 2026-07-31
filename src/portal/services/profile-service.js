import { profileRepository } from '../repositories/profile-repository.js';

const supportedLanguages = new Set(['pt-BR', 'es', 'en']);

export const updatePreferredLanguage = async (profileId, preferredLanguage) => {
  if (!profileId || !supportedLanguages.has(preferredLanguage)) {
    return { success: false, error: 'Não foi possível salvar o idioma selecionado.', data: null };
  }

  try {
    const { data, error } = await profileRepository.updatePreferredLanguage(profileId, preferredLanguage);

    if (error) {
      return { success: false, error: 'Não foi possível salvar sua preferência agora.', data: null };
    }

    return { success: true, error: null, data };
  } catch (_error) {
    return { success: false, error: 'Não foi possível salvar sua preferência agora.', data: null };
  }
};
