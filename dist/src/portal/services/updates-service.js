import { updatesRepository } from '../repositories/updates-repository.js';
import { readPortalRepository } from './portal-module-service.js';

export const getUpdatesModule = (context) => readPortalRepository(updatesRepository, context);
