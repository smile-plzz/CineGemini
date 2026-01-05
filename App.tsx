
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Search, Heart, Home, TrendingUp, 
  Film, Tv, Compass, Newspaper, ChevronUp, Clapperboard, History, Sparkles, Zap, Ghost, Brain, Coffee, Rocket, Trash2, SlidersHorizontal, Info, Play
} from 'lucide-react';
import { Movie, WatchlistItem, SearchResult, WatchHistory } from './types';
import MovieCard from './components/MovieCard';
import DetailModal from './components/DetailModal';
import VideoPlayer from './components/VideoPlayer';
import NewsSection from './components/NewsSection';
import { gemini, SearchFilters } from './services/geminiService';

type Tab = 'home' | 'movies' | 'tv' | 'watchlist' | 'trending' | 'news' | 'history' | 'dimensions';

const MOODS = [
  { id: 'Adrenaline', label: 'Adrenaline', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { id: 'Noir', label: 'Noir', icon: Ghost, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 'Cerebral', label: 'Cerebral', icon: Brain, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'Zen', label: 'Zen', icon: Coffee, color: 'text-green-500', bg: 'bg-green-500/10' },
  { id: 'Eerie', label: 'Eerie', icon: Sparkles, color: 'text-red-500', bg: 'bg-red-500/10' }
];

const GENRES = ["Action", "Sci-Fi", "Comedy", "Horror", "Drama", "Thriller", "Adventure", "Animation", "Crime"];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({ type: 'all', year: '', genre: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watchHistory, setWatchHistory] = useState<WatchHistory[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [streamingMovie, setStreamingMovie] = useState<Movie | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Persistence Engine
  useEffect(() => {
    const savedWatchlist = localStorage.getItem('cv-vault');
    const savedHistory = localStorage.getItem('cv-logs');
    if (savedWatchlist) try { setWatchlist(JSON.parse(savedWatchlist)); } catch (e) {}
    if (savedHistory) try { setWatchHistory(JSON.parse(savedHistory)); } catch (e) {}
  }, []);

  useEffect(() => { localStorage.setItem('cv-vault', JSON.stringify(watchlist)); }, [watchlist]);
  useEffect(() => { localStorage.setItem('cv-logs', JSON.stringify(watchHistory)); }, [watchHistory]);

  const triggerDiscovery = useCallback(async (query: string, filters: SearchFilters) => {
    setIsLoading(true);
    try {
      const results = await gemini.searchEntertainment(query, filters);
      setSearchResult(results);
    } catch (err) {
      console.error("Discovery module fault:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Contextual Auto-Fetcher
  useEffect(() => {
    if (['watchlist', 'news', 'history'].includes(activeTab)) return;

    let targetQuery = searchQuery;
    let targetFilters = { ...searchFilters };

    if (!searchQuery) {
      const tabMappings: Record<string, string> = {
        home: 'Popular',
        movies: 'Cinema',
        tv: 'Series',
        trending: 'Trending',
        dimensions: 'Adrenaline'
      };
      targetQuery = tabMappings[activeTab] || 'Popular';
      
      // Enforce type constraints based on tab if not manually searching
      if (activeTab === 'movies') targetFilters.type = 'movie';
      if (activeTab === 'tv') targetFilters.type = 'series';
    }

    triggerDiscovery(targetQuery, targetFilters);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, triggerDiscovery, searchFilters]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSearchQuery(''); // Reset search query on tab change to trigger auto-fetch with defaults
    setSearchFilters({ type: 'all', year: '', genre: '' }); // Reset filters for clean tab state
  };

  const handleManualSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    triggerDiscovery(searchQuery || 'Popular', searchFilters);
  };

  const applyFilters = (f: Partial<SearchFilters>) => {
    setSearchFilters(prev => ({ ...prev, ...f }));
  };

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 800);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const addToHistory = (m: Movie) => {
    setWatchHistory(prev => {
      const filtered = prev.filter(item => item.id !== m.id);
      return [{ ...m, watchedAt: Date.now() }, ...filtered].slice(0, 30);
    });
  };

  const toggleWatchlist = (m: Movie) => {
    setWatchlist(prev => {
      const exists = prev.find(item => item.id === m.id);
      if (exists) return prev.filter(item => item.id !== m.id);
      return [...prev, { ...m, addedAt: Date.now() }];
    });
  };

  const isInWatchlist = useMemo(() => (id: string) => watchlist.some(i => i.id === id), [watchlist]);

  const navItems = [
    { id: 'home', icon: Home, label: 'Lobby' },
    { id: 'trending', icon: TrendingUp, label: 'Trends' },
    { id: 'dimensions', icon: Compass, label: 'Moods' },
    { id: 'movies', icon: Film, label: 'Cinema' },
    { id: 'tv', icon: Tv, label: 'Series' },
    { id: 'news', icon: Newspaper, label: 'Pulse' },
    { id: 'watchlist', icon: Heart, label: 'Vault' },
    { id: 'history', icon: History, label: 'Logs' },
  ];

  return (
    <div className="flex min-h-screen bg-[#050505] text-white selection:bg-blue-600/40 font-sans tracking-tight">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 fixed inset-y-0 left-0 bg-[#080808] border-r border-white/5 flex-col z-50">
        <div className="p-10 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-600/30 border border-white/10">
            <Rocket size={20} />
          </div>
          <span className="text-xl font-black italic tracking-tighter uppercase leading-none">Cine<span className="text-blue-500">Vault</span></span>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id as Tab)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 group ${
                activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' 
                : 'text-gray-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={18} className={activeTab === item.id ? 'scale-110' : 'group-hover:scale-110 transition-transform'} />
              <span className="font-black uppercase tracking-[0.2em] text-[9px]">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 lg:ml-72 relative pb-24 lg:pb-12 max-w-full">
        <header className="sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-3xl border-b border-white/5 px-6 lg:px-12 py-5">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <form onSubmit={handleManualSearch} className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500 transition-colors" size={16} />
              <input 
                type="text"
                placeholder="Query the cinematic archive..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all font-bold"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-xl border transition-all ${showFilters ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
              aria-label="Toggle Filters"
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>

          {showFilters && (
            <div className="max-w-6xl mx-auto pt-6 flex flex-wrap gap-4 animate-in slide-in-from-top-4 duration-500">
              <div className="flex-1 min-w-[150px] space-y-2">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">Media Origin</p>
                <div className="flex bg-white/5 rounded-xl border border-white/10 p-1">
                  {['all', 'movie', 'series'].map(t => (
                    <button 
                      key={t}
                      onClick={() => applyFilters({ type: t as any })}
                      className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${searchFilters.type === t ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500'}`}
                    >
                      {t === 'series' ? 'TV' : t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-28 space-y-2">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">Era</p>
                <input 
                  type="number" 
                  placeholder="2024"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  value={searchFilters.year}
                  onChange={(e) => applyFilters({ year: e.target.value })}
                />
              </div>
              <div className="flex-1 min-w-[180px] space-y-2">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">Genre Alignment</p>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs focus:outline-none"
                  value={searchFilters.genre}
                  onChange={(e) => applyFilters({ genre: e.target.value })}
                >
                  <option value="">All Genres</option>
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
          )}
        </header>

        <div className="p-6 lg:p-12 max-w-6xl mx-auto space-y-20 animate-cinematic">
          {activeTab === 'news' ? <NewsSection /> : (
            <>
              {activeTab === 'dimensions' && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {MOODS.map(m => (
                    <button 
                      key={m.id}
                      onClick={() => { setSearchQuery(m.id); triggerDiscovery(m.id, searchFilters); }}
                      className={`flex flex-col items-center gap-4 p-6 rounded-[2rem] border transition-all group ${searchQuery === m.id ? 'bg-blue-600 border-blue-500 text-white shadow-2xl' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                    >
                      <m.icon size={28} className={searchQuery === m.id ? 'text-white' : m.color} />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{m.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'home' && watchHistory.length > 0 && (
                <section className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                      <History size={20} className="text-blue-500" /> RESUME SYNC
                    </h3>
                  </div>
                  <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar snap-x">
                    {watchHistory.map(m => (
                      <div key={m.id} className="min-w-[150px] lg:min-w-[190px] snap-center">
                        <MovieCard movie={m} onClick={setSelectedMovie} onWatchlistToggle={toggleWatchlist} isInWatchlist={isInWatchlist(m.id)} />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="space-y-10">
                <div className="flex flex-col sm:flex-row items-center justify-between border-b border-white/5 pb-8 gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <h2 className="text-4xl lg:text-5xl font-black italic uppercase tracking-tighter leading-none">{activeTab} Discovery</h2>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Optimized Neural Retrieval System</p>
                  </div>
                </div>

                {isLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 lg:gap-10">
                    {Array.from({ length: 12 }).map((_, i) => <div key={i} className="aspect-[2/3] bg-white/5 rounded-2xl animate-pulse" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 lg:gap-10">
                    {(activeTab === 'watchlist' ? watchlist : activeTab === 'history' ? watchHistory : (searchResult?.movies || [])).map(m => (
                      <MovieCard key={m.id} movie={m} onClick={setSelectedMovie} onWatchlistToggle={toggleWatchlist} isInWatchlist={isInWatchlist(m.id)} />
                    ))}
                  </div>
                )}
                
                {(!isLoading && (activeTab === 'watchlist' ? watchlist : activeTab === 'history' ? watchHistory : (searchResult?.movies || [])).length === 0) && (
                  <div className="py-40 text-center space-y-6 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                    <Info size={48} className="mx-auto text-gray-700" />
                    <p className="text-2xl font-black text-gray-600 uppercase italic">Repository Empty</p>
                    <button onClick={() => handleTabChange('home')} className="px-8 py-3 bg-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">Return to Lobby</button>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 h-20 bg-[#080808]/95 backdrop-blur-3xl border-t border-white/5 flex items-center justify-around px-2 z-50">
        {navItems.slice(0, 4).map(item => (
          <button key={item.id} onClick={() => handleTabChange(item.id as Tab)} className={`flex flex-col items-center gap-1.5 flex-1 transition-colors ${activeTab === item.id ? 'text-blue-500' : 'text-gray-500'}`}>
            <item.icon size={20} />
            <span className="text-[7px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
        <button onClick={() => handleTabChange('watchlist')} className={`flex flex-col items-center gap-1.5 flex-1 transition-colors ${activeTab === 'watchlist' ? 'text-blue-500' : 'text-gray-500'}`}>
          <Heart size={20} />
          <span className="text-[7px] font-black uppercase tracking-widest">Vault</span>
        </button>
      </nav>

      {selectedMovie && <DetailModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} onWatch={(m) => { setSelectedMovie(null); setStreamingMovie(m); addToHistory(m); }} onWatchlistToggle={toggleWatchlist} isInWatchlist={isInWatchlist(selectedMovie.id)} onSelectMovie={setSelectedMovie} />}
      {streamingMovie && <VideoPlayer movie={streamingMovie} onClose={() => setStreamingMovie(null)} />}

      {showScrollTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-24 right-6 lg:bottom-12 lg:right-12 z-[60] bg-white text-black p-4 rounded-2xl shadow-3xl transition-all hover:-translate-y-2 active:scale-90">
          <ChevronUp size={28} />
        </button>
      )}
    </div>
  );
};

export default App;
