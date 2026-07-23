import { RoadmapDTO } from '../dtos/module-dtos.js';
import { getRoadmapModule } from '../services/roadmap-service.js';
let current = RoadmapDTO.fromResult();
export const loadRoadmapData = async (context) => (current = RoadmapDTO.fromResult(await getRoadmapModule(context)));
export const getRoadmapData = () => current;
