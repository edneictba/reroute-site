import { readPortalModule } from './portal-module-service.js';
export const getInvestorsModule = (context) => readPortalModule('portal_investors', context);
