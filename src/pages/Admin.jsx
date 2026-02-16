import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import db from '../lib/db';
import { Loader2, LogOut, CheckCircle, RotateCcw, Shield, Users, Settings, Plus, Trash2, ShieldCheck, Mail } from 'lucide-react';
import { cn } from '../lib/utils';
import { ThemeToggle } from '../components/ThemeToggle';

const Admin = () => {
    const { user, isAdmin, logout, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('tickets'); // tickets, users, settings
    const [loading, setLoading] = useState(false);

    // Data
    const [tickets, setTickets] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [pinEnabled, setPinEnabled] = useState(true);

    // Modals/Forms State
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [newUserValues, setNewUserValues] = useState({ name: '', pin: '' });

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            navigate('/login');
        } else if (!isAdmin) {
            navigate('/dashboard');
        } else {
            loadData();
        }
    }, [user, isAdmin, authLoading, activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'tickets') {
                const res = await db.getTickets(null);
                setTickets(res.documents);
            } else if (activeTab === 'users') {
                const res = await db.getProfiles();
                setProfiles(res.documents);
            } else if (activeTab === 'settings') {
                const setting = await db.getGlobalSetting('require_pin');
                setPinEnabled(setting ? setting.value === 'true' : true);
            }
        } catch (error) {
            console.error("Failed to load admin data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTicket = async (id) => {
        if (!confirm("Are you sure you want to delete this ticket?")) return;
        await db.updateTicketStatus(id, 'closed');
        loadData();
    };

    const handleVerifyUser = async (profileId) => {
        try {
            await db.verifyUser(profileId);
            loadData();
        } catch (error) {
            console.error("Failed to verify user", error);
        }
    };

    const handleTogglePin = async () => {
        const newValue = !pinEnabled;
        try {
            await db.updateGlobalSetting('require_pin', newValue);
            setPinEnabled(newValue);
        } catch (error) {
            console.error("Failed to toggle setting", error);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await db.createProfile(null, newUserValues.name);
            setIsUserModalOpen(false);
            setNewUserValues({ name: '', pin: '' });
            loadData();
            alert("Local profile created. Note: Admin-side Auth User creation requires a Cloud Function or Manual Console entry.");
        } catch (error) {
            console.error(error);
            alert("Failed to create user profile");
        }
    };

    if (!isAdmin) return null;

    return (
        <div className="flex h-screen bg-neutral-950 text-neutral-50 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-68 bg-neutral-900 border-r border-neutral-800 flex flex-col hidden md:flex">
                <div className="p-8 text-center">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-600/30">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight mb-1">Admin Portal</h1>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">SafeGuard Security</p>
                </div>

                <nav className="flex-1 px-4 space-y-1.5 mt-2">
                    <button
                        onClick={() => setActiveTab('tickets')}
                        className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm", activeTab === 'tickets' ? "bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 shadow-inner" : "text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300")}
                    >
                        <Mail className="w-5 h-5" /> Tickets
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm", activeTab === 'users' ? "bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 shadow-inner" : "text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300")}
                    >
                        <Users className="w-5 h-5" /> User Approval
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm", activeTab === 'settings' ? "bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 shadow-inner" : "text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300")}
                    >
                        <Settings className="w-5 h-5" /> Global Settings
                    </button>
                </nav>

                <div className="p-6 border-t border-neutral-800 bg-neutral-900/50 backdrop-blur">
                    <div className="flex items-center justify-between mb-4">
                        <ThemeToggle />
                        <button
                            onClick={logout}
                            className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Sign Out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold">AD</div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-bold text-neutral-200 truncate">{user.email}</p>
                            <p className="text-[10px] text-neutral-500 font-medium">Administrator</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/5 via-neutral-950 to-neutral-950">
                {activeTab === 'tickets' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-4xl font-extrabold tracking-tight">Support Tickets</h2>
                                <p className="text-neutral-400 mt-2">Manage and monitor all incoming user requests.</p>
                            </div>
                            <div className="flex gap-2">
                                <div className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                                    <span className="text-xs font-bold text-neutral-300 uppercase tracking-tighter">{tickets.filter(t => t.status === 'open').length} Open</span>
                                </div>
                            </div>
                        </div>

                        {loading ? <div className="flex py-32 justify-center"><Loader2 className="animate-spin text-indigo-500 w-12 h-12" /></div> : (
                            <div className="bg-neutral-900/40 backdrop-blur-md border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl transition-all">
                                <table className="w-full text-left">
                                    <thead className="bg-neutral-900/60 border-b border-neutral-800 text-neutral-500 uppercase text-[10px] tracking-widest font-black">
                                        <tr>
                                            <th className="px-8 py-5">Ticket Info</th>
                                            <th className="px-8 py-5">Status</th>
                                            <th className="px-8 py-5">Priority</th>
                                            <th className="px-8 py-5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-800/40">
                                        {tickets.map(t => (
                                            <tr key={t.$id} className="hover:bg-indigo-500/5 transition-all group">
                                                <td className="px-8 py-6">
                                                    <Link to={`/tickets/${t.$id}`} className="block group-hover:translate-x-1 transition-transform">
                                                        <p className="font-bold text-neutral-100 group-hover:text-indigo-400 transition-colors truncate max-w-xs">{t.title}</p>
                                                        <p className="text-[10px] text-neutral-500 mt-1 font-medium">{new Date(t.$createdAt).toLocaleString()}</p>
                                                    </Link>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border",
                                                        t.status === 'open' && "text-yellow-500 border-yellow-500/20 bg-yellow-500/10",
                                                        t.status === 'resolved' && "text-green-500 border-green-500/20 bg-green-500/10",
                                                        t.status === 'closed' && "text-neutral-500 border-neutral-700 bg-neutral-800/50"
                                                    )}>{t.status.replace('_', ' ')}</span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn("w-1.5 h-1.5 rounded-full",
                                                            t.priority === 'high' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" :
                                                                t.priority === 'medium' ? "bg-yellow-500" : "bg-blue-500"
                                                        )}></div>
                                                        <span className="text-xs font-bold uppercase tracking-tight text-neutral-300">{t.priority}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button onClick={() => handleDeleteTicket(t.$id)} className="text-neutral-600 hover:text-red-400 p-2.5 hover:bg-red-500/10 rounded-xl transition-all inline-flex items-center gap-2">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-4xl font-extrabold tracking-tight">User Approvals</h2>
                                <p className="text-neutral-400 mt-2">Verify and manage access for newly registered users.</p>
                            </div>
                            <button
                                onClick={() => setIsUserModalOpen(true)}
                                className="bg-white text-black hover:bg-neutral-200 font-bold px-6 py-3 rounded-2xl flex items-center gap-2 shadow-xl transition-all active:scale-95"
                            >
                                <Plus className="w-5 h-5" /> Manual Account
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {profiles.length === 0 ? (
                                <div className="col-span-full py-32 text-center text-neutral-600 border-4 border-dashed border-neutral-900 rounded-[3rem] flex flex-col items-center gap-4">
                                    <Users className="w-16 h-16 opacity-20" />
                                    <p className="font-bold text-xl">No users found in the registry.</p>
                                </div>
                            ) : profiles.map(p => (
                                <div key={p.$id} className="group bg-neutral-900/50 backdrop-blur border border-neutral-800 p-8 rounded-[2rem] flex flex-col gap-6 shadow-xl hover:border-indigo-500/40 transition-all relative overflow-hidden">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xl font-black text-indigo-400 uppercase tracking-tighter">
                                                {p.display_name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-xl text-neutral-100 group-hover:text-indigo-400 transition-colors truncate max-w-[150px]">{p.display_name}</h3>
                                                <p className="text-[10px] text-neutral-500 font-mono tracking-tighter">REF: {p.$id.substring(0, 8)}</p>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border",
                                            p.verified
                                                ? "bg-green-500/10 border-green-500/20 text-green-500"
                                                : "bg-red-500/10 border-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                                        )}>
                                            {p.verified ? <ShieldCheck className="w-3 h-3" /> : <Loader2 className="w-3 h-3 animate-spin" />}
                                            {p.verified ? "Active" : "Pending"}
                                        </div>
                                    </div>

                                    <div className="flex gap-3 mt-4">
                                        {!p.verified ? (
                                            <button
                                                onClick={() => handleVerifyUser(p.$id)}
                                                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95 text-xs uppercase tracking-widest"
                                            >
                                                Approve Account
                                            </button>
                                        ) : (
                                            <div className="flex-1 h-12 flex items-center justify-center bg-neutral-800/30 rounded-2xl border border-neutral-800">
                                                <CheckCircle className="w-5 h-5 text-neutral-600" />
                                            </div>
                                        )}
                                        <button className="w-12 h-12 flex items-center justify-center rounded-2xl border border-neutral-800 text-neutral-500 hover:text-white hover:border-neutral-700 transition-all group/btn" title="Reset Session">
                                            <RotateCcw className="w-5 h-5 group-hover/btn:rotate-180 transition-transform duration-500" />
                                        </button>
                                        <button className="w-12 h-12 flex items-center justify-center rounded-2xl border border-neutral-800 text-neutral-600 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/5 transition-all">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Modal Mock (simplified) */}
                        {isUserModalOpen && (
                            <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
                                <div className="bg-neutral-900 border border-neutral-800 p-10 rounded-[2.5rem] w-full max-w-lg shadow-[0_0_100px_rgba(79,70,229,0.1)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
                                    <h3 className="text-3xl font-black mb-2 tracking-tight">Create Manual Link</h3>
                                    <p className="text-neutral-500 text-sm mb-8 font-medium">Link a profile to an internal ticketing account.</p>
                                    <form onSubmit={handleCreateUser} className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2 ml-1">Full Identity Name</label>
                                            <input
                                                value={newUserValues.name}
                                                onChange={e => setNewUserValues({ ...newUserValues, name: e.target.value })}
                                                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold"
                                                required
                                                placeholder="e.g. John Doe"
                                            />
                                        </div>
                                        <div className="flex gap-4 pt-4">
                                            <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 px-4 py-4 hover:bg-neutral-800 rounded-2xl text-neutral-400 font-bold transition-all">Cancel</button>
                                            <button type="submit" className="flex-1 px-4 py-4 bg-white text-black hover:bg-neutral-200 rounded-2xl font-black transition-all shadow-2xl">Create Profile</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="space-y-8 animate-in zoom-in-95 duration-500">
                        <div>
                            <h2 className="text-4xl font-extrabold tracking-tight">Settings</h2>
                            <p className="text-neutral-400 mt-2">Configure system-wide security and behaviors.</p>
                        </div>

                        <div className="max-w-2xl space-y-4">
                            <div className="bg-neutral-900/50 border border-neutral-800 p-8 rounded-[2.5rem] flex items-center justify-between hover:border-indigo-500/20 transition-all">
                                <div className="flex items-start gap-5">
                                    <div className="p-4 bg-indigo-600/10 rounded-2xl">
                                        <Shield className="w-8 h-8 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">Mandatory PIN Challenge</h3>
                                        <p className="text-neutral-500 text-sm mt-1 max-w-[280px] font-medium leading-relaxed">Require 4-digit verification for all standard user sessions.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleTogglePin}
                                    className={cn(
                                        "w-16 h-8 rounded-full transition-all relative p-1",
                                        pinEnabled ? "bg-indigo-600 shadow-lg shadow-indigo-600/40" : "bg-neutral-800"
                                    )}
                                >
                                    <div className={cn(
                                        "w-6 h-6 bg-white rounded-full transition-all transform",
                                        pinEnabled ? "translate-x-8" : "translate-x-0"
                                    )} />
                                </button>
                            </div>

                            <div className="p-8 border border-neutral-800 rounded-[2.5rem] bg-indigo-500/5">
                                <p className="text-xs text-neutral-500 font-medium leading-relaxed uppercase tracking-tighter">Note for Admin:</p>
                                <p className="text-sm text-neutral-400 mt-2 leading-relaxed italic">Changes to global security settings are applied instantly to all subsequent login attempts. Current active sessions will not be invalidated.</p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Admin
