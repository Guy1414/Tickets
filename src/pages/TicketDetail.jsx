import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import db from '../lib/db';
import storageService from '../lib/storage';
import { Loader2, Send, Paperclip, CheckCircle, Clock, AlertCircle, Trash2, ArrowLeft, MessageSquare, X } from 'lucide-react';
import { cn } from '../lib/utils';

const TicketDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [files, setFiles] = useState([]);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const loadData = async () => {
        setLoading(true);
        try {
            // Load Ticket
            const ticketRes = await db.getTicket(id);
            setTicket(ticketRes);

            // Load Messages
            const messagesRes = await db.getMessages(id);
            setMessages(messagesRes.documents);
        } catch (error) {
            console.error("Failed to load ticket data", error);
            // navigate('/dashboard'); // Optional: redirect on error
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() && files.length === 0) return;

        setSending(true);
        try {
            // 1. Upload Files
            const attachmentIds = [];
            if (files.length > 0) {
                for (const file of files) {
                    const res = await storageService.uploadFile(file);
                    attachmentIds.push(res.$id);
                }
            }

            // 2. Send Message
            const msg = await db.createMessage(id, user.$id, newMessage, attachmentIds);
            setMessages(prev => [...prev, msg]);
            setNewMessage('');
            setFiles([]);
        } catch (error) {
            console.error("Failed to send message", error);
            alert("Failed to send message: " + error.message);
        } finally {
            setSending(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            setFiles(prev => [...prev, ...Array.from(e.target.files)]);
        }
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleStatusChange = async (newStatus) => {
        if (!confirm(`Are you sure you want to mark this ticket as ${newStatus}?`)) return;
        try {
            await db.updateTicketStatus(id, newStatus);
            setTicket(prev => ({ ...prev, status: newStatus }));
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-neutral-950 text-neutral-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!ticket) return null;

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header / Nav */}
                <button
                    onClick={() => navigate(user.isAdmin ? '/admin' : '/dashboard')}
                    className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </button>

                {/* Ticket Info Card */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start mb-6">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent mb-2">
                                {ticket.title}
                            </h1>
                            <div className="flex flex-wrap gap-2 text-sm text-neutral-400">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {new Date(ticket.$createdAt).toLocaleString()}
                                </span>
                                <span>•</span>
                                <span className={cn(
                                    "px-2 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider",
                                    ticket.priority === 'high' ? "bg-red-500/10 border-red-500/20 text-red-500" :
                                        ticket.priority === 'medium' ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" :
                                            "bg-blue-500/10 border-blue-500/20 text-blue-500"
                                )}>
                                    {ticket.priority} Priority
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg border",
                                ticket.status === 'open' && "bg-yellow-500/10 border-yellow-500/20 text-yellow-500",
                                ticket.status === 'in_progress' && "bg-blue-500/10 border-blue-500/20 text-blue-500",
                                ticket.status === 'resolved' && "bg-green-500/10 border-green-500/20 text-green-500",
                                ticket.status === 'closed' && "bg-neutral-800 border-neutral-700 text-neutral-400"
                            )}>
                                {ticket.status === 'resolved' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                <span className="capitalize font-medium">{ticket.status.replace('_', ' ')}</span>
                            </div>

                            {user.isAdmin && (
                                <div className="flex gap-2">
                                    {ticket.status !== 'closed' && (
                                        <button
                                            onClick={() => handleStatusChange('closed')}
                                            className="p-2 hover:bg-red-900/30 text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-900/50"
                                            title="Close Ticket"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                    {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                                        <button
                                            onClick={() => handleStatusChange('resolved')}
                                            className="p-2 hover:bg-green-900/30 text-green-400 rounded-lg transition-colors border border-transparent hover:border-green-900/50"
                                            title="Mark Resolved"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="prose prose-invert max-w-none text-neutral-300 bg-neutral-950/50 p-4 rounded-xl border border-neutral-800">
                        <p>{ticket.description}</p>
                    </div>

                    {/* Attachments */}
                    {ticket.attachments && ticket.attachments.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-sm font-medium text-neutral-400 mb-3 flex items-center gap-2">
                                <Paperclip className="w-4 h-4" /> Attachments
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {ticket.attachments.map(fileId => (
                                    <a
                                        key={fileId}
                                        href={storageService.getFileView(fileId)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 px-3 py-2 rounded-lg text-sm transition-colors border border-neutral-700"
                                    >
                                        <span>View Attachment</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Chat Section */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[500px]">
                    <div className="p-4 border-b border-neutral-800 bg-neutral-900/50">
                        <h2 className="font-semibold flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-blue-500" /> Discussion
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {messages.length === 0 ? (
                            <div className="text-center text-neutral-500 py-10">
                                <p>No messages yet. Start the conversation!</p>
                            </div>
                        ) : (
                            messages.map(msg => {
                                const isMe = msg.sender_id === user.$id;
                                return (
                                    <div key={msg.$id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                                        <div className={cn(
                                            "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                                            isMe
                                                ? "bg-blue-600/20 text-blue-100 border border-blue-500/20 rounded-tr-none"
                                                : "bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-tl-none"
                                        )}>
                                            <p>{msg.content}</p>

                                            {/* Message Attachments */}
                                            {msg.attachments && msg.attachments.length > 0 && (
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {msg.attachments.map(fileId => (
                                                        <MessageAttachment key={fileId} fileId={fileId} />
                                                    ))}
                                                </div>
                                            )}

                                            <p className={cn("text-[10px] mt-1 opacity-50", isMe ? "text-right" : "text-left")}>
                                                {new Date(msg.$createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 border-t border-neutral-800 bg-neutral-900/50">
                        {/* Selected Files Preview */}
                        {files.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {files.map((file, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-neutral-800 px-3 py-1.5 rounded-lg text-xs text-neutral-300 border border-neutral-700">
                                        <span className="truncate max-w-[150px]">{file.name}</span>
                                        <button onClick={() => removeFile(i)} className="hover:text-red-400"><X className="w-3 h-3" /></button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <input
                                type="file"
                                id="chat-file-upload"
                                multiple
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            <label
                                htmlFor="chat-file-upload"
                                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg cursor-pointer transition-colors"
                                title="Attach files"
                            >
                                <Paperclip className="w-5 h-5" />
                            </label>

                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                            />
                            <button
                                type="submit"
                                disabled={sending || (!newMessage.trim() && files.length === 0)}
                                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
                            >
                                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </button>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
}

const MessageAttachment = ({ fileId }) => {
    const [isImage, setIsImage] = useState(true);

    if (isImage) {
        return (
            <a
                href={storageService.getFileView(fileId)}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-lg border border-neutral-700/50 hover:border-blue-500/50 transition-colors"
            >
                <img
                    src={storageService.getFilePreview(fileId)}
                    alt="Attachment"
                    className="max-w-[200px] max-h-[200px] object-cover"
                    onError={() => setIsImage(false)}
                />
            </a>
        );
    }

    return (
        <a
            href={storageService.getFileView(fileId)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 transition-colors text-neutral-300"
        >
            <Paperclip className="w-3 h-3" />
            <span>Attachment</span>
        </a>
    );
};

export default TicketDetail
