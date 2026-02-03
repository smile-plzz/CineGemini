import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, Server, ChevronDown, SkipForward, SkipBack, 
  Maximize, Minimize, List, Settings, 
  Tv, Film, AlertCircle 
} from 'lucide-react';
import { Movie } from '../types';

// --- Types ---

interface VideoPlayerProps {
  movie: Movie;
  onClose: () => void;
  onProgress?: (movie: Movie, progress: { season?: number; episode?: number; serverId?: string }) => void;
}

interface StreamingServer {
  id: string;
  name: string;
  type: 'ad-free' | 'backup' | 'premium';
  movie: (id: string) => string;
  tv: (id: string, s: number, e: number) => string;
}

// --- Configuration ---

//const SERVERS: StreamingServer[] = [
//  { id: 'vidlink', name: "VidLink Pro", type: 'premium', movie: (id) => `https://vidlink.pro/movie/${id}`, tv: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}` },
//  { id: 'vidsrc-to', name: "VidSrc Main", type: 'ad-free', movie: (id) => `https://vidsrc.to/embed/movie/${id}`, tv: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}` },
//  { id: 'vidsrc-icu', name: "ICU Stream", type: 'backup', movie: (id) => `https://vidsrc.icu/embed/movie/${id}`, tv: (id, s, e) => `https://vidsrc.icu/embed/tv/${id}/${s}/${e}` },
//  { id: 'pro-api', name: "Pro API", type: 'backup', movie: (id) => `https://embed.su/embed/movie/${id}`, tv: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}` },
// ];

const SERVERS: StreamingServer[] = [
  // Primary Premium Sources
  {
    id: 'vidlink',
    name: "VidLink Pro",
    type: 'premium',
    movie: (id: string) => `https://vidlink.pro/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://vidlink.pro/tv/${id}/${s}/${e}`
  },
  {
    id: 'vidsrc-to',
    name: "VidSrc Main",
    type: 'ad-free',
    movie: (id: string) => `https://vidsrc.to/embed/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`
  },

  // Alternative VidSrc Domains
  {
    id: 'vidsrc-icu',
    name: "VidSrc ICU",
    type: 'backup',
    movie: (id: string) => `https://vidsrc.icu/embed/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://vidsrc.icu/embed/tv/${id}/${s}/${e}`
  },
  {
    id: 'vidsrc-me',
    name: "VidSrc.me",
    type: 'alternative',
    movie: (id: string) => `https://vidsrc.me/embed/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://vidsrc.me/embed/tv/${id}/${s}/${e}`
  },
  {
    id: 'vidsrc-xyz',
    name: "VidSrc XYZ",
    type: 'alternative',
    movie: (id: string) => `https://vidsrc.xyz/embed/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://vidsrc.xyz/embed/tv/${id}/${s}/${e}`
  },
  {
    id: 'vidsrc-cc',
    name: "VidSrc CC",
    type: 'backup',
    movie: (id: string) => `https://vidsrc.cc/embed/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://vidsrc.cc/embed/tv/${id}/${s}/${e}`
  },

  // MultiEmbed Sources
  {
    id: 'multiembed',
    name: "MultiEmbed",
    type: 'multi-source',
    movie: (id: string) => `https://multiembed.mov/direct/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://multiembed.mov/direct/tv/${id}/${s}/${e}`
  },
  {
    id: '2embed',
    name: "2Embed",
    type: 'alternative',
    movie: (id: string) => `https://www.2embed.cc/embed/${id}`,
    tv: (id: string, s: number, e: number) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`
  },

  // SmashyStream Network
  {
    id: 'smashystream',
    name: "SmashyStream",
    type: 'alternative',
    movie: (id: string) => `https://embed.smashystream.com/playere.php?tmdb=${id}`,
    tv: (id: string, s: number, e: number) => `https://embed.smashystream.com/playere.php?tmdb=${id}&season=${s}&episode=${e}`
  },

  // Movie-Web.app Sources
  {
    id: 'movie-web',
    name: "MovieWeb",
    type: 'modern',
    movie: (id: string) => `https://movie-web.app/media/tmdb-movie-${id}`,
    tv: (id: string, s: number, e: number) => `https://movie-web.app/media/tmdb-show-${id}/tvdb-${s}-${e}`
  },

  // API-Based Sources
  {
    id: 'moviesapi',
    name: "MoviesAPI",
    type: 'api',
    movie: (id: string) => `https://moviesapi.club/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://moviesapi.club/tv/${id}-${s}-${e}`
  },
  {
    id: 'pro-api',
    name: "Pro API",
    type: 'api',
    movie: (id: string) => `https://embed.su/embed/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://embed.su/embed/tv/${id}/${s}/${e}`
  },

  // Additional Active Sources
  {
    id: 'flixhq',
    name: "FlixHQ",
    type: 'popular',
    movie: (id: string) => `https://flixhq.to/ajax/movie/episodes/${id}`,
    tv: (id: string, s: number, e: number) => `https://flixhq.to/ajax/v2/episode/servers/${id}?season=${s}&episode=${e}`
  },
  {
    id: 'watchseries',
    name: "WatchSeries",
    type: 'series-focused',
    movie: (id: string) => `https://watchseries.ac/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://watchseries.ac/tv/${id}-${s}-${e}`
  },
  {
    id: 'streamembed',
    name: "StreamEmbed",
    type: 'backup',
    movie: (id: string) => `https://streamembed.net/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://streamembed.net/tv/${id}/${s}/${e}`
  },
  {
    id: 'superembed',
    name: "SuperEmbed",
    type: 'multi-source',
    movie: (id: string) => `https://superembed.stream/e/${id}`,
    tv: (id: string, s: number, e: number) => `https://superembed.stream/e/${id}-${s}-${e}`
  },
  {
    id: 'vidsrcpro',
    name: "VidSrc Pro",
    type: 'premium',
    movie: (id: string) => `https://vidsrc.pro/embed/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://vidsrc.pro/embed/tv/${id}/${s}/${e}`
  },
  {
    id: 'moviehd',
    name: "MovieHD",
    type: 'backup',
    movie: (id: string) => `https://moviehd.watch/embed/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://moviehd.watch/embed/tv/${id}/${s}/${e}`
  },
  {
    id: 'streamm4u',
    name: "StreamM4U",
    type: 'alternative',
    movie: (id: string) => `https://streamm4u.com/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://streamm4u.com/tv/${id}/${s}/${e}`
  },
  {
    id: 'flixwise',
    name: "FlixWise",
    type: 'backup',
    movie: (id: string) => `https://flixwise.com/embed/${id}`,
    tv: (id: string, s: number, e: number) => `https://flixwise.com/embed/${id}/${s}/${e}`
  },
  {
    id: 'cinegrab',
    name: "CineGrab",
    type: 'torrent-based',
    movie: (id: string) => `https://cinegrab.com/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://cinegrab.com/tv/${id}/${s}/${e}`
  },
  {
    id: 'vidsrclive',
    name: "VidSrc Live",
    type: 'live-sports',
    movie: (id: string) => `https://vidsrc.live/embed/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://vidsrc.live/embed/tv/${id}/${s}/${e}`
  },

  // Domain Variants (Auto-select based on region)
  {
    id: 'vidsrc-autoselect',
    name: "VidSrc Auto",
    type: 'smart',
    movie: (id: string) => {
      const domains = ['vidsrc.to', 'vidsrc.xyz', 'vidsrc.cc', 'vidsrc.me'];
      const domain = domains[Math.floor(Math.random() * domains.length)];
      return `https://${domain}/embed/movie/${id}`;
    },
    tv: (id: string, s: number, e: number) => {
      const domains = ['vidsrc.to', 'vidsrc.xyz', 'vidsrc.cc', 'vidsrc.me'];
      const domain = domains[Math.floor(Math.random() * domains.length)];
      return `https://${domain}/embed/tv/${id}/${s}/${e}`;
    }
  }
];








const VideoPlayer: React.FC<VideoPlayerProps> = ({ movie, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tmdbId = movie.tmdbId || movie.id;
  const isTV = movie.contentType === 'tv' || !!movie.first_air_date; // Robust check
  const storageKey = `cinevault-progress_${tmdbId}`;
  const preferredServerKey = "cinevault-preferred-server";

  // --- State ---
  const [activeServer, setActiveServer] = useState<StreamingServer>(SERVERS[0]);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [isHovered, setIsHovered] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showServerMenu, setShowServerMenu] = useState(false);
  const [showEpisodeNav, setShowEpisodeNav] = useState(false);

  // --- 1. Resume Functionality (Load) ---
  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Only restore if it makes sense
        if (parsed.season) setSeason(parsed.season);
        if (parsed.episode) setEpisode(parsed.episode);
        if (parsed.serverId) {
          const savedServer = SERVERS.find(s => s.id === parsed.serverId);
          if (savedServer) setActiveServer(savedServer);
        }
      } catch (e) {
        console.error("Failed to load watch history", e);
      }
    } else {
      const preferred = sessionStorage.getItem(preferredServerKey);
      if (preferred) {
        const savedServer = SERVERS.find(s => s.id === preferred);
        if (savedServer) setActiveServer(savedServer);
      }
    }
  }, [storageKey]);

  // --- 2. Resume Functionality (Save) ---
  useEffect(() => {
    const data = {
      season,
      episode,
      serverId: activeServer.id,
      lastWatched: new Date().toISOString(),
      title: movie.title // Useful for a "Continue Watching" list elsewhere
    };
    sessionStorage.setItem(storageKey, JSON.stringify(data));
    sessionStorage.setItem(preferredServerKey, activeServer.id);
    onProgress?.(movie, { season, episode, serverId: activeServer.id });
  }, [season, episode, activeServer, storageKey, movie.title, movie, onProgress]);

  // --- Helpers ---

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handleEpisodeChange = (newSeason: number, newEpisode: number) => {
    setSeason(newSeason);
    setEpisode(newEpisode);
    setShowEpisodeNav(false); // Close menu on selection
  };

  // --- Keyboard Shortcuts & Activity Monitor ---

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showEpisodeNav || showServerMenu) {
            setShowEpisodeNav(false);
            setShowServerMenu(false);
        } else {
            onClose();
        }
      }
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    };
    
    // Auto-hide UI logic
    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      setIsHovered(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        // Don't hide if menus are open
        if (!showServerMenu && !showEpisodeNav) setIsHovered(false);
      }, 4000);
    };

    window.addEventListener('keydown', handleKey);
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('click', resetTimer);
    
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('click', resetTimer);
      clearTimeout(timeout);
    };
  }, [onClose, toggleFullscreen, showEpisodeNav, showServerMenu]);


  // --- Embed URL Generation ---
  const embedUrl = isTV 
    ? activeServer.tv(tmdbId.toString(), season, episode) 
    : activeServer.movie(tmdbId.toString());

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black text-white overflow-hidden animate-in fade-in duration-300 font-sans"
    >
      {/* Background Iframe */}
      <iframe
        key={embedUrl} // Forces reload on source change
        src={embedUrl}
        className="w-full h-full border-none focus:outline-none"
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        allowFullScreen
        title="Video Player"
      />

      {/* --- Overlay UI --- */}
      <div 
        className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ease-in-out flex flex-col justify-between
          ${isHovered ? 'opacity-100' : 'opacity-0'}`}
      >
        
        {/* Top Gradient & Header */}
        <div className="bg-gradient-to-b from-black/90 via-black/50 to-transparent p-6 pointer-events-auto">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight drop-shadow-lg flex items-center gap-3">
                {movie.title}
                {isTV && (
                    <span className="text-sm font-bold bg-white/20 px-2 py-0.5 rounded text-white/90">
                        S{season}:E{episode}
                    </span>
                )}
              </h2>
              <div className="flex items-center gap-2 text-xs font-medium text-white/60 uppercase tracking-widest">
                <span className={`w-2 h-2 rounded-full ${activeServer.type === 'premium' ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
                Stream: {activeServer.name}
              </div>
            </div>

            <div className="flex items-center gap-3">
               {/* Server Switcher */}
              <div className="relative">
                <button 
                  onClick={() => setShowServerMenu(!showServerMenu)}
                  className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all active:scale-95"
                  aria-label="Change Server"
                >
                    <Settings size={20} />
                </button>
                
                {showServerMenu && (
                  <div className="absolute top-14 right-0 w-64 bg-[#111]/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 animate-in slide-in-from-top-2">
                    <div className="p-3 border-b border-white/5 text-xs font-bold text-white/40 uppercase tracking-wider">Select Source</div>
                    {SERVERS.map(s => (
                      <button 
                        key={s.id} 
                        onClick={() => { setActiveServer(s); setShowServerMenu(false); }}
                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors flex items-center justify-between
                          ${activeServer.id === s.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-white/10'}`}
                      >
                        {s.name}
                        {s.type === 'premium' && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded">HQ</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={onClose} 
                className="p-3 bg-red-600/80 hover:bg-red-600 text-white rounded-full transition-all active:scale-95 shadow-lg"
                aria-label="Close Player"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Center - Episode Navigator (Only visible if toggled) */}
        {showEpisodeNav && isTV && (
             <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                    <div className="flex items-center justify-between p-6 border-b border-white/5">
                        <h3 className="text-xl font-bold flex items-center gap-2"><List size={20} /> Season Selector</h3>
                        <button onClick={() => setShowEpisodeNav(false)} className="p-2 hover:bg-white/10 rounded-full"><X size={20}/></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Ideally, you would map real data here. 
                           Since we don't have metadata, we provide a smart manual selector 
                        */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase mb-3 tracking-widest">Select Season</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[...Array(10)].map((_, i) => (
                                        <button 
                                            key={i} 
                                            onClick={() => setSeason(i+1)}
                                            className={`py-2 rounded-lg text-sm font-bold transition-all ${season === i+1 ? 'bg-blue-600 text-white' : 'bg-white/5 hover:bg-white/10 text-gray-400'}`}
                                        >
                                            {i+1}
                                        </button>
                                    ))}
                                    {/* Manual Input for higher seasons */}
                                    <input 
                                        type="number" 
                                        value={season} 
                                        onChange={(e) => setSeason(parseInt(e.target.value) || 1)}
                                        className="col-span-2 bg-white/5 border border-white/10 rounded-lg text-center text-sm font-bold focus:outline-none focus:border-blue-500"
                                        placeholder="#"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase mb-3 tracking-widest">Select Episode</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {[...Array(20)].map((_, i) => (
                                        <button 
                                            key={i} 
                                            onClick={() => handleEpisodeChange(season, i+1)}
                                            className={`py-2 rounded-lg text-sm font-bold transition-all ${episode === i+1 ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10 text-gray-400'}`}
                                        >
                                            {i+1}
                                        </button>
                                    ))}
                                     <input 
                                        type="number" 
                                        value={episode} 
                                        onChange={(e) => setEpisode(parseInt(e.target.value) || 1)}
                                        className="col-span-2 bg-white/5 border border-white/10 rounded-lg text-center text-sm font-bold focus:outline-none focus:border-blue-500"
                                        placeholder="#"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-4 bg-white/5 text-xs text-white/40 text-center">
                        Selecting a new episode will automatically reload the stream.
                    </div>
                </div>
             </div>
        )}

        {/* Bottom Controls */}
        <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 lg:p-10 pointer-events-auto">
          <div className="flex flex-col gap-4">
            
            {/* Control Bar */}
            <div className="flex items-center justify-between">
              
              <div className="flex items-center gap-4">
                {isTV && (
                    <>
                        <button 
                            onClick={() => setEpisode(Math.max(1, episode - 1))}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all text-sm font-bold disabled:opacity-50"
                            disabled={episode <= 1}
                        >
                            <SkipBack size={16} fill="currentColor" /> Prev
                        </button>
                        
                        <button 
                            onClick={() => setShowEpisodeNav(true)}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-900/40 transition-all font-bold text-sm"
                        >
                            <Tv size={16} /> S{season}:E{episode}
                        </button>

                        <button 
                            onClick={() => setEpisode(episode + 1)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all text-sm font-bold"
                        >
                            Next <SkipForward size={16} fill="currentColor" />
                        </button>
                    </>
                )}
                {!isTV && (
                     <div className="px-4 py-2 bg-white/10 rounded-full text-sm font-medium flex items-center gap-2">
                        <Film size={16} /> Movie Mode
                     </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                 {/* Fullscreen Toggle */}
                 <button 
                    onClick={toggleFullscreen}
                    className="p-3 hover:bg-white/10 rounded-full transition-all text-white/90 hover:text-white"
                    title="Toggle Fullscreen (F)"
                 >
                    {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
                 </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
