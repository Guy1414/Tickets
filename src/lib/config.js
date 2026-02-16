export const CONFIG = {
    DATABASE_ID: import.meta.env.VITE_APPWRITE_DATABASE_ID || 'tickets_db', // Default ID
    COLLECTIONS: {
        PROFILES: import.meta.env.VITE_APPWRITE_COLLECTION_PROFILES || 'profiles',
        TICKETS: import.meta.env.VITE_APPWRITE_COLLECTION_TICKETS || 'tickets',
        MESSAGES: import.meta.env.VITE_APPWRITE_COLLECTION_MESSAGES || 'messages',
        SETTINGS: import.meta.env.VITE_APPWRITE_COLLECTION_SETTINGS || 'settings',
    },
    BUCKETS: {
        ATTACHMENTS: import.meta.env.VITE_APPWRITE_BUCKET_ATTACHMENTS || 'attachments',
    }
}
