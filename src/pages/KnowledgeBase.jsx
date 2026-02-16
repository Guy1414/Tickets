import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import db from '../lib/db';
import { Search, Plus, Edit2, Trash2, ArrowLeft, Book, Loader2, Save, X } from 'lucide-react';

const KnowledgeBase = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState(null);

    // Editor State
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [content, setContent] = useState('');

    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
        if (user) loadArticles();
    }, [user, authLoading]);

    const loadArticles = async () => {
        setLoading(true);
        try {
            const res = await db.getArticles(true); // Get all published
            setArticles(res.documents);
        } catch (error) {
            console.error("Failed to load articles", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredArticles = articles.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (article) => {
        setEditingArticle(article);
        setTitle(article.title);
        setCategory(article.category);
        setContent(article.content);
        setIsEditorOpen(true);
    };

    const handleCreate = () => {
        setEditingArticle(null);
        setTitle('');
        setCategory('');
        setContent('');
        setIsEditorOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingArticle) {
                await db.updateArticle(editingArticle.$id, { title, category, content });
            } else {
                await db.createArticle(title, content, category);
            }
            setIsEditorOpen(false);
            loadArticles();
        } catch (error) {
            alert("Failed to save article");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this article?")) return;
        try {
            await db.deleteArticle(id);
            loadArticles();
        } catch (error) {
            alert("Failed to delete article");
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-50 relative">
            <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/dashboard" className="p-2 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <Book className="w-5 h-5 text-purple-500" />
                            Knowledge Base
                        </h1>
                    </div>
                    {user?.isAdmin && (
                        <button
                            onClick={handleCreate}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> New Article
                        </button>
                    )}
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-8">
                {/* Search */}
                <div className="relative mb-8">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search for help..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all text-lg placeholder:text-neutral-600"
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                    </div>
                ) : filteredArticles.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500">
                        <p>No articles found.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredArticles.map(article => (
                            <div key={article.$id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider bg-purple-500/10 px-2 py-0.5 rounded-md">
                                            {article.category}
                                        </span>
                                        <h2 className="text-xl font-bold mt-2">{article.title}</h2>
                                    </div>
                                    {user?.isAdmin && (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEdit(article)} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(article.$id)} className="p-1.5 hover:bg-red-900/20 rounded-lg text-neutral-400 hover:text-red-400 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="prose prose-invert prose-sm max-w-none text-neutral-300">
                                    <p className="whitespace-pre-wrap">{article.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Editor Modal */}
            {isEditorOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">{editingArticle ? 'Edit Article' : 'New Article'}</h2>
                            <button onClick={() => setIsEditorOpen(false)} className="text-neutral-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 outline-none focus:border-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">Category</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Billing, Technical, General"
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 outline-none focus:border-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">Content</label>
                                <textarea
                                    required
                                    rows={8}
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 outline-none focus:border-purple-500 resize-none font-mono text-sm"
                                />
                            </div>
                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                                >
                                    <Save className="w-4 h-4" /> Save Article
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KnowledgeBase;
