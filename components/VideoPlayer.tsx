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
}
interface StreamingServer {
  id: string;
  name: string;
  type: 'ad-free' | 'backup' | 'premium';
  movie: (id: string) => string;
  tv: (id: string, s: number, e: number) => string;
}
// --- Configuration ---
const SERVERS: StreamingServer[] = [
  // Original and prior additions (still active per 2026 sources)
  {
    id: 'vidlink',
    name: "VidLink Pro",
    type: 'premium/fast',
    movie: (id) => https://vidlink.pro/movie/${id},
    tv: (id, s, e) => https://vidlink.pro/tv/${id}/${s}/${e}
  },
  {
    id: 'vidsrc-to',
    name: "VidSrc To",
    type: 'ad-free/main',
    movie: (id) => https://vidsrc.to/embed/movie/${id},
    tv: (id, s, e) => https://vidsrc.to/embed/tv/${id}/${s}/${e}
  },
  {
    id: 'vidsrc-icu',
    name: "VidSrc ICU",
    type: 'backup',
    movie: (id) => https://vidsrc.icu/embed/movie/${id},
    tv: (id, s, e) => https://vidsrc.icu/embed/tv/${id}/${s}/${e}
  },
  {
    id: 'embed-su',
    name: "Embed.su / Pro API",
    type: 'backup',
    movie: (id) => https://embed.su/embed/movie/${id},
    tv: (id, s, e) => https://embed.su/embed/tv/${id}/${s}/${e}
  },
  {
    id: 'vidsrc-cc',
    name: "VidSrc CC",
    type: 'main/alternative',
    movie: (id) => https://vidsrc.cc/embed/movie/${id},
    tv: (id, s, e) => https://vidsrc.cc/embed/tv/${id}/${s}/${e}
  },
  {
    id: 'vidsrc-pro',
    name: "VidSrc Pro",
    type: 'premium/high-quality',
    movie: (id) => https://vidsrc.pro/embed/movie/${id},
    tv: (id, s, e) => https://vidsrc.pro/embed/tv/${id}/${s}/${e}
  },
  {
    id: 'autoembed',
    name: "AutoEmbed",
    type: 'backup/multi-server',
    movie: (id) => https://autoembed.cc/embed/movie/${id},
    tv: (id, s, e) => https://autoembed.cc/embed/tv/${id}/${s}/${e}
  },
  {
    id: '2embed',
    name: "2Embed",
    type: 'classic/backup',
    movie: (id) => https://www.2embed.cc/embed/${id},
    tv: (id, s, e) => https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}
  },
  {
    id: 'superembed',
    name: "SuperEmbed",
    type: 'multi-server',
    movie: (id) => https://www.superembed.stream/embed/${id},
    tv: (id, s, e) => https://www.superembed.stream/embed/tv/${id}/${s}/${e}
  },
  {
    id: 'multiembed',
    name: "MultiEmbed",
    type: 'backup',
    movie: (id) => https://multiembed.mov/embed/movie/${id},
    tv: (id, s, e) => https://multiembed.mov/embed/tv/${id}/${s}/${e}
  },
  // New additions from 2025–2026 sources (e.g., developer docs and forums)
  {
    id: 'vidsrc-me',
    name: "VidSrc ME",
    type: 'main/alternative',
    movie: (id) => https://vidsrc.me/embed/movie?tmdb=${id},
    tv: (id, s, e) => https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}
  },
  {
    id: 'vidsrc-dev',
    name: "VidSrc Dev",
    type: 'dev/backup',
    movie: (id) => https://vidsrc.dev/embed/movie/${id},
    tv: (id, s, e) => https://vidsrc.dev/embed/tv/${id}/${s}/${e}
  },
  {
    id: 'vidsrc-xyz',
    name: "VidSrc XYZ",
    type: 'alternative',
    movie: (id) => https://vidsrc.xyz/embed/movie?tmdb=${id},
    tv: (id, s, e) => https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${s}&episode=${e}
  },
  {
    id: 'moviesapi-club',
    name: "MoviesAPI Club",
    type: 'backup/multi-host',
    movie: (id) => https://moviesapi.club/movie/${id},
    tv: (id, s, e) => https://moviesapi.club/tv/${id}-${s}-${e}
  },
  {
    id: 'smashy',
    name: "Smashy Stream",
    type: 'multi-server',
    movie: (id) => https://player.smashy.stream/movie/${id},
    tv: (id, s, e) => https://player.smashy.stream/tv/${id}?season=${s}&episode=${e}
  },
];
const VideoPlayer: React.FC<VideoPlayerProps> = ({ movie, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tmdbId = movie.tmdbId || movie.id;
  const isTV = movie.contentType === 'tv' || !!movie.first_air_date; // Robust check
  const storageKey = watch_history_${tmdbId};
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
    const saved = localStorage.getItem(storageKey);
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
    localStorage.setItem(storageKey, JSON.stringify(data));
  }, [season, episode, activeServer, storageKey, movie.title]);
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
        className={absolute inset-0 pointer-events-none transition-opacity duration-500 ease-in-out flex flex-col justify-between &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${isHovered ? 'opacity-100' : 'opacity-0'}}
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
                <span className={w-2 h-2 rounded-full ${activeServer.type === 'premium' ? 'bg-green-400' : 'bg-yellow-400'}}></span>
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
                        className={w-full text-left px-4 py-3 text-sm font-medium transition-colors flex items-center justify-between &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${activeServer.id === s.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-white/10'}}
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
                                            className={py-2 rounded-lg text-sm font-bold transition-all ${season === i+1 ? 'bg-blue-600 text-white' : 'bg-white/5 hover:bg-white/10 text-gray-400'}}
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
                                            className={py-2 rounded-lg text-sm font-bold transition-all ${episode === i+1 ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10 text-gray-400'}}
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
