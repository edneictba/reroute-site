import { readPortalModule } from './portal-module-service.js';
export const getUpdatesModule = (context) => readPortalModule('portal_updates', context);
