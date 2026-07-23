import { projectsRepository } from '../repositories/projects-repository.js';
import { readPortalRepository } from './portal-module-service.js';

export const getProjectsModule = (context) => readPortalRepository(projectsRepository, context);
