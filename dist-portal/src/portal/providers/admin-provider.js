import { AdminDTO } from '../dtos/module-dtos.js';
import { getAdminModule } from '../services/admin-service.js';
let current = AdminDTO.fromResult();
export const loadAdminData = async (context) => (current = AdminDTO.fromResult(await getAdminModule(context)));
export const getAdminData = () => current;
