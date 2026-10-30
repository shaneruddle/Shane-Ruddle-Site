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
  ArrowRight
} from 'lucide-react';
import type { BlogPost } from '../firebase';
// Dates are shown in Pattaya time so every visitor sees the publish date as written.
const formatPostDate = (d: Date, month: 'long' | 'short') =>
  d.toLocaleDateString('en-US', { month, day: '2-digit', year: 'numeric', timeZone: 'Asia/Bangkok' });
import { cn } from '../lib/utils';
import { navigate, handleLinkClick } from '../lib/navigation';
import NewsletterSignup from './NewsletterSignup';
import ArticleComments from './ArticleComments';
import ArticleView from './ArticleView';
import { applyPageMeta, PAGE_META } from '../seo';
import { FILE_ARTICLES } from '../lib/fileArticles';

// Articles committed as files (content/articles) in the same shape as Firestore posts.
const filePosts: BlogPost[] = FILE_ARTICLES.map(a => ({
  id: a.slug,
  slug: a.slug,
  title: a.title,
  metaDescription: a.description,
  body: a.body,
  category: a.category as BlogPost['category'],
  imageUrl: a.image,
  authorName: 'Shane Ruddle',
  published: true,
  createdAt: { toDate: () => new Date(`${a.date}T00:00:00+07:00`) } as BlogPost['createdAt'],
}));

const mergePosts = (firestorePosts: BlogPost[]) => {
  const fileSlugs = new Set(filePosts.map(p => p.slug));
  return [...filePosts, ...firestorePosts.filter(p => !fileSlugs.has(p.slug || p.id))]
    .sort((a, b) => (b.createdAt?.toDate().getTime() || 0) - (a.createdAt?.toDate().getTime() || 0));
};

// Each article lives at /articles/<slug> (slug field, or the doc id when no slug is set).
const articlePath = (post: BlogPost) => `/articles/${post.slug || post.id}`;
const slugFromPath = (pathname: string) => {
  const m = pathname.match(/^\/articles\/([^/]+)\/?$/);
  return m ? decodeURIComponent(m[1]) : null;
};

interface BlogPageProps {
  onBack: () => void;
}

const CATEGORIES = ['All', 'My Advice', 'Property', 'Car Rental', 'Pattaya News'] as const;

export default function BlogPage({ onBack }: BlogPageProps) {
  const [posts, setPosts] = useState<BlogPost[]>(filePosts);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[number]>('All');
  const [slug, setSlug] = useState<string | null>(() => slugFromPath(window.location.pathname));
  // Cards whose header image failed to load fall back to the text-only layout.
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const onPop = () => setSlug(slugFromPath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Firestore posts load lazily so file-based articles still show if Firebase can't start.
  // On a file-based article page they aren't needed, so the Firebase code isn't loaded there.
  const needsFirestore = !slug || !filePosts.some(p => p.slug === slug);
  useEffect(() => {
    if (!needsFirestore) return;
    let unsubscribe = () => {};
    let cancelled = false;
    Promise.all([import('../firebase'), import('firebase/firestore')])
      .then(([{ db }, { collection, query, where, orderBy, onSnapshot }]) => {
        if (cancelled) return;
        const q = query(collection(db, 'blog'), where('published', '==', true), orderBy('createdAt', 'desc'));
        unsubscribe = onSnapshot(q, (snapshot) => {
          const fetchedPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
          setPosts(mergePosts(fetchedPosts));
          setLoading(false);
        }, (error) => {
          console.error("Error fetching blog posts:", error);
          setLoading(false);
        });
      })
      .catch((error) => {
        console.error("Could not load Firestore posts:", error instanceof Error ? error.message : error);
        setLoading(false);
      });
    return () => { cancelled = true; unsubscribe(); };
  }, [needsFirestore]);

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (post.keywords && post.keywords.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedPost = slug ? posts.find(p => (p.slug || p.id) === slug) || null : null;

  useEffect(() => {
    if (selectedPost) {
      applyPageMeta({
        title: `${selectedPost.title} | Shane Ruddle`,
        description: selectedPost.metaDescription || selectedPost.body.replace(/[#*_>`\[\]]/g, '').slice(0, 155),
      });
    } else if (!slug) {
      applyPageMeta(PAGE_META['/articles']);
    }
  }, [selectedPost, slug]);

  if (slug && !selectedPost) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] pt-40 pb-24 px-6 text-center">
        {loading ? (
          <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
        ) : (
          <>
            <h1 className="text-4xl font-serif mb-4">Article not found</h1>
            <p className="text-black/50 mb-8">It may have been moved or unpublished.</p>
            <a href="/articles" onClick={handleLinkClick} className="text-gold-deep font-bold uppercase tracking-widest text-[11px]">All articles</a>
          </>
        )}
      </div>
    );
  }

  if (selectedPost) {
    return (
      <ArticleView
        title={selectedPost.title}
        body={selectedPost.body}
        category={selectedPost.category}
        createdAt={selectedPost.createdAt?.toDate()}
        imageUrl={selectedPost.imageUrl}
      >
        {selectedPost.keywords && (
          <div className="mt-12 flex flex-wrap gap-2">
            {selectedPost.keywords.split(',').map((tag, i) => (
              <span key={i} className="flex items-center gap-1 px-3 py-1 bg-black/5 text-black/40 text-[10px] uppercase tracking-widest font-bold rounded-full">
                <Tag className="w-3 h-3" /> {tag.trim()}
              </span>
            ))}
          </div>
        )}

        <div className="mt-12 p-8 md:p-12 bg-ink rounded-[2rem]">
          <h4 className="text-3xl font-serif text-white mb-2">Get the next article by email</h4>
          <p className="text-white/60 font-light mb-6">One email a week on property, business and life in Pattaya.</p>
          <NewsletterSignup dark source="article" />
        </div>

        <ArticleComments slug={selectedPost.slug || selectedPost.id} />
      </ArticleView>
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
              <motion.a
                key={post.id}
                href={articlePath(post)}
                onClick={handleLinkClick}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group cursor-pointer block"
              >
                {post.imageUrl && !brokenImages.has(post.id) && (
                  <div className="relative aspect-[16/10] rounded-[2rem] overflow-hidden mb-6 shadow-xl shadow-black/5">
                    <img 
                      src={post.imageUrl} 
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                      onError={() => setBrokenImages(prev => new Set(prev).add(post.id))}
                    />
                    <div className="absolute top-6 left-6">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-black text-[9px] font-bold uppercase tracking-widest rounded-full">
                        {post.category}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="px-2">
                  {(!post.imageUrl || brokenImages.has(post.id)) && (
                    <span className="inline-block px-3 py-1 bg-black/5 text-black text-[9px] font-bold uppercase tracking-widest rounded-full mb-4">
                      {post.category}
                    </span>
                  )}
                  <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest text-black/40 mb-4 font-bold">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gold" />
                      {post.createdAt ? formatPostDate(post.createdAt.toDate(), 'short') : 'Recently'}
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
              </motion.a>
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
