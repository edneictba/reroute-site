import { readPortalModule } from './portal-module-service.js';
export const getAdminModule = (context) => readPortalModule('portal_admin', context);
