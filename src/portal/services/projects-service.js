import { readPortalModule } from './portal-module-service.js';
export const getProjectsModule = (context) => readPortalModule('portal_projects', context);
