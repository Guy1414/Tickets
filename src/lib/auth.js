import { account } from './appwrite';
import { ID } from 'appwrite';

// Configuration for "Internal Email" strategy
const INTERNAL_EMAIL_SUFFIX = "@tickets.internal";
// Appwrite requires passwords 8-265 chars. We pad the 4-digit PIN with a fixed suffix.
const PIN_PADDING = "_TKT";

export class AuthService {
    /**
     * Login for Admins using standard Email/Password
     */
    async loginAdmin(email, password) {
        try {
            return await account.createEmailPasswordSession(email, password);
        } catch (error) {
            console.error("Appwrite service :: loginAdmin :: error", error);
            throw error;
        }
    }

    /**
     * Login for Standard Users using Name + PIN
     * Maps to: email=[name]@tickets.internal, password=pin
     */
    async loginUser(name, pin) {
        try {
            const email = `${name.replace(/\s+/g, '').toLowerCase()}${INTERNAL_EMAIL_SUFFIX}`;
            const paddedPin = pin + PIN_PADDING;
            return await account.createEmailPasswordSession(email, paddedPin);
        } catch (error) {
            console.error("Appwrite service :: loginUser :: error", error);
            throw error;
        }
    }

    async registerUser(name, pin) {
        try {
            const email = `${name.replace(/\s+/g, '').toLowerCase()}${INTERNAL_EMAIL_SUFFIX}`;
            const paddedPin = pin + PIN_PADDING;
            // Create the Appwrite account
            return await account.create(ID.unique(), email, paddedPin, name);
        } catch (error) {
            console.error("Appwrite service :: registerUser :: error", error);
            throw error;
        }
    }

    async logout() {
        try {
            return await account.deleteSession('current');
        } catch (error) {
            // If the user is already logged out (401) or guest (403), we can consider logout successful
            if (error.code === 401 || error.code === 403) {
                return;
            }
            console.error("Appwrite service :: logout :: error", error);
            throw error;
        }
    }

    async getCurrentUser() {
        try {
            const user = await account.get();
            // Determine if admin based on label or specific attribute?
            // For now, checks if email does NOT end with internal suffix
            const isAdmin = !user.email.endsWith(INTERNAL_EMAIL_SUFFIX);
            return { ...user, isAdmin };
        } catch (error) {
            // Not logged in
            return null;
        }
    }
}

const authService = new AuthService();
export default authService;
