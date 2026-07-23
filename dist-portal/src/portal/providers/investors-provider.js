import { InvestorsDTO } from '../dtos/module-dtos.js';
import { getInvestorsModule } from '../services/investors-service.js';
let current = InvestorsDTO.fromResult();
export const loadInvestorsData = async (context) => (current = InvestorsDTO.fromResult(await getInvestorsModule(context)));
export const getInvestorsData = () => current;
