import { databases } from './appwrite';
import { ID, Query } from 'appwrite';
import { CONFIG } from './config';
import notify from './notifications';

export class DatabaseService {

    // Profiles
    async getProfiles() {
        try {
            return await databases.listDocuments(
                CONFIG.DATABASE_ID,
                CONFIG.COLLECTIONS.PROFILES,
                [
                    Query.limit(100),
                    Query.orderAsc('display_name')
                ]
            );
        } catch (error) {
            console.error("Appwrite service :: getProfiles :: error", error);
            return { documents: [] };
        }
    }

    async createProfile(userId, name) {
        try {
            const res = await databases.createDocument(
                CONFIG.DATABASE_ID,
                CONFIG.COLLECTIONS.PROFILES,
                ID.unique(),
                {
                    user_id: userId, // Link to Auth Account
                    display_name: name,
                    theme_pref: 'system',
                    verified: false // New users need approval
                }
            );
            notify('user_signup', { name });
            return res;
        } catch (error) {
            console.error("Appwrite service :: createProfile :: error", error);
            throw error;
        }
    }

    async getProfileByUserId(userId) {
        try {
            const res = await databases.listDocuments(
                CONFIG.DATABASE_ID,
                CONFIG.COLLECTIONS.PROFILES,
                [Query.equal('user_id', userId)]
            );
            return res.documents.length > 0 ? res.documents[0] : null;
        } catch (error) {
            console.error("Appwrite service :: getProfileByUserId :: error", error);
            throw error;
        }
    }

    async verifyUser(profileId) {
        try {
            return await databases.updateDocument(
                CONFIG.DATABASE_ID,
                CONFIG.COLLECTIONS.PROFILES,
                profileId,
                { verified: true }
            );
        } catch (error) {
            console.error("Appwrite service :: verifyUser :: error", error);
            throw error;
        }
    }

    async updateProfileTheme(profileId, theme) {
        try {
            return await databases.updateDocument(
                CONFIG.DATABASE_ID,
                CONFIG.COLLECTIONS.PROFILES,
                profileId,
                { theme_pref: theme }
            );
        } catch (error) {
            console.error("Appwrite service :: updateProfileTheme :: error", error);
            throw error;
        }
    }

    // Tickets
    async getTickets(userId = null) {
        try {
            const queries = [Query.orderDesc('$createdAt')];
            if (userId) {
                queries.push(Query.equal('owner_id', userId));
            }
            return await databases.listDocuments(
                CONFIG.DATABASE_ID,
                CONFIG.COLLECTIONS.TICKETS,
                queries
            );
        } catch (error) {
            console.error("Appwrite service :: getTickets :: error", error);
            throw error;
        }
    }

    async createTicket(userId, title, description, priority, attachmentIds = []) {
        try {
            const res = await databases.createDocument(
                CONFIG.DATABASE_ID,
                CONFIG.COLLECTIONS.TICKETS,
                ID.unique(),
                {
                    owner_id: userId,
                    title,
                    description,
                    priority,
                    status: 'open',
                    attachments: attachmentIds
                }
            );
            notify('ticket_created', { title, userId });
            return res;
        } catch (error) {
            console.error("Appwrite service :: createTicket :: error", error);
            throw error;
        }
    }

    async getTicket(id) {
        try {
            return await databases.getDocument(
                CONFIG.DATABASE_ID,
                CONFIG.COLLECTIONS.TICKETS,
                id
            );
        } catch (error) {
            console.error("Appwrite service :: getTicket :: error", error);
            throw error;
        }
    }

    async updateTicketStatus(id, status) {
        try {
            return await databases.updateDocument(
                CONFIG.DATABASE_ID,
                CONFIG.COLLECTIONS.TICKETS,
                id,
                { status }
            );
        } catch (error) {
            console.error("Appwrite service :: updateTicketStatus :: error", error);
            throw error;
        }
    }

    async updateTicket(id, data) {
        try {
            return await databases.updateDocument(
                CONFIG.DATABASE_ID,
                CONFIG.COLLECTIONS.TICKETS,
                id,
                data
            );
        } catch (error) {
            console.error("Appwrite service :: updateTicket :: error", error);
            throw error;
        }
    }

    // Messages
    async getMessages(ticketId) {
        try {
            return await databases.listDocuments(
                CONFIG.DATABASE_ID,
                CONFIG.COLLECTIONS.MESSAGES,
                [
                    Query.equal('ticket_id', ticketId),
                    Query.orderAsc('$createdAt')
                ]
            );
        } catch (error) {
            console.error("Appwrite service :: getMessages :: error", error);
            throw error;
        }
    }

    async createMessage(ticketId, senderId, content, attachmentIds = [], isInternal = false) {
        try {
            return await databases.createDocument(
                CONFIG.DATABASE_ID,
                CONFIG.COLLECTIONS.MESSAGES,
                ID.unique(),
                {
                    ticket_id: ticketId,
                    sender_id: senderId,
                    content,
                    attachments: attachmentIds,
                    is_internal: isInternal
                }
            );
        } catch (error) {
            console.error("Appwrite service :: createMessage :: error", error);
            throw error;
        }
    }

    // Global Settings
    // Global Settings
    async getGlobalSetting(key) {
        try {
            const result = await databases.listDocuments(
                CONFIG.DATABASE_ID,
                CONFIG.COLLECTIONS.SETTINGS,
                [Query.equal('key', key)]
            );
            return result.documents.length > 0 ? result.documents[0] : null;
        } catch (error) {
            return null;
        }
    }

    async updateGlobalSetting(key, value) {
        try {
            const doc = await this.getGlobalSetting(key);
            if (doc) {
                return await databases.updateDocument(
                    CONFIG.DATABASE_ID,
                    CONFIG.COLLECTIONS.SETTINGS,
                    doc.$id,
                    { value: String(value) }
                );
            } else {
                return await databases.createDocument(
                    CONFIG.DATABASE_ID,
                    CONFIG.COLLECTIONS.SETTINGS,
                    ID.unique(),
                    { key, value: String(value) }
                );
            }
        } catch (error) {
            console.error("Appwrite service :: updateGlobalSetting :: error", error);
            throw error;
        }
    }

    // Knowledge Base
    async getArticles(publishedOnly = true) {
        try {
            const queries = [Query.orderDesc('$createdAt')];
            if (publishedOnly) {
                queries.push(Query.equal('is_published', true));
            }
            return await databases.listDocuments(
                CONFIG.DATABASE_ID,
                CONFIG.COLLECTIONS.ARTICLES,
                queries
            );
        } catch (error) {
            console.error("Appwrite service :: getArticles :: error", error);
            return { documents: [] };
        }
    }

    async createArticle(title, content, category) {
        try {
            return await databases.createDocument(
                CONFIG.DATABASE_ID,
                CONFIG.COLLECTIONS.ARTICLES,
                ID.unique(),
                {
                    title,
                    content,
                    category,
                    is_published: true
                }
            );
        } catch (error) {
            console.error("Appwrite service :: createArticle :: error", error);
            throw error;
        }
    }

    async updateArticle(id, data) {
        try {
            return await databases.updateDocument(
                CONFIG.DATABASE_ID,
                CONFIG.COLLECTIONS.ARTICLES,
                id,
                data
            );
        } catch (error) {
            console.error("Appwrite service :: updateArticle :: error", error);
            throw error;
        }
    }

    async deleteArticle(id) {
        try {
            await databases.deleteDocument(
                CONFIG.DATABASE_ID,
                CONFIG.COLLECTIONS.ARTICLES,
                id
            );
        } catch (error) {
            console.error("Appwrite service :: deleteArticle :: error", error);
            throw error;
        }
    }
}

const db = new DatabaseService();
export default db;
