import { documentsRepository } from '../repositories/documents-repository.js';
import { readPortalRepository } from './portal-module-service.js';

export const getDocumentsModule = (context) => readPortalRepository(documentsRepository, context);
