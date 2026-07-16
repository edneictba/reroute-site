import { readPortalModule } from './portal-module-service.js';
export const getDocumentsModule = (context) => readPortalModule('portal_documents', context);
