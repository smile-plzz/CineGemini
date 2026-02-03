import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { 

  Search, Heart, Home, TrendingUp, 

  Film, Tv, Compass, Newspaper, ChevronUp, History, Sparkles, Zap, Ghost, Brain, Coffee, Rocket, SlidersHorizontal, Info, RefreshCcw, Cpu

} from 'lucide-react';

import { Movie, WatchlistItem, SearchResult, WatchHistory } from './types';

import MovieCard from './components/MovieCard';

import DetailModal from './components/DetailModal';

import VideoPlayer from './components/VideoPlayer';

import NewsSection from './components/NewsSection';

import NowPlayingCarousel from './components/NowPlayingCarousel';

import { movieService, SearchFilters } from './services/movieService';
import { readSessionValue, writeSessionValue } from './services/sessionCache';



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

  const [error, setError] = useState<string | null>(null);

  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

  const [watchHistory, setWatchHistory] = useState<WatchHistory[]>([]);
  const [continueWatching, setContinueWatching] = useState<WatchHistory[]>([]);

  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  const [streamingMovie, setStreamingMovie] = useState<Movie | null>(null);

  const [showScrollTop, setShowScrollTop] = useState(false);

  

  useEffect(() => {

    const savedVault = localStorage.getItem('cinevault-vault');

    const savedLogs = readSessionValue<WatchHistory[]>('cinevault-logs');

    if (savedVault) try { setWatchlist(JSON.parse(savedVault)); } catch (e) {}

    if (savedLogs) setWatchHistory(savedLogs);

  }, []);



  useEffect(() => { localStorage.setItem('cinevault-vault', JSON.stringify(watchlist)); }, [watchlist]);

  useEffect(() => { writeSessionValue('cinevault-logs', watchHistory); }, [watchHistory]);

  useEffect(() => {
    setContinueWatching(watchHistory.slice(0, 8));
  }, [watchHistory]);



  const triggerDiscovery = useCallback(async (query: string, filters: SearchFilters) => {

    setIsLoading(true);

    setError(null);

    try {

      const results = await movieService.searchEntertainment(query, filters);

      setSearchResult(results);

      if (!results.movies || results.movies.length === 0) {

        setError("No titles found in current archive segment.");

      }

    } catch (err: any) {

      console.error("Discovery error:", err);

      setError("Synchronisation error. Neural Link active.");

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

        home: '2024',

        movies: 'Cinema',

        tv: 'Series',

        trending: 'Trending',

        dimensions: 'Adrenaline'

      };

      q = map[activeTab] || '2024';

      if (activeTab === 'movies') f.type = 'movie';

      if (activeTab === 'tv') f.type = 'series';

    }



    triggerDiscovery(q, f);

    window.scrollTo({ top: 0, behavior: 'smooth' });

  }, [activeTab, triggerDiscovery, searchFilters, searchQuery === '']);



  const handleTabChange = (tab: Tab) => {

    setActiveTab(tab);

    setSearchQuery('');

    setSearchFilters({ type: 'all', year: '', genre: '' });

  };



  const handleSearchSubmit = (e: React.FormEvent) => {

    e.preventDefault();

    triggerDiscovery(searchQuery || '2024', searchFilters);

  };



  useEffect(() => {

    const onScroll = () => setShowScrollTop(window.scrollY > 800);

    window.addEventListener('scroll', onScroll);

    return () => window.removeEventListener('scroll', onScroll);

  }, []);



  const addToHistory = (m: Movie, progress?: { season?: number; episode?: number; serverId?: string }) => {

    setWatchHistory(prev => {

      const filtered = prev.filter(item => item.id !== m.id);

      return [{
        ...m,
        watchedAt: Date.now(),
        lastSeason: progress?.season,
        lastEpisode: progress?.episode,
        lastServerId: progress?.serverId
      }, ...filtered].slice(0, 20);

    });

  };

  const handleProgressUpdate = useCallback((movie: Movie, progress: { season?: number; episode?: number; serverId?: string }) => {
    setWatchHistory(prev => {
      const existing = prev.find(item => item.id === movie.id);
      const merged: WatchHistory = {
        ...movie,
        watchedAt: Date.now(),
        lastSeason: progress.season ?? existing?.lastSeason,
        lastEpisode: progress.episode ?? existing?.lastEpisode,
        lastServerId: progress.serverId ?? existing?.lastServerId
      };
      return [merged, ...prev.filter(item => item.id !== movie.id)].slice(0, 20);
    });
  }, []);



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



  const currentMovies = useMemo(() => {

    if (activeTab === 'watchlist') return watchlist;

    if (activeTab === 'history') return watchHistory;

    return searchResult?.movies || [];

  }, [activeTab, watchlist, watchHistory, searchResult]);



  return (

    <div className="flex min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden">

      {/* Sidebar */}

      <aside className="hidden lg:flex w-64 fixed inset-y-0 left-0 bg-[#080808] border-r border-white/5 flex-col z-50">

        <div className="p-8 flex items-center gap-3">

          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">

            <Rocket size={18} />

          </div>

          <span className="text-lg font-black tracking-tighter uppercase italic">Cine<span className="text-blue-500">Vault</span></span>

        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar">

          {navItems.map((item) => (

            <button key={item.id} onClick={() => handleTabChange(item.id as Tab)} className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all group ${activeTab === item.id ? 'bg-blue-600/10 text-blue-500' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>

              <item.icon size={18} className={activeTab === item.id ? 'scale-110' : 'group-hover:scale-110 transition-transform'} />

              <span className="font-bold uppercase tracking-widest text-[10px]">{item.label}</span>

            </button>

          ))}

        </nav>

      </aside>



      <main className="flex-1 lg:ml-64 relative pb-24 lg:pb-12">

        <header className="sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-xl border-b border-white/5 px-6 py-4">

          <div className="max-w-6xl mx-auto flex items-center gap-4">

            <form onSubmit={handleSearchSubmit} className="flex-1 relative">

              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />

              <input 

                type="text"

                placeholder="Search archive or ask AI..."

                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"

                value={searchQuery}

                onChange={(e) => setSearchQuery(e.target.value)}

              />

            </form>

            <button onClick={() => setShowFilters(!showFilters)} className={`p-2.5 rounded-xl border transition-all ${showFilters ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>

              <SlidersHorizontal size={18} />

            </button>

          </div>

        </header>



        <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-12">

          {activeTab === 'news' ? <NewsSection /> : (

            <>

              {activeTab === 'home' && !searchQuery && continueWatching.length > 0 && (

                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black uppercase tracking-widest text-white">Continue Watching</h3>
                    <button onClick={() => handleTabChange('history')} className="text-[10px] uppercase font-bold text-blue-400 hover:text-blue-300">View Logs</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {continueWatching.map(m => (
                      <MovieCard key={`${m.id}-continue`} movie={m} onClick={(movie) => { setSelectedMovie(movie); }} onWatchlistToggle={toggleWatchlist} isInWatchlist={isInWatchlist(m.id)} />
                    ))}
                  </div>
                </section>

              )}

              {activeTab === 'home' && !searchQuery && (

                <NowPlayingCarousel onSelectMovie={setSelectedMovie} />

              )}



              <section className="space-y-8">

                <div className="flex items-center justify-between border-b border-white/5 pb-6">

                  <h2 className="text-3xl font-black italic uppercase tracking-tighter">

                    {activeTab === 'home' && !searchQuery ? 'Archive Highlights' : `${activeTab} Discovery`}

                  </h2>

                </div>



                {isLoading ? (

                  <div className="flex flex-col items-center justify-center py-24 space-y-6">

                    <div className="relative">

                      <div className="w-16 h-16 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>

                      <div className="absolute inset-0 flex items-center justify-center">

                        <Cpu size={20} className="text-blue-500 animate-pulse" />

                      </div>

                    </div>

                    <div className="text-center space-y-2">

                      <p className="text-sm font-black uppercase tracking-[0.3em] text-blue-500">Engaging Neural Shield</p>

                      <p className="text-[10px] text-gray-500 uppercase font-bold">Bypassing node errors via Gemini...</p>

                    </div>

                  </div>

                ) : (

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 animate-in fade-in duration-700">

                    {currentMovies.map(m => (

                      <MovieCard key={m.id} movie={m} onClick={setSelectedMovie} onWatchlistToggle={toggleWatchlist} isInWatchlist={isInWatchlist(m.id)} />

                    ))}

                  </div>

                )}

                

                {(!isLoading && currentMovies.length === 0) && (

                  <div className="py-32 text-center space-y-4 bg-white/5 rounded-3xl border border-dashed border-white/10">

                    <Info size={40} className="mx-auto text-gray-700" />

                    <p className="text-xl font-bold text-gray-500 uppercase italic">Archive Segments Empty</p>

                    <button onClick={() => handleTabChange('home')} className="px-6 py-2 bg-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Reset Archive</button>

                  </div>

                )}

              </section>

            </>

          )}

        </div>

      </main>



      <nav className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-[#080808]/90 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-2 z-[100]">

        {navItems.slice(0, 4).map(item => (

          <button key={item.id} onClick={() => handleTabChange(item.id as Tab)} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === item.id ? 'text-blue-500' : 'text-gray-500'}`}>

            <item.icon size={18} />

            <span className="text-[7px] font-black uppercase tracking-widest">{item.label}</span>

          </button>

        ))}

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

      {streamingMovie && (
        <VideoPlayer
          movie={streamingMovie}
          onClose={() => setStreamingMovie(null)}
          onProgress={handleProgressUpdate}
        />
      )}

    </div>

  );

};



export default App;
