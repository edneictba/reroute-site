import { ExecutiveDashboardDTO } from '../dtos/executive-dashboard-dto.js';
import { getDocumentsData } from './documents-provider.js';
import { getInvestorsData } from './investors-provider.js';
import { getProjectsData } from './projects-provider.js';
import { getRoadmapData } from './roadmap-provider.js';
import { getUpdatesData } from './updates-provider.js';

export const getExecutiveDashboardData = (context) => ExecutiveDashboardDTO.fromModules({
  investors: getInvestorsData(),
  roadmap: getRoadmapData(),
  projects: getProjectsData(),
  updates: getUpdatesData(),
  documents: getDocumentsData(),
  profileId: context?.profile?.id
});
