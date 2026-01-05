
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, Heart, Home, TrendingUp, 
  Film, Tv, Settings, Compass, Newspaper, ChevronUp, Info, Clapperboard, Filter, History, Sparkles, Zap, Ghost, Brain, Coffee, Rocket, Trash2
} from 'lucide-react';
import { Movie, WatchlistItem, SearchResult, WatchHistory } from './types';
import MovieCard from './components/MovieCard';
import DetailModal from './components/DetailModal';
import VideoPlayer from './components/VideoPlayer';
import NewsSection from './components/NewsSection';
import { gemini } from './services/geminiService';

type Tab = 'home' | 'movies' | 'tv' | 'watchlist' | 'trending' | 'news' | 'history' | 'dimensions';

const MOODS = [
  { id: 'Adrenaline', label: 'Adrenaline', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-500/10', sub: 'High stakes and fast pace' },
  { id: 'Noir', label: 'Noir', icon: Ghost, color: 'text-purple-500', bg: 'bg-purple-500/10', sub: 'Dark themes and deep mysteries' },
  { id: 'Cerebral', label: 'Cerebral', icon: Brain, color: 'text-blue-500', bg: 'bg-blue-500/10', sub: 'Mind-bending narratives' },
  { id: 'Zen', label: 'Zen', icon: Coffee, color: 'text-green-500', bg: 'bg-green-500/10', sub: 'Relaxed and comforting cinema' },
  { id: 'Eerie', label: 'Eerie', icon: Sparkles, color: 'text-red-500', bg: 'bg-red-500/10', sub: 'Supernatural and atmospheric' }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [activeDimension, setActiveDimension] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watchHistory, setWatchHistory] = useState<WatchHistory[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [streamingMovie, setStreamingMovie] = useState<Movie | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const savedWatchlist = localStorage.getItem('cv-watchlist');
    const savedHistory = localStorage.getItem('cv-history');
    if (savedWatchlist) try { setWatchlist(JSON.parse(savedWatchlist)); } catch (e) {}
    if (savedHistory) try { setWatchHistory(JSON.parse(savedHistory)); } catch (e) {}
  }, []);

  useEffect(() => { localStorage.setItem('cv-watchlist', JSON.stringify(watchlist)); }, [watchlist]);
  useEffect(() => { localStorage.setItem('cv-history', JSON.stringify(watchHistory)); }, [watchHistory]);

  const executeSearch = useCallback(async (query: string, type: any = 'all') => {
    if (!query.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const results = await gemini.searchEntertainment(query, type);
      setSearchResult(results);
    } catch (err) {
      console.error("Search engine failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  useEffect(() => {
    const queryMap: Record<string, { q: string, type: any }> = {
      movies: { q: "Cinema", type: "movie" },
      tv: { q: "Series", type: "series" },
      trending: { q: "Trending", type: "all" },
      home: { q: "Popular", type: "all" },
      dimensions: { q: activeDimension || "Adrenaline", type: "all" }
    };

    if (queryMap[activeTab] && !['watchlist', 'news', 'history'].includes(activeTab)) {
      executeSearch(queryMap[activeTab].q, queryMap[activeTab].type);
    }
    
    if (activeTab !== 'news') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, activeDimension, executeSearch]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 800);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const addToHistory = (movie: Movie) => {
    setWatchHistory(prev => {
      const filtered = prev.filter(item => item.id !== movie.id);
      return [{ ...movie, watchedAt: Date.now() }, ...filtered].slice(0, 50);
    });
  };

  const clearHistory = () => {
    if(confirm("Permanently wipe your cinematic logs?")) {
        setWatchHistory([]);
        localStorage.removeItem('cv-history');
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
    { id: 'home', icon: Home, label: 'Lobby' },
    { id: 'trending', icon: TrendingUp, label: 'Trends' },
    { id: 'dimensions', icon: Compass, label: 'Explore' },
    { id: 'movies', icon: Film, label: 'Cinema' },
    { id: 'tv', icon: Tv, label: 'Series' },
    { id: 'news', icon: Newspaper, label: 'Pulse' },
    { id: 'watchlist', icon: Heart, label: 'Vault' },
    { id: 'history', icon: History, label: 'History' },
  ];

  return (
    <div className="flex min-h-screen bg-[#050505] text-white selection:bg-blue-600/40 font-sans tracking-tight">
      <aside className="hidden lg:flex w-80 fixed inset-y-0 left-0 bg-[#080808] border-r border-white/5 flex-col z-40">
        <div className="p-10 flex items-center gap-5">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-600/30 border border-white/10">
            <Clapperboard size={28} />
          </div>
          <span className="text-xl font-black tracking-tighter italic uppercase leading-none">Cine<br/><span className="text-blue-500 text-sm">Vault Premium</span></span>
        </div>

        <nav className="flex-1 px-6 space-y-2 overflow-y-auto custom-scrollbar pb-10">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as Tab); if(item.id !== 'dimensions') setActiveDimension(null); }}
              className={`w-full flex items-center gap-5 px-6 py-4 rounded-2xl transition-all duration-300 group relative ${
                activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' 
                : 'text-gray-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={20} className={activeTab === item.id ? '' : 'group-hover:scale-110 transition-transform'} />
              <span className="font-black uppercase tracking-[0.2em] text-[10px]">{item.label}</span>
              {activeTab === item.id && <div className="absolute right-4 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]" />}
            </button>
          ))}
        </nav>
        
        <div className="p-8 border-t border-white/5">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-500 flex items-center justify-center font-black text-xs">A</div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[10px] font-black truncate">Archivist Node</p>
              <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Neural v4.2</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 lg:ml-80 relative pb-32 lg:pb-16 max-w-full overflow-x-hidden">
        <header className="sticky top-0 z-[45] bg-[#050505]/95 backdrop-blur-3xl h-24 flex items-center px-10 lg:px-20 border-b border-white/5">
          <div className="flex-1 max-w-4xl relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Query the Archive Database..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-700 font-bold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && executeSearch(searchQuery)}
            />
          </div>
        </header>

        <div className="p-10 lg:p-20 max-w-[1920px] mx-auto space-y-24">
          {activeTab === 'news' ? <NewsSection /> : (
            <>
              {activeTab === 'dimensions' && (
                <section className="space-y-12 animate-in fade-in slide-in-from-top-4 duration-700">
                  <div className="space-y-2">
                    <h2 className="text-6xl font-black tracking-tighter uppercase italic">Atmospheric <span className="text-blue-500">Filters</span></h2>
                    <p className="text-gray-500 font-black text-[10px] uppercase tracking-[0.4em]">Shift dimensions for neural mood retrieval</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    {MOODS.map(mood => (
                      <button 
                        key={mood.id}
                        onClick={() => setActiveDimension(mood.id)}
                        className={`flex flex-col items-start gap-4 p-8 rounded-[2rem] transition-all border text-left group ${
                          activeDimension === mood.id 
                          ? `bg-blue-600 border-blue-500 text-white shadow-2xl scale-[1.02]` 
                          : `bg-white/5 border-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10`
                        }`}
                      >
                        <mood.icon size={32} className={activeDimension === mood.id ? 'text-white' : mood.color} />
                        <div>
                           <span className="block font-black uppercase tracking-widest text-sm mb-1">{mood.label}</span>
                           <span className={`text-[9px] font-bold uppercase tracking-wider opacity-60 ${activeDimension === mood.id ? 'text-white' : 'text-gray-500'}`}>{mood.sub}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {activeTab === 'home' && watchHistory.length > 0 && (
                <section className="space-y-12 animate-in slide-in-from-left-8 duration-700">
                  <div className="flex items-center justify-between border-b border-white/5 pb-8">
                    <h3 className="text-3xl font-black tracking-tighter uppercase italic flex items-center gap-4">
                      <History className="text-blue-500" size={24} /> Recent Streams
                    </h3>
                  </div>
                  <div className="flex gap-10 overflow-x-auto pb-8 no-scrollbar snap-x">
                    {watchHistory.slice(0, 10).map(movie => (
                      <div key={movie.id} className="min-w-[200px] lg:min-w-[240px] snap-center">
                        <MovieCard movie={movie} onClick={setSelectedMovie} onWatchlistToggle={toggleWatchlist} isInWatchlist={isInWatchlist(movie.id)} />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="space-y-16">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-10 border-b border-white/5 pb-14">
                  <div className="flex items-center gap-10">
                    <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 text-blue-500 shadow-2xl">
                       {activeTab === 'trending' ? <Rocket size={48} /> : <Film size={48} />}
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-6xl font-black tracking-tighter uppercase italic leading-none">{activeTab} Results</h3>
                      <p className="text-[11px] font-black text-gray-500 uppercase tracking-[0.5em]">Neural Database Synchronization Complete</p>
                    </div>
                  </div>
                  {activeTab === 'history' && watchHistory.length > 0 && (
                    <button onClick={clearHistory} className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                        <Trash2 size={16} /> Wipe Logs
                    </button>
                  )}
                </div>

                {isLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-10 lg:gap-14">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="aspect-[2/3] bg-white/5 rounded-[2.5rem] animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-10 lg:gap-14">
                    {(activeTab === 'watchlist' ? watchlist : activeTab === 'history' ? watchHistory : (searchResult?.movies || [])).map(movie => (
                      <MovieCard key={movie.id} movie={movie} onClick={setSelectedMovie} onWatchlistToggle={toggleWatchlist} isInWatchlist={isInWatchlist(movie.id)} />
                    ))}
                    {(activeTab === 'watchlist' ? watchlist : activeTab === 'history' ? watchHistory : (searchResult?.movies || [])).length === 0 && (
                      <div className="col-span-full py-60 text-center space-y-6 bg-white/5 rounded-[4rem] border border-dashed border-white/10">
                        <Info size={64} className="mx-auto text-gray-800" />
                        <p className="text-3xl font-black text-gray-600 uppercase italic">Index Repository Empty</p>
                        <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest max-w-sm mx-auto">Query the system or add titles to your personal vault to begin synchronization.</p>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      {selectedMovie && (
        <DetailModal 
          movie={selectedMovie} 
          onClose={() => setSelectedMovie(null)}
          onWatch={(m) => { setSelectedMovie(null); setStreamingMovie(m); addToHistory(m); }}
          onWatchlistToggle={toggleWatchlist}
          isInWatchlist={isInWatchlist(selectedMovie.id)}
          onSelectMovie={setSelectedMovie}
        />
      )}

      {streamingMovie && <VideoPlayer movie={streamingMovie} onClose={() => setStreamingMovie(null)} />}

      <nav className="lg:hidden fixed bottom-0 inset-x-0 h-22 bg-[#080808]/95 backdrop-blur-3xl border-t border-white/5 flex items-center justify-around px-4 z-[49]">
        {navItems.slice(0, 4).map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id as Tab)} className={`flex flex-col items-center gap-1.5 ${activeTab === item.id ? 'text-blue-500' : 'text-gray-500'}`}>
            <item.icon size={20} />
            <span className="text-[7px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
        <button onClick={() => setActiveTab('watchlist')} className={`flex flex-col items-center gap-1.5 ${activeTab === 'watchlist' ? 'text-blue-500' : 'text-gray-500'}`}>
          <Heart size={20} />
          <span className="text-[7px] font-black uppercase tracking-widest">Vault</span>
        </button>
      </nav>

      {showScrollTop && (
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-32 right-10 lg:bottom-12 z-[100] bg-white text-black p-6 rounded-[2rem] shadow-4xl hover:-translate-y-3 transition-all active:scale-90"
        >
          <ChevronUp size={28} />
        </button>
      )}
    </div>
  );
};

export default App;
