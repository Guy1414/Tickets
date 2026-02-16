import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import db from '../lib/db';
import storageService from '../lib/storage';
import { Loader2, Send, Paperclip, CheckCircle, Clock, AlertCircle, Trash2, ArrowLeft, MessageSquare, X, RotateCcw, Tag, Lock, Zap, Star } from 'lucide-react';
import { cn } from '../lib/utils';

const TicketDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [ticketOwner, setTicketOwner] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [files, setFiles] = useState([]);
    const [isInternal, setIsInternal] = useState(false);
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

            // Load Owner Profile (if we have an owner_id)
            if (ticketRes.owner_id) {
                try {
                    const profile = await db.getProfileByUserId(ticketRes.owner_id);
                    setTicketOwner(profile);
                } catch (e) {
                    console.log("Could not load owner profile", e);
                }
            }

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

    const handleUpdateTicket = async (updates) => {
        try {
            await db.updateTicket(id, updates);
            setTicket(prev => ({ ...prev, ...updates }));
        } catch (error) {
            console.error("Failed to update ticket", error);
            alert("Failed to update ticket");
        }
    };

    const handleAddTag = async (newTag) => {
        if (!newTag.trim()) return;
        const currentTags = ticket.tags || [];
        if (currentTags.includes(newTag.trim())) return;

        const updatedTags = [...currentTags, newTag.trim()];
        handleUpdateTicket({ tags: updatedTags });
    };

    const handleRemoveTag = async (tagToRemove) => {
        const currentTags = ticket.tags || [];
        const updatedTags = currentTags.filter(t => t !== tagToRemove);
        handleUpdateTicket({ tags: updatedTags });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() && files.length === 0) return;

        setSending(true);
        try {
            let attachmentIds = [];

            // Upload files if any
            if (files.length > 0) {
                const uploadPromises = files.map(file => storageService.uploadFile(file));
                const uploadedFiles = await Promise.all(uploadPromises);
                attachmentIds = uploadedFiles.map(file => file.$id);
            }

            await db.createMessage(id, user.$id, newMessage, attachmentIds, isInternal);

            setNewMessage('');
            setFiles([]);
            setIsInternal(false); // Reset internal status

            // Refresh messages
            const messagesRes = await db.getMessages(id);
            setMessages(messagesRes.documents);
        } catch (error) {
            console.error("Failed to send message", error);
            alert("Failed to send message");
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
        <>
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
                                    {user.isAdmin && ticketOwner && (
                                        <>
                                            <span>•</span>
                                            <span className="text-indigo-400 font-medium">
                                                Opened by {ticketOwner.display_name}
                                            </span>
                                        </>
                                    )}
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
                                        {/* Priority Dropdown */}
                                        <select
                                            value={ticket.priority}
                                            onChange={(e) => handleUpdateTicket({ priority: e.target.value })}
                                            className="bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs rounded-lg px-2 py-1 outline-none focus:border-indigo-500"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>

                                        {/* Status Actions */}
                                        {ticket.status === 'closed' || ticket.status === 'resolved' ? (
                                            <button
                                                onClick={() => handleStatusChange('open')}
                                                className="p-2 hover:bg-yellow-900/30 text-yellow-400 rounded-lg transition-colors border border-transparent hover:border-yellow-900/50"
                                                title="Reopen Ticket"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleStatusChange('resolved')}
                                                    className="p-2 hover:bg-green-900/30 text-green-400 rounded-lg transition-colors border border-transparent hover:border-green-900/50"
                                                    title="Mark Resolved"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange('closed')}
                                                    className="p-2 hover:bg-red-900/30 text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-900/50"
                                                    title="Close Ticket"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tags Section */}
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <Tag className="w-4 h-4 text-neutral-500" />
                            {ticket.tags && ticket.tags.map((tag, index) => (
                                <div key={index} className="bg-neutral-800 border border-neutral-700 px-2 py-1 rounded-md text-xs text-neutral-300 flex items-center gap-1">
                                    {tag}
                                    {user.isAdmin && (
                                        <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-400">
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {user.isAdmin && (
                                <div className="flex items-center gap-1">
                                    <input
                                        type="text"
                                        placeholder="Add tag..."
                                        className="bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1 text-xs text-neutral-300 w-24 focus:w-32 transition-all outline-none focus:border-indigo-500"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleAddTag(e.currentTarget.value);
                                                e.currentTarget.value = '';
                                            }
                                        }}
                                    />
                                </div>
                            )}
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
                                    const isInternal = msg.is_internal;

                                    // Hide internal notes from non-admins
                                    if (isInternal && !user.isAdmin) return null;

                                    return (
                                        <div key={msg.$id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                                            <div className={cn(
                                                "max-w-[80%] rounded-2xl px-4 py-3 text-sm relative",
                                                isInternal
                                                    ? "bg-yellow-500/10 text-yellow-100 border border-yellow-500/30 dashed-border"
                                                    : isMe
                                                        ? "bg-blue-600/20 text-blue-100 border border-blue-500/20 rounded-tr-none"
                                                        : "bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-tl-none"
                                            )}>
                                                {isInternal && (
                                                    <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-yellow-500 uppercase tracking-widest border-b border-yellow-500/20 pb-1">
                                                        <Lock className="w-3 h-3" /> Internal Note
                                                    </div>
                                                )}
                                                <p className="whitespace-pre-wrap">{msg.content}</p>

                                                {/* Message Attachments */}
                                                {msg.attachments && msg.attachments.length > 0 && (
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {msg.attachments.map(fileId => (
                                                            <MessageAttachment key={fileId} fileId={fileId} />
                                                        ))}
                                                    </div>
                                                )}

                                                <p className={cn("text-[10px] mt-2 opacity-50 font-mono", isMe ? "text-right" : "text-left")}>
                                                    {new Date(msg.$createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* CSAT Rating */}
                        {(ticket.status === 'closed' || ticket.status === 'resolved') && (
                            <div className="mt-8 p-6 bg-neutral-900/50 border border-neutral-800 rounded-xl text-center animate-in fade-in slide-in-from-bottom-4">
                                <h3 className="font-bold text-neutral-300 mb-2">How was our service?</h3>
                                {ticket.rating ? (
                                    <div className="flex justify-center gap-1 text-yellow-500">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <Star key={star} className={cn("w-6 h-6", star <= ticket.rating ? "fill-current" : "text-neutral-700")} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex justify-center gap-2">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                onClick={() => handleUpdateTicket({ rating: star })}
                                                className="group transition-transform hover:scale-110 focus:outline-none"
                                            >
                                                <Star className="w-8 h-8 text-neutral-700 group-hover:text-yellow-500 fill-transparent group-hover:fill-yellow-500 transition-colors" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {ticket.rating && <p className="text-sm text-neutral-500 mt-2">Thank you for your feedback!</p>}
                            </div>
                        )}
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

                        <form onSubmit={handleSendMessage} className="flex flex-col gap-3">
                            {user.isAdmin && (
                                <div className="flex items-center justify-between px-2 bg-neutral-800/50 p-2 rounded-lg border border-neutral-800">
                                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest cursor-pointer select-none hover:opacity-80 transition-opacity">
                                        <div className={cn("w-4 h-4 rounded border flex items-center justify-center transition-colors", isInternal ? "bg-yellow-500 border-yellow-500 text-black" : "border-neutral-600 bg-transparent")}>
                                            {isInternal && <CheckCircle className="w-3 h-3" />}
                                        </div>
                                        <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} className="hidden" />
                                        <span className={isInternal ? "text-yellow-500" : "text-neutral-500"}>Internal Note (Private)</span>
                                    </label>

                                    <div className="flex items-center gap-2">
                                        <Zap className="w-3 h-3 text-neutral-500" />
                                        <select
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    setNewMessage(e.target.value);
                                                    // setIsInternal(false); // Optional: keep previous state?
                                                }
                                            }}
                                            className="bg-transparent text-xs text-neutral-400 outline-none hover:text-white cursor-pointer"
                                            value=""
                                        >
                                            <option value="">Quick Replies...</option>
                                            <option value="Hi there, could you please provide more details about the issue?">Ask Details</option>
                                            <option value="We are currently investigating this issue and will update you shortly.">Investigating</option>
                                            <option value="Please try resetting your PIN from the main login screen.">Reset PIN</option>
                                            <option value="This ticket has been resolved. If you have further issues, feel free to reopen it.">Resolved</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <input
                                    type="file"
                                    id="chat-file-upload"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <label
                                    htmlFor="chat-file-upload"
                                    className={cn(
                                        "p-2 rounded-lg cursor-pointer transition-colors flex items-center justify-center border",
                                        isInternal
                                            ? "text-yellow-500/50 hover:text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/10"
                                            : "text-neutral-400 hover:text-white border-transparent hover:bg-neutral-800"
                                    )}
                                    title="Attach files"
                                >
                                    <Paperclip className="w-5 h-5" />
                                </label>

                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={isInternal ? "Add an internal note..." : "Type your message..."}
                                    className={cn(
                                        "flex-1 border rounded-lg px-4 py-2 outline-none transition-all",
                                        isInternal
                                            ? "bg-neutral-900 border-yellow-900/50 focus:border-yellow-500 text-yellow-100 placeholder:text-yellow-500/30"
                                            : "bg-neutral-950 border-neutral-800 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                                    )}
                                />
                                <button
                                    type="submit"
                                    disabled={sending || (!newMessage.trim() && files.length === 0)}
                                    className={cn(
                                        "text-white p-2 rounded-lg transition-colors",
                                        isInternal
                                            ? "bg-yellow-600 hover:bg-yellow-500"
                                            : "bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    )}
                                >
                                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

            </div>
        </>
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
