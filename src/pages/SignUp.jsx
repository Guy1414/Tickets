import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, UserPlus, ArrowLeft, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { ThemeToggle } from '../components/ThemeToggle';

const SignUp = () => {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignUp = async (e) => {
        e.preventDefault();
        if (pin.length !== 4) {
            setError('PIN must be exactly 4 digits');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await register(name, pin);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Failed to sign up');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-50 flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl overflow-hidden relative">
                <div className="p-8 text-center border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md">
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent mb-2">
                        Join Us
                    </h1>
                    <p className="text-neutral-400 text-sm">Create your account to start ticketing</p>
                </div>

                <form onSubmit={handleSignUp} className="p-8 space-y-6">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-1.5 ml-1">Your Full Name</label>
                            <div className="relative group">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-green-500 transition-colors">
                                    <UserPlus className="w-5 h-5" />
                                </span>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all placeholder:text-neutral-600"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-1.5 ml-1">Create 4-Digit PIN</label>
                            <div className="relative group">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-green-500 transition-colors">
                                    <ShieldCheck className="w-5 h-5" />
                                </span>
                                <input
                                    type="password"
                                    required
                                    maxLength={4}
                                    pattern="\d{4}"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                    placeholder="••••"
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all placeholder:text-neutral-600 text-2xl tracking-[1em]"
                                />
                            </div>
                            <p className="text-[10px] text-neutral-500 mt-2 ml-1">This PIN will be your password for all future logins.</p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-green-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                <ShieldCheck className="w-5 h-5" /> Sign Up
                            </>
                        )}
                    </button>

                    <div className="text-center pt-4 border-t border-neutral-800">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Already have an account? Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignUp;
