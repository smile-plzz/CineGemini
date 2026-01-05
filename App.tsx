
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Heart, Home, TrendingUp, Sparkles, 
  Film, Tv, Settings, Compass, Newspaper, ChevronUp, Info
} from 'lucide-react';
import { Movie, WatchlistItem, SearchResult } from './types';
import MovieCard from './components/MovieCard';
import DetailModal from './components/DetailModal';
import ChatWidget from './components/ChatWidget';
import VideoPlayer from './components/VideoPlayer';
import NewsSection from './components/NewsSection';
import { gemini } from './services/geminiService';

type Tab = 'home' | 'movies' | 'tv' | 'watchlist' | 'trending' | 'news';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [streamingMovie, setStreamingMovie] = useState<Movie | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    handleSearch("Top critically acclaimed global cinema and viral TV hits 2024-2025");
    const handleScroll = () => setShowScrollTop(window.scrollY > 800);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const queryMap: Record<string, { q: string, type: any }> = {
      movies: { q: "Trending high-rated movies with global popularity", type: "movies" },
      tv: { q: "Most discussed TV series and streaming originals this season", type: "tv" },
      trending: { q: "Top trending global hits across all entertainment", type: "all" },
      home: { q: "Premium mix of high-impact movies and critically loved series", type: "all" }
    };

    if (queryMap[activeTab] && activeTab !== 'watchlist' && activeTab !== 'news') {
      handleSearch(queryMap[activeTab].q, queryMap[activeTab].type);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  const handleSearch = async (query: string, type: any = 'all') => {
    if (!query.trim() || isSearching) return;
    setIsSearching(true);
    try {
      const results = await gemini.searchEntertainment(query, type);
      setSearchResult(results);
    } catch (err) {
      console.error("Discovery Engine Stabilized:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleWatchlist = (movie: Movie) => {
    setWatchlist(prev => {
      const exists = prev.find(item => item.id === movie.id);
      if (exists) return prev.filter(item => item.id !== movie.id);
      return [...prev, { ...movie, addedAt: Date.now() }];
    });
  };

  const isInWatchlist = useMemo(() => (id: string) => watchlist.some(item => item.id === id), [watchlist]);

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'movies', icon: Film, label: 'Cinema' },
    { id: 'tv', icon: Tv, label: 'Series' },
    { id: 'trending', icon: TrendingUp, label: 'Hot' },
    { id: 'news', icon: Newspaper, label: 'Pulse' },
    { id: 'watchlist', icon: Heart, label: 'Vault' },
  ];

  return (
    <div className="flex min-h-screen bg-[#050505] text-white selection:bg-blue-600/40 font-sans tracking-tight">
      {/* Sidebar - Consistent Design */}
      <aside className="hidden lg:flex w-80 fixed inset-y-0 left-0 bg-[#080808] border-r border-white/5 flex-col z-40">
        <div className="p-12 flex items-center gap-5">
          <div className="w-14 h-14 bg-blue-600 rounded-[1.5rem] flex items-center justify-center shadow-3xl shadow-blue-600/40 border border-white/10">
            <Sparkles size={32} />
          </div>
          <span className="text-2xl font-black tracking-tighter italic uppercase leading-none">Cine<br/><span className="text-blue-500">Gemini</span></span>
        </div>

        <nav className="flex-1 px-8 space-y-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`w-full flex items-center gap-6 px-7 py-5 rounded-[1.75rem] transition-all duration-500 group relative ${
                activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/40 scale-[1.03]' 
                : 'text-gray-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={22} className={activeTab === item.id ? 'animate-pulse' : 'group-hover:scale-110 transition-transform duration-500'} />
              <span className="font-black uppercase tracking-[0.3em] text-[10px]">{item.label}</span>
              {activeTab === item.id && <div className="absolute right-5 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]" />}
            </button>
          ))}
        </nav>
        
        <div className="p-12 border-t border-white/5 space-y-8">
          <div className="flex items-center gap-5 bg-white/5 p-5 rounded-3xl border border-white/5">
            <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-sm shadow-xl">JD</div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[11px] font-black truncate">Cinephile Elite</p>
              <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">Premium Vault Node</p>
            </div>
          </div>
          <button className="flex items-center gap-5 text-gray-600 hover:text-white transition-all px-4 group">
            <Settings size={22} className="group-hover:rotate-45 transition-transform" />
            <span className="font-black uppercase tracking-[0.2em] text-[10px]">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 lg:ml-80 relative pb-32 lg:pb-16">
        <header className="sticky top-0 z-[45] bg-[#050505]/90 backdrop-blur-3xl h-28 flex items-center px-10 lg:px-24 border-b border-white/5">
          <div className="flex-1 max-w-3xl relative group">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input 
              type="text"
              placeholder="Query cinematic multiverses..."
              className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 pl-16 pr-8 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all placeholder:text-gray-700 font-semibold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
            />
          </div>
          <div className="ml-12 hidden sm:flex items-center gap-8 shrink-0">
             <button className="bg-white/5 p-5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all hover:scale-110 active:scale-90"><Compass size={24} /></button>
             <button className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-3xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95">Upgrade</button>
          </div>
        </header>

        <div className="p-10 lg:p-24 max-w-9xl mx-auto space-y-24">
          {activeTab === 'news' ? <NewsSection /> : (
            <>
              {activeTab === 'watchlist' ? (
                <section className="space-y-16 min-h-[60vh] animate-in slide-in-from-bottom-10 duration-700">
                  <div className="flex items-center gap-10 border-b border-white/5 pb-14">
                     <div className="p-10 bg-pink-500/10 rounded-[2.5rem] border border-pink-500/20 shadow-3xl shadow-pink-500/10">
                        <Heart className="text-pink-500" size={60} fill="currentColor" />
                     </div>
                     <div className="space-y-3">
                        <h2 className="text-7xl font-black tracking-tighter uppercase italic leading-none">Personal <br/><span className="text-pink-500">Vault</span></h2>
                        <p className="text-gray-500 font-bold uppercase tracking-[0.5em] text-[11px]">Securely Curated Cinema History</p>
                     </div>
                  </div>
                  
                  {watchlist.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-[4rem] p-40 text-center flex flex-col items-center gap-12 group transition-all duration-700 hover:border-blue-500/20">
                      <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center text-gray-800 group-hover:scale-110 group-hover:text-pink-500 transition-all duration-1000">
                        <Heart size={64} />
                      </div>
                      <div className="space-y-4">
                        <p className="text-gray-400 font-black text-3xl uppercase tracking-tighter">Vault Uninitialized</p>
                        <p className="text-gray-600 font-medium max-w-md mx-auto leading-relaxed text-lg">Your cinematic collection is empty. Synchronize with new movies to build your library.</p>
                      </div>
                      <button onClick={() => setActiveTab('home')} className="bg-blue-600 text-white px-14 py-6 rounded-3xl font-black text-sm uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-3xl">Enter Discovery</button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-12 lg:gap-16">
                      {watchlist.map(movie => (
                        <MovieCard 
                          key={movie.id} 
                          movie={movie} 
                          onClick={setSelectedMovie} 
                          onWatchlistToggle={toggleWatchlist}
                          isInWatchlist={true}
                        />
                      ))}
                    </div>
                  )}
                </section>
              ) : (
                <>
                  {/* Hero AI Insight Section */}
                  {searchResult && (
                    <div className="relative rounded-[4rem] overflow-hidden bg-gradient-to-br from-[#0a0a0a] to-[#0d1425] border border-white/10 p-12 lg:p-28 flex flex-col md:flex-row gap-24 items-center group shadow-4xl transition-all duration-700">
                      <div className="absolute top-0 right-0 -mr-32 -mt-32 p-60 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-1000 rotate-12 pointer-events-none">
                        <Sparkles size={800} />
                      </div>
                      
                      <div className="relative z-10 flex-1 space-y-16">
                        <div className="flex items-center gap-6">
                          <div className="bg-blue-600 px-8 py-2.5 rounded-full text-[10px] font-black tracking-[0.4em] uppercase shadow-3xl shadow-blue-600/50">Gemini Neural Pulse</div>
                          <div className="h-px w-16 bg-white/10" />
                          <span className="text-gray-500 text-[11px] font-bold uppercase tracking-[0.3em]">{activeTab} Stream</span>
                        </div>
                        <h2 className="text-7xl lg:text-[9rem] font-black leading-[0.8] tracking-tighter uppercase italic">Neural <br/><span className="text-blue-500">Insights.</span></h2>
                        <p className="text-gray-300 text-2xl lg:text-3xl font-medium max-w-3xl leading-snug italic opacity-95 border-l-4 border-blue-600 pl-12 py-2">
                          "{searchResult.aiInsight}"
                        </p>
                        <div className="flex flex-wrap gap-6 pt-6">
                          <button className="bg-white text-black px-14 py-6 rounded-3xl font-black text-sm uppercase tracking-[0.3em] hover:bg-blue-600 hover:text-white transition-all hover:-translate-y-2 active:scale-95 shadow-4xl">
                            Analyze Patterns
                          </button>
                        </div>
                      </div>

                      {searchResult.movies[0] && (
                        <div className="relative w-full md:w-[480px] shrink-0 hidden md:block perspective-1000">
                           <div className="relative aspect-[2/3] rounded-[4rem] overflow-hidden shadow-4xl transition-all duration-1000 group-hover:scale-[1.05] group-hover:rotate-3 border border-white/20">
                              <img src={searchResult.movies[0].posterUrl} className="w-full h-full object-cover" alt="Featured" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                              <div className="absolute bottom-12 left-12 right-12 text-center">
                                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500 mb-3">Prime Recommendation</p>
                                <h4 className="text-3xl font-black truncate tracking-tighter italic">{searchResult.movies[0].title}</h4>
                              </div>
                           </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Highlights Grid */}
                  <section className="space-y-20">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-10 border-b border-white/5 pb-16">
                      <div className="flex items-center gap-10">
                        <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 text-blue-500 shadow-2xl">
                          {activeTab === 'home' ? <Sparkles size={48} /> : <TrendingUp size={48} />}
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-6xl font-black tracking-tighter uppercase italic leading-none">
                            {activeTab} Highlights
                          </h3>
                          <p className="text-[11px] font-black text-gray-500 uppercase tracking-[0.5em]">Classified Cinematic Nodes</p>
                        </div>
                      </div>
                      <div className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em] bg-white/5 px-8 py-4 rounded-2xl border border-white/10 shadow-xl">
                        {searchResult?.movies.length || 0} TOTAL CLASSIFIED
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-12 lg:gap-16">
                      {searchResult?.movies.map(movie => (
                        <MovieCard 
                          key={movie.id} 
                          movie={movie} 
                          onClick={setSelectedMovie} 
                          onWatchlistToggle={toggleWatchlist}
                          isInWatchlist={isInWatchlist(movie.id)}
                        />
                      ))}
                    </div>
                  </section>

                  {/* Grounding Info - Unified */}
                  {searchResult && searchResult.sources.length > 0 && (
                    <div className="pt-32 opacity-30 hover:opacity-100 transition-opacity duration-700">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.6em] mb-10 flex items-center gap-4">
                        <Info size={20} className="text-blue-500" /> Grounding References
                      </h4>
                      <div className="flex flex-wrap gap-5">
                        {searchResult.sources.map((source, i) => (
                          <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-[11px] font-black uppercase tracking-widest bg-white/5 border border-white/10 px-8 py-4 rounded-2xl hover:bg-blue-600/20 hover:border-blue-500/30 transition-all active:scale-95 shadow-lg">
                            {source.title.slice(0, 45)}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* Global Overlays */}
      {selectedMovie && (
        <DetailModal 
          movie={selectedMovie} 
          onClose={() => setSelectedMovie(null)}
          onWatch={(m) => { setSelectedMovie(null); setStreamingMovie(m); }}
          onWatchlistToggle={toggleWatchlist}
          isInWatchlist={isInWatchlist(selectedMovie.id)}
          onSelectMovie={setSelectedMovie}
        />
      )}

      {streamingMovie && <VideoPlayer movie={streamingMovie} onClose={() => setStreamingMovie(null)} />}

      {isSearching && (
        <div className="fixed inset-0 z-[200] bg-[#050505]/98 backdrop-blur-4xl flex flex-col items-center justify-center p-16 text-center animate-in fade-in zoom-in duration-500">
          <div className="relative mb-24">
            <div className="w-80 h-80 border-[12px] border-blue-600/10 border-t-blue-600 rounded-full animate-spin shadow-[0_0_80px_rgba(37,99,235,0.2)]" />
            <div className="absolute inset-0 m-auto w-40 h-40 bg-blue-600 rounded-full blur-[120px] opacity-40 animate-pulse" />
            <Sparkles className="absolute inset-0 m-auto text-blue-500 animate-bounce" size={80} />
          </div>
          <div className="space-y-8">
            <h2 className="text-7xl lg:text-9xl font-black tracking-tighter uppercase italic leading-none">Neural<br/><span className="text-blue-500">Syncing</span></h2>
            <p className="text-gray-500 font-bold uppercase tracking-[0.8em] text-xs animate-pulse">Accessing Global Cinematic Database</p>
          </div>
        </div>
      )}

      {showScrollTop && (
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-12 right-12 z-[100] bg-white text-black p-6 rounded-[2rem] shadow-4xl hover:-translate-y-3 transition-all active:scale-90 group border-none"
          aria-label="Back to Top"
        >
          <ChevronUp size={32} className="group-hover:animate-bounce" />
        </button>
      )}

      <ChatWidget />
    </div>
  );
};

export default App;
