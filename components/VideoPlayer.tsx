import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Server, ChevronDown, SkipForward, SkipBack,
  Maximize, Minimize, List, Settings,
  Tv, Film, AlertCircle, Play, Pause, Rewind, FastForward
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
  // ... (keep the same list as provided)
];

const VideoPlayer: React.FC<VideoPlayerProps> = ({ movie, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const tmdbId = movie.tmdbId || movie.id;
  const isTV = movie.contentType === 'tv' || !!movie.first_air_date;
  const storageKey = `watch_history_${tmdbId}${isTV ? `_${season}_${episode}` : ''}`;

  // --- State ---
  const [availableServers, setAvailableServers] = useState<StreamingServer[]>([]);
  const [activeServer, setActiveServer] = useState<StreamingServer | null>(null);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showServerMenu, setShowServerMenu] = useState(false);
  const [showEpisodeNav, setShowEpisodeNav] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // --- 1. Server Availability Check ---
  useEffect(() => {
    const checkServers = async () => {
      const checks = SERVERS.map(async (server) => {
        const url = isTV ? server.tv(tmdbId.toString(), 1, 1) : server.movie(tmdbId.toString());
        try {
          await fetch(url, { mode: 'no-cors' });
          return server;
        } catch {
          return null;
        }
      });
      const results = await Promise.all(checks);
      const filtered = results.filter((s): s is StreamingServer => s !== null);
      setAvailableServers(filtered);
      if (filtered.length > 0) {
        setActiveServer(filtered[0]);
      }
    };
    checkServers();
  }, [isTV, tmdbId]);

  // --- 2. Resume Functionality (Load) ---
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.season) setSeason(parsed.season);
        if (parsed.episode) setEpisode(parsed.episode);
        if (parsed.serverId) {
          const savedServer = availableServers.find(s => s.id === parsed.serverId) || availableServers[0];
          if (savedServer) setActiveServer(savedServer);
        }
        if (parsed.timestamp) setCurrentTime(parsed.timestamp);
      } catch (e) {
        console.error("Failed to load watch history", e);
      }
    }
  }, [storageKey, availableServers]);

  // --- 2. Resume Functionality (Save) ---
  useEffect(() => {
    if (activeServer) {
      const data = {
        season,
        episode,
        serverId: activeServer.id,
        timestamp: currentTime,
        lastWatched: new Date().toISOString(),
        title: movie.title
      };
      localStorage.setItem(storageKey, JSON.stringify(data));
    }
  }, [season, episode, activeServer, currentTime, storageKey, movie.title]);

  // --- Player Event Listener for Time Tracking ---
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PLAYER_EVENT') {
        const { event: eventType, currentTime: time, duration } = event.data.data;
        if (eventType === 'timeupdate') {
          setCurrentTime(time);
        } else if (eventType === 'play') {
          setIsPlaying(true);
        } else if (eventType === 'pause') {
          setIsPlaying(false);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // --- Resume on Load ---
  useEffect(() => {
    if (loaded && iframeRef.current) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.timestamp > 0) {
          iframeRef.current.contentWindow?.postMessage(
            JSON.stringify({ event: 'command', func: 'seekTo', args: [parsed.timestamp, true] }),
            '*'
          );
          iframeRef.current.contentWindow?.postMessage(
            JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
            '*'
          );
        }
      }
    }
  }, [loaded, storageKey]);

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

  const sendCommand = (func: string, args: any[] = []) => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*'
      );
    }
  };

  const togglePlayPause = () => {
    sendCommand(isPlaying ? 'pauseVideo' : 'playVideo');
  };

  const seekRelative = (seconds: number) => {
    sendCommand('seekTo', [Math.max(0, currentTime + seconds), true]);
  };

  const handleEpisodeChange = (newSeason: number, newEpisode: number) => {
    setSeason(newSeason);
    setEpisode(newEpisode);
    setShowEpisodeNav(false);
    setCurrentTime(0); // Reset time for new episode
    setLoaded(false); // Reload iframe
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
      if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      }
      if (e.key === 'ArrowLeft') seekRelative(-10);
      if (e.key === 'ArrowRight') seekRelative(10);
    };

    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      setIsHovered(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
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
  }, [onClose, toggleFullscreen, showEpisodeNav, showServerMenu, isPlaying, currentTime]);

  // --- Embed URL Generation ---
  const embedUrl = activeServer ? (isTV
    ? activeServer.tv(tmdbId.toString(), season, episode)
    : activeServer.movie(tmdbId.toString())) : '';

  if (availableServers.length === 0 || !activeServer) {
    return (
      <div className="fixed inset-0 z-[100] bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4" />
          <h2 className="text-2xl font-bold">No Available Servers</h2>
          <p className="mt-2 text-gray-400">Please try again later.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-red-600 rounded">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black text-white overflow-hidden animate-in fade-in duration-300 font-sans"
    >
      {/* Background Iframe */}
      <iframe
        ref={iframeRef}
        key={embedUrl}
        src={embedUrl}
        className="w-full h-full border-none focus:outline-none"
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        allowFullScreen
        title="Video Player"
        onLoad={() => setLoaded(true)}
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
                <span className={`w-2 h-2 rounded-full ${activeServer.type.includes('premium') ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
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
                    {availableServers.map(s => (
                      <button
                        key={s.id}
                        onClick={() => { setActiveServer(s); setShowServerMenu(false); }}
                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors flex items-center justify-between
                          ${activeServer.id === s.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-white/10'}`}
                        aria-label={`Select server ${s.name}`}
                      >
                        {s.name}
                        {s.type.includes('premium') && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded">HQ</span>}
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
                <button onClick={() => setShowEpisodeNav(false)} className="p-2 hover:bg-white/10 rounded-full" aria-label="Close Episode Navigator"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-xs font-bold text-white/40 uppercase mb-3 tracking-widest" htmlFor="season-select">Select Season</label>
                    <select
                      id="season-select"
                      value={season}
                      onChange={(e) => setSeason(parseInt(e.target.value) || 1)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm font-bold focus:outline-none focus:border-blue-500"
                    >
                      {[...Array(50)].map((_, i) => (
                        <option key={i} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/40 uppercase mb-3 tracking-widest" htmlFor="episode-select">Select Episode</label>
                    <select
                      id="episode-select"
                      value={episode}
                      onChange={(e) => handleEpisodeChange(season, parseInt(e.target.value) || 1)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm font-bold focus:outline-none focus:border-blue-500"
                    >
                      {[...Array(100)].map((_, i) => (
                        <option key={i} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
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
                      aria-label="Previous Episode"
                    >
                      <SkipBack size={16} fill="currentColor" /> Prev
                    </button>
                    <button
                      onClick={() => setShowEpisodeNav(true)}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-900/40 transition-all font-bold text-sm"
                      aria-label="Select Season and Episode"
                    >
                      <Tv size={16} /> S{season}:E{episode}
                    </button>
                    <button
                      onClick={() => setEpisode(episode + 1)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all text-sm font-bold"
                      aria-label="Next Episode"
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
                <button
                  onClick={() => seekRelative(-10)}
                  className="p-3 hover:bg-white/10 rounded-full transition-all"
                  aria-label="Rewind 10 seconds"
                >
                  <Rewind size={24} />
                </button>
                <button
                  onClick={togglePlayPause}
                  className="p-3 hover:bg-white/10 rounded-full transition-all"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
                <button
                  onClick={() => seekRelative(10)}
                  className="p-3 hover:bg-white/10 rounded-full transition-all"
                  aria-label="Fast Forward 10 seconds"
                >
                  <FastForward size={24} />
                </button>
                {/* Fullscreen Toggle */}
                <button
                  onClick={toggleFullscreen}
                  className="p-3 hover:bg-white/10 rounded-full transition-all text-white/90 hover:text-white"
                  aria-label="Toggle Fullscreen"
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
