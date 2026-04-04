import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  ArrowLeft, 
  ChevronRight, 
  Clock,
  Tag,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { db, BlogPost } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

interface BlogPageProps {
  onBack: () => void;
}

const CATEGORIES = ['All', 'My Advice', 'Property', 'Car Rental', 'Pattaya News'] as const;

export default function BlogPage({ onBack }: BlogPageProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[number]>('All');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    const blogRef = collection(db, 'blog');
    const q = query(
      blogRef, 
      where('published', '==', true),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as BlogPost));
      setPosts(fetchedPosts);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching blog posts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (post.keywords && post.keywords.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (selectedPost) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-white"
      >
        {/* Post Header */}
        <div className="relative h-[60vh] w-full overflow-hidden">
          {selectedPost.imageUrl ? (
            <img 
              src={selectedPost.imageUrl} 
              alt={selectedPost.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-black flex items-center justify-center">
               <span className="text-white/20 font-serif text-8xl uppercase tracking-widest opacity-10">Shane Ruddle</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 max-w-7xl mx-auto">
            <motion.button 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setSelectedPost(null)}
              className="flex items-center gap-2 text-white/60 hover:text-gold transition-colors mb-8 uppercase tracking-widest text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" /> Back to News
            </motion.button>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="px-3 py-1 bg-gold text-black text-[10px] font-bold uppercase tracking-widest rounded-full mb-6 inline-block">
                {selectedPost.category}
              </span>
              <h1 className="text-4xl md:text-6xl font-serif text-white mb-8 leading-tight max-w-4xl">
                {selectedPost.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-8 text-white/60 text-xs uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gold" />
                  {selectedPost.authorName || 'Shane Ruddle'}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gold" />
                  {selectedPost.createdAt ? format(selectedPost.createdAt.toDate(), 'MMMM dd, yyyy') : 'Recently'}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gold" />
                  {Math.ceil(selectedPost.body.split(' ').length / 200)} min read
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Post Content */}
        <div className="max-w-4xl mx-auto px-6 py-24">
          <div className="prose prose-lg prose-gold max-w-none">
            <div className="markdown-body text-black/70 font-light leading-relaxed text-lg">
              <ReactMarkdown>{selectedPost.body}</ReactMarkdown>
            </div>
          </div>
          
          {selectedPost.keywords && (
            <div className="mt-16 pt-8 border-t border-black/5">
              <div className="flex flex-wrap gap-2">
                {selectedPost.keywords.split(',').map((tag, i) => (
                  <span key={i} className="flex items-center gap-1 px-3 py-1 bg-black/5 text-black/40 text-[10px] uppercase tracking-widest font-bold rounded-full">
                    <Tag className="w-3 h-3" /> {tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-24 p-12 bg-[#F8F8F8] rounded-[2rem] flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 shadow-xl">
              <img 
                src="/input_file_3.png" 
                alt="Shane Ruddle" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h4 className="text-xl font-serif mb-2">About the Author</h4>
              <p className="text-black/60 font-light leading-relaxed mb-4">
                Shane Ruddle is a visionary entrepreneur based in Pattaya, Thailand, with a diverse portfolio of successful ventures in real estate, hospitality, and automotive sectors.
              </p>
              <button 
                onClick={onBack}
                className="text-gold font-bold uppercase tracking-widest text-[10px] hover:text-gold-dark transition-colors"
              >
                View Full Portfolio
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-black/40 hover:text-gold transition-colors mb-6 uppercase tracking-widest text-[10px] font-bold"
            >
              <ArrowLeft className="w-3 h-3" /> Back to Home
            </button>
            <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-gold mb-4 block">Insights & Updates</span>
            <h1 className="text-5xl md:text-7xl font-serif">Pattaya <span className="italic">Chronicles</span></h1>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-4 w-full md:w-96"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
              <input 
                type="text" 
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-black/5 rounded-full pl-12 pr-6 py-4 text-sm font-light focus:outline-none focus:border-gold transition-all shadow-sm"
              />
            </div>
          </motion.div>
        </div>

        {/* Categories */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-3 mb-16"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                selectedCategory === cat 
                  ? "bg-black text-white shadow-lg shadow-black/10" 
                  : "bg-white text-black/40 border border-black/5 hover:border-gold hover:text-gold"
              )}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-48 gap-4">
            <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] uppercase tracking-widest text-gold animate-pulse">Loading Articles...</span>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post, idx) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setSelectedPost(post)}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[16/10] rounded-[2rem] overflow-hidden mb-6 shadow-xl shadow-black/5">
                  {post.imageUrl ? (
                    <img 
                      src={post.imageUrl} 
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-black flex items-center justify-center">
                      <Sparkles className="w-12 h-12 text-gold/20" />
                    </div>
                  )}
                  <div className="absolute top-6 left-6">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-black text-[9px] font-bold uppercase tracking-widest rounded-full">
                      {post.category}
                    </span>
                  </div>
                </div>
                
                <div className="px-2">
                  <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest text-black/40 mb-4 font-bold">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gold" />
                      {post.createdAt ? format(post.createdAt.toDate(), 'MMM dd, yyyy') : 'Recently'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gold" />
                      {Math.ceil(post.body.split(' ').length / 200)} min
                    </span>
                  </div>
                  <h3 className="text-2xl font-serif mb-4 group-hover:text-gold transition-colors leading-tight">
                    {post.title}
                  </h3>
                  <p className="text-black/50 font-light text-sm line-clamp-2 mb-6 leading-relaxed">
                    {post.metaDescription || post.body.substring(0, 150) + '...'}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-gold group-hover:gap-4 transition-all">
                    Read Article <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-48 bg-[#F8F8F8] rounded-[3rem] border border-dashed border-black/10">
            <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-black/20" />
            </div>
            <h3 className="text-2xl font-serif mb-2">No articles found</h3>
            <p className="text-black/40 font-light mb-8">Try adjusting your search or filters to find what you're looking for.</p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
              }}
              className="text-gold font-bold uppercase tracking-widest text-[10px]"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
