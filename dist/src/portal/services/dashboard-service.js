import { readPortalModule } from './portal-module-service.js';
export const getDashboardModule = (context) => readPortalModule('portal_dashboard', context);
