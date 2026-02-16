import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import db from '../lib/db';
import { Plus, LogOut, Loader2, MessageSquare, Clock, CheckCircle, AlertCircle, ShieldCheck, Book } from 'lucide-react';
import { cn } from '../lib/utils';
import CreateTicket from '../components/CreateTicket';
import { ThemeToggle } from '../components/ThemeToggle';
import { useState, useEffect } from 'react';

const Dashboard = () => {
    const { user, logout, verified, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (user) loadTickets();
    }, [user]);

    const loadTickets = async () => {
        setLoading(true);
        try {
            const res = await db.getTickets(user.isAdmin ? null : user.$id);
            setTickets(res.documents);
        } catch (error) {
            console.error("Failed to load tickets", error);
        } finally {
            setLoading(false);
        }
    };

    const StatusIcon = ({ status }) => {
        switch (status) {
            case 'open': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
            case 'in_progress': return <Clock className="w-5 h-5 text-blue-500" />;
            case 'resolved': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'closed': return <CheckCircle className="w-5 h-5 text-neutral-500" />;
            default: return <AlertCircle className="w-5 h-5 text-neutral-500" />;
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-50">
            {/* Header */}
            <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                        Tickets
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-neutral-400 hidden sm:inline-block">
                            Logged in as <span className="text-neutral-200 font-medium">{user?.name}</span>
                        </span>
                        <Link to="/knowledge-base" className="p-2 hover:bg-neutral-800 rounded-full transition-colors text-neutral-400 hover:text-purple-400" title="Knowledge Base">
                            <Book className="w-5 h-5" />
                        </Link>
                        <ThemeToggle />
                        <button
                            onClick={logout}
                            className="p-2 hover:bg-neutral-800 rounded-full transition-colors text-neutral-400 hover:text-red-400"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 py-8">
                {!verified && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 text-yellow-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-yellow-500">Verification Pending</h3>
                            <p className="text-sm text-yellow-500/80">Your account needs admin approval before you can create new tickets. Please check back soon!</p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold">Your Tickets</h2>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        disabled={!verified}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:grayscale"
                    >
                        <Plus className="w-5 h-5" />
                        New Ticket
                    </button>
                </div>

                {/* Ticket List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-neutral-800 rounded-xl bg-neutral-900/30">
                        <MessageSquare className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-neutral-300">No tickets yet</h3>
                        <p className="text-neutral-500">Create your first ticket to get started.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {tickets.map(ticket => (
                            <Link
                                key={ticket.$id}
                                to={`/tickets/${ticket.$id}`}
                                className="group block bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl p-5 transition-all hover:shadow-lg hover:shadow-blue-500/5 relative overflow-hidden"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-lg group-hover:text-blue-400 transition-colors">
                                                {ticket.title}
                                            </h3>
                                            <span className={cn(
                                                "text-xs px-2 py-0.5 rounded-full border capitalize",
                                                ticket.status === 'open' && "bg-yellow-500/10 border-yellow-500/20 text-yellow-500",
                                                ticket.status === 'in_progress' && "bg-blue-500/10 border-blue-500/20 text-blue-500",
                                                ticket.status === 'resolved' && "bg-green-500/10 border-green-500/20 text-green-500",
                                                ticket.status === 'closed' && "bg-neutral-800 border-neutral-700 text-neutral-400"
                                            )}>
                                                {ticket.status?.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <p className="text-neutral-400 line-clamp-2 text-sm">
                                            {ticket.description}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 text-xs text-neutral-500">
                                        <span>{new Date(ticket.$createdAt).toLocaleDateString()}</span>
                                        <StatusIcon status={ticket.status} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>

            {/* Create Ticket Modal */}
            {isCreateOpen && (
                <CreateTicket
                    onClose={() => setIsCreateOpen(false)}
                    onCreated={() => {
                        setIsCreateOpen(false);
                        loadTickets();
                    }}
                />
            )}
        </div>
    );
}

export default Dashboard
