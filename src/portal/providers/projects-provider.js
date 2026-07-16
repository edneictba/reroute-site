import { ProjectsDTO } from '../dtos/module-dtos.js';
import { getProjectsModule } from '../services/projects-service.js';
let current = ProjectsDTO.fromResult();
export const loadProjectsData = async (context) => (current = ProjectsDTO.fromResult(await getProjectsModule(context)));
export const getProjectsData = () => current;
export const getModulesByRoadmapId = (roadmapId) => current.modules.filter((module) => module.roadmapId === roadmapId);
