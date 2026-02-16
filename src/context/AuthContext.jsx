import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../lib/auth';
import db from '../lib/db';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
            setIsAdmin(currentUser?.isAdmin || false);

            if (currentUser && !currentUser.isAdmin) {
                const userProfile = await db.getProfileByUserId(currentUser.$id);
                setProfile(userProfile);
            }
        } catch (error) {
            setUser(null);
            setProfile(null);
            setIsAdmin(false);
        } finally {
            setLoading(false);
        }
    };

    const loginUser = async (name, pin) => {
        await authService.loginUser(name, pin);
        await checkUser();
    };

    const loginAdmin = async (email, password) => {
        await authService.loginAdmin(email, password);
        await checkUser();
    };

    const register = async (name, pin) => {
        await authService.registerUser(name, pin);
        // Automatically login
        await authService.loginUser(name, pin);
        // Create profile
        const userAccount = await authService.getCurrentUser();
        await db.createProfile(userAccount.$id, name);
        await checkUser();
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
    };

    const value = {
        user,
        profile,
        loading,
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
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
