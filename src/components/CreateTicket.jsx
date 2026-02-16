import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import db from '../lib/db';
import storageService from '../lib/storage';
import { X, Loader2, Upload, File } from 'lucide-react';

const CreateTicket = ({ onClose, onCreated }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [files, setFiles] = useState([]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Upload Files
            const attachmentIds = [];
            if (files.length > 0) {
                for (const file of files) {
                    const res = await storageService.uploadFile(file);
                    attachmentIds.push(res.$id);
                }
            }

            // 2. Create Ticket
            await db.createTicket(
                user.$id,
                title,
                description,
                priority,
                attachmentIds
            );

            onCreated();
        } catch (error) {
            console.error("Failed to create ticket", error);
            alert("Failed to create ticket");
        } finally {
            setLoading(false);
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

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-800">
                    <h2 className="text-xl font-bold text-white">New Ticket</h2>
                    <button
                        onClick={onClose}
                        className="text-neutral-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <form id="create-ticket-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-300">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Brief summary of the issue"
                                required
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-neutral-200 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-300">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Detailed explanation... (Markdown supported)"
                                rows={5}
                                required
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-neutral-200 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all resize-y"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-300">Priority</label>
                            <div className="flex gap-4">
                                {['low', 'medium', 'high'].map(p => (
                                    <label key={p} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="priority"
                                            value={p}
                                            checked={priority === p}
                                            onChange={(e) => setPriority(e.target.value)}
                                            className="w-4 h-4 text-blue-500 bg-neutral-950 border-neutral-800 focus:ring-blue-500 focus:ring-offset-0"
                                        />
                                        <span className="capitalize text-neutral-300">{p}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-300">Attachments</label>
                            <div className="border-2 border-dashed border-neutral-800 rounded-lg p-6 text-center hover:border-neutral-700 transition-colors bg-neutral-950/50">
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                    <Upload className="w-8 h-8 text-neutral-500" />
                                    <span className="text-sm text-neutral-400">Click to upload files</span>
                                </label>
                            </div>

                            {files.length > 0 && (
                                <ul className="space-y-2 mt-2">
                                    {files.map((file, i) => (
                                        <li key={i} className="flex items-center justify-between text-sm bg-neutral-800/50 p-2 rounded-lg">
                                            <span className="flex items-center gap-2 text-neutral-300 truncate">
                                                <File className="w-4 h-4" />
                                                {file.name}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeFile(i)}
                                                className="text-neutral-500 hover:text-red-400 p-1"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-neutral-800 flex justify-end gap-3 bg-neutral-900/50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="create-ticket-form"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Create Ticket
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CreateTicket
