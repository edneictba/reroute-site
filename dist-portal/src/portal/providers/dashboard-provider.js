import { DashboardDTO } from '../dtos/module-dtos.js';
import { getDashboardModule } from '../services/dashboard-service.js';
let current = DashboardDTO.fromResult();
export const loadDashboardData = async (context) => (current = DashboardDTO.fromResult(await getDashboardModule(context)));
export const getDashboardData = () => current;
