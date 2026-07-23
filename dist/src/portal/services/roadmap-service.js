import { roadmapRepository } from '../repositories/roadmap-repository.js';
import { readPortalRepository } from './portal-module-service.js';

export const getRoadmapModule = (context) => readPortalRepository(roadmapRepository, context);
