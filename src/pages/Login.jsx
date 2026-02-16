import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import db from '../lib/db';
import { cn } from '../lib/utils';
import { Loader2, Lock, User, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

const Login = () => {
    const { loginUser, loginAdmin, user } = useAuth();
    const navigate = useNavigate();
    const [mode, setMode] = useState('user'); // 'user' or 'admin'
    const [loading, setLoading] = useState(false);
    const [profiles, setProfiles] = useState([]);
    const [error, setError] = useState('');

    // Form States
    const [selectedUser, setSelectedUser] = useState('');
    const [pin, setPin] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (user) {
            navigate(user.isAdmin ? '/admin' : '/dashboard');
        }
    }, [user, navigate]);

    useEffect(() => {
        if (mode === 'user') {
            loadProfiles();
        }
    }, [mode]);

    const loadProfiles = async () => {
        setLoading(true);
        try {
            const res = await db.getProfiles();
            setProfiles(res.documents);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'user') {
                if (!selectedUser || pin.length < 4) {
                    throw new Error("Please select a user and enter a 4-digit PIN");
                }
                // Find selected profile name
                const profile = profiles.find(p => p.$id === selectedUser);
                if (!profile) throw new Error("User not found");

                await loginUser(profile.display_name, pin);
            } else {
                await loginAdmin(email, password);
            }
            // Navigation handled by useEffect
        } catch (err) {
            console.error(err);
            setError(err.message || "Login failed. Please check your credentials.");
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-neutral-950 text-neutral-50 px-4">
            <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl overflow-hidden relative">

                {/* Header */}
                <div className="absolute top-4 right-4">
                    <ThemeToggle />
                </div>
                <div className="p-8 text-center border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md">
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent mb-2">
                        {mode === 'user' ? 'Welcome Back' : 'Admin Portal'}
                    </h1>
                    <p className="text-neutral-400 text-sm">
                        {mode === 'user' ? 'Select your profile to continue' : 'Secure access for administrators'}
                    </p>
                </div>

                {/* Form */}
                <div className="p-8 space-y-6">
                    {error && (
                        <div className="p-3 text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">

                        {mode === 'user' ? (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-300">Who are you?</label>
                                    <div className="relative">
                                        <select
                                            value={selectedUser}
                                            onChange={(e) => setSelectedUser(e.target.value)}
                                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 pl-10 text-neutral-200 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all appearance-none"
                                        >
                                            <option value="" disabled>Select Profile</option>
                                            {profiles.map(p => (
                                                <option key={p.$id} value={p.$id}>{p.display_name}</option>
                                            ))}
                                        </select>
                                        <User className="w-4 h-4 text-neutral-500 absolute left-3 top-3.5 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-300">Security PIN</label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            maxLength={4}
                                            value={pin}
                                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                            placeholder="Enter 4-digit PIN"
                                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 pl-10 text-neutral-200 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all font-mono tracking-widest"
                                        />
                                        <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3.5" />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-300">Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-neutral-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-300">Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-neutral-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={cn(
                                "w-full py-3 rounded-lg font-semibold text-white shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]",
                                mode === 'user'
                                    ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400"
                                    : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
                            )}
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Sign In"}
                        </button>
                    </form>
                </div>

                {/* Footer Switcher */}
                <div className="p-4 bg-neutral-950/50 border-t border-neutral-800 text-center">
                    <button
                        onClick={() => {
                            setMode(mode === 'user' ? 'admin' : 'user');
                            setError('');
                        }}
                        className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                        {mode === 'user' ? (
                            <>
                                <ShieldCheck className="w-4 h-4" /> Switch to Admin Login
                            </>
                        ) : (
                            <>
                                <User className="w-4 h-4" /> Switch to User Login
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Login
