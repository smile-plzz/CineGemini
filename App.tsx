import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, Heart, Home, TrendingUp, 
  Film, Tv, Compass, Newspaper, ChevronDown, History, Sparkles, Zap, Ghost, Brain, Coffee, Rocket, SlidersHorizontal, Info, Cpu, ArrowDown
} from 'lucide-react';
import { Movie, WatchlistItem, SearchResult, WatchHistory } from './types';
import MovieCard from './components/MovieCard';
import DetailModal from './components/DetailModal';
import VideoPlayer from './components/VideoPlayer';
import NewsSection from './components/NewsSection';
import NowPlayingCarousel from './components/NowPlayingCarousel';
import { movieService, SearchFilters } from './services/movieService';

type Tab = 'home' | 'movies' | 'tv' | 'watchlist' | 'trending' | 'news' | 'history' | 'dimensions';

const MOODS = [
  { id: 'Adrenaline', label: 'Adrenaline', icon: Zap, color: 'text-orange-500', query: 'action adventure' },
  { id: 'Noir', label: 'Noir', icon: Ghost, color: 'text-purple-500', query: 'crime thriller mystery' },
  { id: 'Cerebral', label: 'Cerebral', icon: Brain, color: 'text-blue-500', query: 'science fiction drama' },
  { id: 'Zen', label: 'Zen', icon: Coffee, color: 'text-green-500', query: 'documentary family' },
  { id: 'Eerie', label: 'Eerie', icon: Sparkles, color: 'text-red-500', query: 'horror fantasy' }
];

const App: React.FC = () => {
  // --- State ---
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [activeMood, setActiveMood] = useState(MOODS[0]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({ type: 'all', year: '', genre: '' });
  const [showFilters, setShowFilters] = useState(false);
  
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watchHistory, setWatchHistory] = useState<WatchHistory[]>([]);
  
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [streamingMovie, setStreamingMovie] = useState<Movie | null>(null);

  // --- Persistence ---
  useEffect(() => {
    const savedVault = localStorage.getItem('cinevault-vault');
    const savedLogs = localStorage.getItem('cinevault-logs');
    if (savedVault) try { setWatchlist(JSON.parse(savedVault)); } catch (e) {}
    if (savedLogs) try { setWatchHistory(JSON.parse(savedLogs)); } catch (e) {}
  }, []);

  useEffect(() => { localStorage.setItem('cinevault-vault', JSON.stringify(watchlist)); }, [watchlist]);
  useEffect(() => { localStorage.setItem('cinevault-logs', JSON.stringify(watchHistory)); }, [watchHistory]);

  // --- Search Debounce ---
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 600);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // --- Discovery Logic ---
  const fetchContent = useCallback(async (reset = false) => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    const currentPage = reset ? 1 : page;
    let query = debouncedQuery;
    let filters = { ...searchFilters };

    // Default Tab Logic
    if (!query) {
      if (activeTab === 'home') query = 'trending'; // Or '2024'
      else if (activeTab === 'movies') { query = 'movie'; filters.type = 'movie'; }
      else if (activeTab === 'tv') { query = 'series'; filters.type = 'series'; }
      else if (activeTab === 'trending') query = 'popular';
      else if (activeTab === 'dimensions') query = activeMood.query;
    }

    try {
      // Pass page to service (assuming service handles pagination, if not, it just fetches default)
      // We append a simple timestamp or page param if your service supports it
      const results = await movieService.searchEntertainment(query, filters); 
      
      setMovies(prev => reset ? results.movies : [...prev, ...results.movies]);
      setHasMore(results.movies.length > 0); 
      if (reset) setPage(2);
      else setPage(p => p + 1);

    } catch (err: any) {
      console.error("Discovery error:", err);
      setError("Synchronisation error. Neural Link unstable.");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, debouncedQuery, searchFilters, activeMood, page]);

  // --- Trigger Fetch on Tab/Filter Change ---
  useEffect(() => {
    if (['watchlist', 'news', 'history'].includes(activeTab)) return;
    fetchContent(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, debouncedQuery, activeMood, searchFilters.type]); // Removed fetchContent from dependency to avoid loop

  // --- Handlers ---
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSearchQuery('');
    setSearchFilters({ type: 'all', year: '', genre: '' });
  };

  const addToHistory = (m: Movie) => {
    setWatchHistory(prev => {
      const filtered = prev.filter(item => item.id !== m.id);
      return [{ ...m, watchedAt: Date.now() }, ...filtered].slice(0, 20);
    });
  };

  const toggleWatchlist = (m: Movie) => {
    setWatchlist(prev => {
      const exists = prev.find(item => item.id === m.id);
      if (exists) return prev.filter(item => item.id !== m.id);
      return [...prev, { ...m, addedAt: Date.now() }];
    });
  };

  const isInWatchlist = (id: string) => watchlist.some(i => i.id === id);

  // --- Derived State ---
  const displayMovies = useMemo(() => {
    if (activeTab === 'watchlist') return watchlist;
    if (activeTab === 'history') return watchHistory;
    return movies;
  }, [activeTab, watchlist, watchHistory, movies]);

  const navItems = [
    { id: 'home', icon: Home, label: 'Lobby' },
    { id: 'trending', icon: TrendingUp, label: 'Trends' },
    { id: 'movies', icon: Film, label: 'Cinema' },
    { id: 'tv', icon: Tv, label: 'Series' },
    { id: 'dimensions', icon: Compass, label: 'Moods' },
    { id: 'news', icon: Newspaper, label: 'Pulse' },
    { id: 'watchlist', icon: Heart, label: 'Vault' },
    { id: 'history', icon: History, label: 'Logs' },
  ];

  return (
    <div className="flex min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden selection:bg-blue-500/30">
      
      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex w-64 fixed inset-y-0 left-0 bg-[#080808] border-r border-white/5 flex-col z-50">
        <div className="p-8 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Rocket size={18} />
          </div>
          <span className="text-lg font-black tracking-tighter uppercase italic">Cine<span className="text-blue-500">Vault</span></span>
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar">
          {navItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => handleTabChange(item.id as Tab)} 
              className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all group duration-300 ${
                activeTab === item.id 
                  ? 'bg-blue-600/10 text-blue-500 shadow-[inset_0_0_10px_rgba(37,99,235,0.1)]' 
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={18} className={activeTab === item.id ? 'scale-110' : 'group-hover:scale-110 transition-transform'} />
              <span className="font-bold uppercase tracking-widest text-[10px]">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 relative pb-24 lg:pb-12">
        
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={16} />
              <input 
                type="text"
                placeholder="Search archive or ask AI..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-medium text-white placeholder-gray-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Filter Toggle (Only show on discovery tabs) */}
            {!['watchlist', 'history', 'news'].includes(activeTab) && (
                <button 
                    onClick={() => setShowFilters(!showFilters)} 
                    className={`p-2.5 rounded-xl border transition-all ${showFilters ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                >
                <SlidersHorizontal size={18} />
                </button>
            )}
          </div>
        </header>

        <div className="p-4 lg:p-10 max-w-7xl mx-auto space-y-12">
          
          {/* News View */}
          {activeTab === 'news' ? <NewsSection /> : (
            <>
              {/* Featured Carousel (Home Only) */}
              {activeTab === 'home' && !debouncedQuery && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-700">
                    <NowPlayingCarousel onSelectMovie={setSelectedMovie} />
                </div>
              )}

              {/* Mood Selector (Dimensions Only) */}
              {activeTab === 'dimensions' && (
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                  {MOODS.map(mood => (
                    <button
                      key={mood.id}
                      onClick={() => setActiveMood(mood)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-full border transition-all whitespace-nowrap ${
                        activeMood.id === mood.id 
                          ? `bg-white/10 border-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]` 
                          : 'bg-transparent border-white/5 text-gray-500 hover:border-white/10'
                      }`}
                    >
                      <mood.icon size={16} className={activeMood.id === mood.id ? mood.color : 'grayscale'} />
                      <span className="text-xs font-black uppercase tracking-widest">{mood.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Main Grid Section */}
              <section className="space-y-8 min-h-[50vh]">
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                  <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                    {activeTab === 'home' && !debouncedQuery ? 'Archive Highlights' : 
                     activeTab === 'dimensions' ? <span className={activeMood.color}>{activeMood.label} Sector</span> :
                     `${activeTab} Discovery`}
                  </h2>
                </div>

                {/* Continue Watching (Only on Home & if History exists) */}
                {activeTab === 'home' && !debouncedQuery && watchHistory.length > 0 && (
                    <div className="space-y-4 mb-8">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                             <History size={14} /> Resume Playback
                        </h3>
                        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar mask-linear-fade">
                            {watchHistory.slice(0, 5).map(m => (
                                <div key={m.id} className="w-[160px] shrink-0">
                                    <MovieCard movie={m} onClick={setStreamingMovie} onWatchlistToggle={toggleWatchlist} isInWatchlist={isInWatchlist(m.id)} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && page === 1 ? (
                  <div className="flex flex-col items-center justify-center py-32 space-y-6">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Cpu size={20} className="text-blue-500 animate-pulse" />
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-sm font-black uppercase tracking-[0.3em] text-blue-500">Engaging Neural Shield</p>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Decrypting stream nodes...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 animate-in fade-in duration-700">
                      {displayMovies.map((m, idx) => (
                        <MovieCard 
                            key={`${m.id}-${idx}`} 
                            movie={m} 
                            onClick={setSelectedMovie} 
                            onWatchlistToggle={toggleWatchlist} 
                            isInWatchlist={isInWatchlist(m.id)} 
                        />
                      ))}
                    </div>

                    {/* Empty State */}
                    {displayMovies.length === 0 && !isLoading && (
                      <div className="py-32 text-center space-y-4 bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <Info size={40} className="mx-auto text-gray-700" />
                        <p className="text-xl font-bold text-gray-500 uppercase italic">Sector Empty</p>
                        <button onClick={() => handleTabChange('home')} className="px-6 py-2 bg-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest text-white hover:bg-blue-500">
                            Reset Archive
                        </button>
                      </div>
                    )}
                    
                    {/* Load More Button (Only for discovery tabs) */}
                    {hasMore && !['watchlist', 'history'].includes(activeTab) && displayMovies.length > 0 && (
                        <div className="flex justify-center pt-12 pb-6">
                            <button 
                                onClick={() => fetchContent(false)}
                                disabled={isLoading}
                                className="group flex items-center gap-3 px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ArrowDown size={16} className="group-hover:translate-y-1 transition-transform"/>}
                                <span className="text-xs font-black uppercase tracking-widest text-white/60 group-hover:text-white">Load Expanded Data</span>
                            </button>
                        </div>
                    )}
                  </>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 h-20 bg-[#050505]/95 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-2 z-[90] pb-2">
        {navItems.slice(0, 5).map(item => (
          <button 
            key={item.id} 
            onClick={() => handleTabChange(item.id as Tab)} 
            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${activeTab === item.id ? 'text-blue-500 bg-blue-500/10' : 'text-gray-500'}`}
          >
            <item.icon size={20} />
            <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Modals */}
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
      
      {streamingMovie && (
        <VideoPlayer 
            movie={streamingMovie} 
            onClose={() => setStreamingMovie(null)} 
        />
      )}
    </div>
  );
};

export default App;
