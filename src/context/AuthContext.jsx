import { createContext, useContext, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import authService from '../lib/auth';
import db from '../lib/db';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true); // Initial boot loading
    const [isAdmin, setIsAdmin] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false); // Action-based loading

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        // Only set global loading for the initial boot
        try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
            setIsAdmin(currentUser?.isAdmin || false);

            if (currentUser && !currentUser.isAdmin) {
                const userProfile = await db.getProfileByUserId(currentUser.$id);
                setProfile(userProfile);
            } else {
                setProfile(null);
            }
        } catch (error) {
            console.error("AuthContext :: checkUser :: error", error);
            // If it's a rate limit, the current user might still be logged in,
            // but we can't verify it. For now, assume null to be safe but don't loop.
            setUser(null);
            setProfile(null);
            setIsAdmin(false);
        } finally {
            setLoading(false);
        }
    };

    const loginUser = async (name, pin) => {
        setIsActionLoading(true);
        try {
            // Clean start: logout first to avoid session conflicts
            await authService.logout().catch(() => { });
            await authService.loginUser(name, pin);
            await checkUser();
        } finally {
            setIsActionLoading(false);
        }
    };

    const loginAdmin = async (email, password) => {
        setIsActionLoading(true);
        try {
            // Clean start: logout first to avoid session conflicts
            await authService.logout().catch(() => { });
            await authService.loginAdmin(email, password);
            await checkUser();
        } finally {
            setIsActionLoading(false);
        }
    };

    const register = async (name, pin) => {
        setIsActionLoading(true);
        try {
            await authService.logout().catch(() => { });
            await authService.registerUser(name, pin);
            await authService.loginUser(name, pin);
            await checkUser();
            const userAccount = await authService.getCurrentUser();
            await db.createProfile(userAccount.$id, name);
            await checkUser();
        } finally {
            setIsActionLoading(false);
        }
    };

    const logout = async () => {
        setIsActionLoading(true);
        try {
            await authService.logout();
        } finally {
            setUser(null);
            setProfile(null);
            setIsAdmin(false);
            setIsActionLoading(false);
        }
    };

    const value = {
        user,
        profile,
        loading, // Initial boot
        isActionLoading, // Login/Logout in progress
        isAdmin,
        verified: isAdmin || (profile?.verified || false),
        loginAdmin,
        loginUser,
        register,
        logout,
        checkUser
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="flex h-screen items-center justify-center bg-neutral-950">
                    <div className="text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
                        <p className="text-neutral-500 text-sm animate-pulse">Initializing Security...</p>
                    </div>
                </div>
            ) : children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;
