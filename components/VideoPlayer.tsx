
import React, { useState, useEffect, useRef } from 'react';
import { X, Zap, Server, ChevronDown, SkipForward, AlertTriangle, Settings2, Play } from 'lucide-react';
import { Movie } from '../types';

interface VideoPlayerProps {
  movie: Movie;
  onClose: () => void;
}

interface StreamingServer {
  id: string;
  name: string;
  movie: (id: string) => string;
  tv: (id: string, s: number, e: number) => string;
  reliability: 'High' | 'Medium' | 'Variable';
}

const SERVERS: StreamingServer[] = [
  { id: 'vidsrc-to', name: "VidSrc.to", movie: (id) => `https://vidsrc.to/embed/movie/${id}`, tv: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`, reliability: 'High' },
  { id: 'vidsrc-me', name: "VidSrc.me", movie: (id) => `https://vidsrc.me/embed/movie?tmdb=${id}`, tv: (id, s, e) => `https://vidsrc.me/embed/tv?tmdb=${id}&sea=${s}&epi=${e}`, reliability: 'High' },
  { id: 'vidlink', name: "VidLink.pro", movie: (id) => `https://vidlink.pro/movie/${id}`, tv: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`, reliability: 'High' },
  { id: 'embed-su', name: "Embed.su", movie: (id) => `https://embed.su/embed/movie/${id}`, tv: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}`, reliability: 'Medium' },
  { id: 'vidsrc-icu', name: "VidSrc.icu", movie: (id) => `https://vidsrc.icu/embed/movie/${id}`, tv: (id, s, e) => `https://vidsrc.icu/embed/tv/${id}/${s}/${e}`, reliability: 'Medium' },
  { id: 'autoembed', name: "AutoEmbed.cc", movie: (id) => `https://autoembed.cc/embed/movie/${id}`, tv: (id, s, e) => `https://autoembed.cc/embed/tv/${id}/${s}/${e}`, reliability: 'Medium' }
];

const VideoPlayer: React.FC<VideoPlayerProps> = ({ movie, onClose }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [activeServer, setActiveServer] = useState(SERVERS[0]);
  const [brokenServers, setBrokenServers] = useState<Set<string>>(new Set());
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [showServerMenu, setShowServerMenu] = useState(false);
  const [isAutoplaying, setIsAutoplaying] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const timerRef = useRef<number | null>(null);

  const tmdbId = movie.tmdbId || movie.id;
  const isTV = movie.contentType === 'tv';
  const embedUrl = isTV ? activeServer.tv(tmdbId, season, episode) : activeServer.movie(tmdbId);

  const handleNextEpisode = () => {
    setEpisode(prev => prev + 1);
    setIsAutoplaying(false);
    setCountdown(5);
  };

  const reportBroken = () => {
    const nextSet = new Set(brokenServers);
    nextSet.add(activeServer.id);
    setBrokenServers(nextSet);
    const available = SERVERS.filter(s => !nextSet.has(s.id));
    if (available.length > 0) {
      setActiveServer(available.find(s => s.reliability === 'High') || available[0]);
    } else {
      setBrokenServers(new Set());
      setActiveServer(SERVERS[0]);
    }
  };

  useEffect(() => {
    if (isAutoplaying && countdown > 0) {
      timerRef.current = window.setInterval(() => setCountdown(c => c - 1), 1000);
    } else if (isAutoplaying && countdown === 0) {
      handleNextEpisode();
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isAutoplaying, countdown]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-500">
      <div 
        className="relative w-full h-full flex flex-col group/player"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setShowServerMenu(false); }}
      >
        <div className="flex-1 w-full bg-black relative">
            <iframe
                key={embedUrl}
                src={embedUrl}
                className="w-full h-full border-none shadow-[0_0_100px_rgba(37,99,235,0.2)]"
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
            />
            
            {isAutoplaying && (
              <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl z-50 flex flex-col items-center justify-center animate-in zoom-in-95">
                <div className="relative mb-10">
                  <svg className="w-28 h-28 transform -rotate-90">
                    <circle cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/10" />
                    <circle cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={314} strokeDashoffset={314 * (1 - countdown / 5)} className="text-blue-500 transition-all duration-1000 ease-linear" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-5xl font-black">{countdown}</span>
                </div>
                <h3 className="text-3xl font-black mb-6 uppercase tracking-tighter">Queueing: E{episode + 1}</h3>
                <div className="flex gap-5">
                  <button onClick={handleNextEpisode} className="bg-white text-black px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Play Now</button>
                  <button onClick={() => setIsAutoplaying(false)} className="bg-white/10 text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest border border-white/10 active:scale-95">Cancel</button>
                </div>
              </div>
            )}
        </div>

        {/* Global Controls Overlay */}
        <div className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${isHovered && !isAutoplaying ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute top-0 inset-x-0 p-10 bg-gradient-to-b from-black via-black/40 to-transparent pointer-events-auto flex justify-between items-start">
            <div className="space-y-3">
              <h2 className="text-4xl font-black text-white drop-shadow-3xl flex items-center gap-5 tracking-tight">
                {movie.title}
                {isTV && <span className="bg-blue-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black shadow-2xl">S{season} E{episode}</span>}
              </h2>
              <div className={`inline-flex items-center gap-3 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                activeServer.reliability === 'High' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
              }`}>
                <div className={`w-2 h-2 rounded-full ${activeServer.reliability === 'High' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
                {activeServer.name} • {activeServer.reliability} Reliability
              </div>
            </div>
            <button onClick={onClose} className="p-5 bg-white/10 hover:bg-red-500 text-white rounded-full backdrop-blur-3xl transition-all border border-white/10 shadow-3xl active:scale-90"><X size={28} /></button>
          </div>

          <div className="absolute bottom-0 inset-x-0 p-10 pb-16 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-auto flex flex-col gap-8">
            <div className="flex flex-wrap justify-between items-center gap-6">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <button onClick={() => setShowServerMenu(!showServerMenu)} className="flex items-center gap-3 bg-white/10 hover:bg-white/20 text-white px-8 py-4.5 rounded-[1.5rem] border border-white/10 transition-all font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl backdrop-blur-3xl">
                    <Server size={18} /> Node: {activeServer.name} <ChevronDown size={16} className={showServerMenu ? 'rotate-180 transition-transform' : 'transition-transform'} />
                  </button>
                  {showServerMenu && (
                    <div className="absolute bottom-full left-0 mb-6 w-80 bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden p-3 animate-in slide-in-from-bottom-4">
                      <div className="px-4 py-2 text-[8px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 mb-2">Quantum Switching</div>
                      {SERVERS.map((s) => (
                        <button 
                          key={s.id} 
                          disabled={brokenServers.has(s.id)}
                          onClick={() => { setActiveServer(s); setShowServerMenu(false); }} 
                          className={`w-full flex items-center justify-between px-5 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all mb-1 ${
                            activeServer.id === s.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 
                            brokenServers.has(s.id) ? 'opacity-30 cursor-not-allowed grayscale' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {s.name}
                          <span className={`text-[8px] ${s.reliability === 'High' ? 'text-green-400' : 'text-yellow-400'}`}>{s.reliability}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  onClick={reportBroken}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-6 py-4.5 rounded-[1.5rem] border border-red-500/20 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-2xl backdrop-blur-3xl active:scale-95"
                >
                  <AlertTriangle size={18} /> Node Error?
                </button>

                {isTV && (
                  <div className="flex items-center gap-2 bg-white/10 px-2 py-2 rounded-[1.5rem] border border-white/10 backdrop-blur-3xl shadow-2xl">
                    <div className="flex items-center gap-3 px-4">
                      <span className="text-[9px] font-black text-gray-500 uppercase">Season</span>
                      <input type="number" min="1" value={season} onChange={(e) => setSeason(Math.max(1, parseInt(e.target.value) || 1))} className="w-10 bg-transparent text-white font-black text-center focus:outline-none" />
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="flex items-center gap-3 px-4">
                      <span className="text-[9px] font-black text-gray-500 uppercase">Episode</span>
                      <input type="number" min="1" value={episode} onChange={(e) => setEpisode(Math.max(1, parseInt(e.target.value) || 1))} className="w-10 bg-transparent text-white font-black text-center focus:outline-none" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-5">
                {isTV && (
                  <button 
                    onClick={handleNextEpisode} 
                    className="bg-white text-black px-12 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-3xl shadow-white/5"
                  >
                    <SkipForward size={20} className="inline mr-3" /> Next Episode
                  </button>
                )}
                <button className="bg-blue-600 text-white px-8 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-3xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all"><Zap size={20} className="inline mr-3" /> Trivia Node</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
