import { storage } from './appwrite';
import { ID } from 'appwrite';
import { CONFIG } from './config';

export class StorageService {
    async uploadFile(file) {
        try {
            return await storage.createFile(
                CONFIG.BUCKETS.ATTACHMENTS,
                ID.unique(),
                file
            );
        } catch (error) {
            console.error("Appwrite service :: uploadFile :: error", error);
            throw error;
        }
    }

    getFilePreview(fileId) {
        return storage.getFilePreview(
            CONFIG.BUCKETS.ATTACHMENTS,
            fileId
        );
    }

    getFileView(fileId) {
        return storage.getFileView(
            CONFIG.BUCKETS.ATTACHMENTS,
            fileId
        );
    }
}

const storageService = new StorageService();
export default storageService;
