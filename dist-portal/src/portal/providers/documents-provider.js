import { DocumentsDTO } from '../dtos/module-dtos.js';
import { getDocumentsModule } from '../services/documents-service.js';
let current = DocumentsDTO.fromResult();
export const loadDocumentsData = async (context) => (current = DocumentsDTO.fromResult(await getDocumentsModule(context)));
export const getDocumentsData = () => current;
export const getLatestDocuments = (limit = 5) => [...current.documents].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);
