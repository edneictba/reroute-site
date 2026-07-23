import { UpdatesDTO } from '../dtos/module-dtos.js';
import { getUpdatesModule } from '../services/updates-service.js';
let current = UpdatesDTO.fromResult();
export const loadUpdatesData = async (context) => (current = UpdatesDTO.fromResult(await getUpdatesModule(context)));
export const getUpdatesData = () => current;
export const getLatestUpdates = (limit = 5) => [...current.updates].filter((item) => item.status === 'Publicado').sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);
