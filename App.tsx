
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, Heart, Home, TrendingUp, 
  Film, Tv, Compass, Newspaper, ChevronUp, History, Sparkles, Zap, Ghost, Brain, Coffee, Rocket, SlidersHorizontal, Info
} from 'lucide-react';
import { Movie, WatchlistItem, SearchResult, WatchHistory } from './types';
import MovieCard from './components/MovieCard';
import DetailModal from './components/DetailModal';
import VideoPlayer from './components/VideoPlayer';
import NewsSection from './components/NewsSection';
import { movieService, SearchFilters } from './services/movieService';

type Tab = 'home' | 'movies' | 'tv' | 'watchlist' | 'trending' | 'news' | 'history' | 'dimensions';

const MOODS = [
  { id: 'Adrenaline', label: 'Adrenaline', icon: Zap, color: 'text-orange-500' },
  { id: 'Noir', label: 'Noir', icon: Ghost, color: 'text-purple-500' },
  { id: 'Cerebral', label: 'Cerebral', icon: Brain, color: 'text-blue-500' },
  { id: 'Zen', label: 'Zen', icon: Coffee, color: 'text-green-500' },
  { id: 'Eerie', label: 'Eerie', icon: Sparkles, color: 'text-red-500' }
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
  
  useEffect(() => {
    const savedVault = localStorage.getItem('cinevault-vault');
    const savedLogs = localStorage.getItem('cinevault-logs');
    if (savedVault) try { setWatchlist(JSON.parse(savedVault)); } catch (e) {}
    if (savedLogs) try { setWatchHistory(JSON.parse(savedLogs)); } catch (e) {}
  }, []);

  useEffect(() => { localStorage.setItem('cinevault-vault', JSON.stringify(watchlist)); }, [watchlist]);
  useEffect(() => { localStorage.setItem('cinevault-logs', JSON.stringify(watchHistory)); }, [watchHistory]);

  const triggerDiscovery = useCallback(async (query: string, filters: SearchFilters) => {
    setIsLoading(true);
    try {
      const results = await movieService.searchEntertainment(query, filters);
      setSearchResult(results);
    } catch (err) {
      console.error("Discovery error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (['watchlist', 'news', 'history'].includes(activeTab)) return;

    let q = searchQuery;
    let f = { ...searchFilters };

    if (!searchQuery) {
      const map: Record<string, string> = {
        home: 'Popular',
        movies: 'Cinema',
        tv: 'Series',
        trending: 'Trending',
        dimensions: 'Adrenaline'
      };
      q = map[activeTab] || 'Popular';
      if (activeTab === 'movies') f.type = 'movie';
      if (activeTab === 'tv') f.type = 'series';
    }

    triggerDiscovery(q, f);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, triggerDiscovery, searchFilters]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSearchQuery('');
    setSearchFilters({ type: 'all', year: '', genre: '' });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerDiscovery(searchQuery || 'Popular', searchFilters);
  };

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 800);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

  const isInWatchlist = useMemo(() => (id: string) => watchlist.some(i => i.id === id), [watchlist]);

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
    <div className="flex min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden">
      {/* Desktop Sidebar */}
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
              className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all group ${
                activeTab === item.id 
                ? 'bg-blue-600/10 text-blue-500' 
                : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={18} className={activeTab === item.id ? 'scale-110' : 'group-hover:scale-110 transition-transform'} />
              <span className="font-bold uppercase tracking-widest text-[10px]">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 lg:ml-64 relative pb-24 lg:pb-12">
        <header className="sticky top-0 z-40 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <form onSubmit={handleSearchSubmit} className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input 
                type="text"
                placeholder="Search the archive..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-xl border transition-all ${showFilters ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>

          {showFilters && (
            <div className="max-w-6xl mx-auto pt-4 flex flex-wrap gap-3 animate-in fade-in duration-300">
              <div className="flex bg-white/5 rounded-lg border border-white/10 p-1">
                {['all', 'movie', 'series'].map(t => (
                  <button 
                    key={t}
                    onClick={() => setSearchFilters(p => ({ ...p, type: t as any }))}
                    className={`px-4 py-1 rounded-md text-[9px] font-black uppercase transition-all ${searchFilters.type === t ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
                  >
                    {t === 'series' ? 'TV' : t}
                  </button>
                ))}
              </div>
              <input 
                type="number" 
                placeholder="Year"
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs w-20 focus:outline-none focus:border-blue-500"
                value={searchFilters.year}
                onChange={(e) => setSearchFilters(p => ({ ...p, year: e.target.value }))}
              />
              <select 
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs focus:outline-none"
                value={searchFilters.genre}
                onChange={(e) => setSearchFilters(p => ({ ...p, genre: e.target.value }))}
              >
                <option value="">All Genres</option>
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          )}
        </header>

        <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-12">
          {activeTab === 'news' ? <NewsSection /> : (
            <>
              {activeTab === 'dimensions' && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {MOODS.map(m => (
                    <button 
                      key={m.id}
                      onClick={() => { setSearchQuery(m.id); triggerDiscovery(m.id, searchFilters); }}
                      className={`flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all ${searchQuery === m.id ? 'bg-blue-600/20 border-blue-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                    >
                      <m.icon size={24} className={m.color} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'home' && watchHistory.length > 0 && (
                <section className="space-y-6">
                  <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                    <History size={18} className="text-blue-500" /> Continue Watching
                  </h3>
                  <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x">
                    {watchHistory.map(m => (
                      <div key={m.id} className="min-w-[140px] md:min-w-[180px] snap-start">
                        <MovieCard movie={m} onClick={setSelectedMovie} onWatchlistToggle={toggleWatchlist} isInWatchlist={isInWatchlist(m.id)} />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="space-y-8">
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter">{activeTab} Discovery</h2>
                </div>

                {isLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {Array.from({ length: 12 }).map((_, i) => <div key={i} className="aspect-[2/3] bg-white/5 rounded-2xl animate-pulse" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {(activeTab === 'watchlist' ? watchlist : activeTab === 'history' ? watchHistory : (searchResult?.movies || [])).map(m => (
                      <MovieCard key={m.id} movie={m} onClick={setSelectedMovie} onWatchlistToggle={toggleWatchlist} isInWatchlist={isInWatchlist(m.id)} />
                    ))}
                  </div>
                )}
                
                {(!isLoading && (activeTab === 'watchlist' ? watchlist : activeTab === 'history' ? watchHistory : (searchResult?.movies || [])).length === 0) && (
                  <div className="py-32 text-center space-y-4 bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <Info size={40} className="mx-auto text-gray-700" />
                    <p className="text-xl font-bold text-gray-500 uppercase italic">Empty Vault</p>
                    <button onClick={() => handleTabChange('home')} className="px-6 py-2 bg-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Back to Lobby</button>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-[#080808]/90 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-2 z-[100]">
        {navItems.slice(0, 4).map(item => (
          <button key={item.id} onClick={() => handleTabChange(item.id as Tab)} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === item.id ? 'text-blue-500' : 'text-gray-500'}`}>
            <item.icon size={18} />
            <span className="text-[7px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
        <button onClick={() => handleTabChange('watchlist')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'watchlist' ? 'text-blue-500' : 'text-gray-500'}`}>
          <Heart size={18} />
          <span className="text-[7px] font-black uppercase tracking-widest">Vault</span>
        </button>
      </nav>

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

      {showScrollTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-20 right-6 lg:bottom-10 lg:right-10 z-[60] bg-white text-black p-3 rounded-xl shadow-xl transition-all hover:-translate-y-1 active:scale-90">
          <ChevronUp size={24} />
        </button>
      )}
    </div>
  );
};

export default App;
