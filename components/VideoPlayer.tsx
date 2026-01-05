
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Server, ChevronDown, SkipForward, AlertTriangle, PlayCircle, Settings, ToggleLeft, ToggleRight } from 'lucide-react';
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
  { id: 'vidlink', name: "VidLink.pro", movie: (id) => `https://vidlink.pro/movie/${id}`, tv: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`, reliability: 'High' },
  { id: 'vidsrc-me', name: "VidSrc.me", movie: (id) => `https://vidsrc.me/embed/movie?tmdb=${id}`, tv: (id, s, e) => `https://vidsrc.me/embed/tv?tmdb=${id}&sea=${s}&epi=${e}`, reliability: 'High' },
  { id: 'embed-su', name: "Embed.su", movie: (id) => `https://embed.su/embed/movie/${id}`, tv: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}`, reliability: 'Medium' },
  { id: 'vidsrc-icu', name: "VidSrc.icu", movie: (id) => `https://vidsrc.icu/embed/movie/${id}`, tv: (id, s, e) => `https://vidsrc.icu/embed/tv/${id}/${s}/${e}`, reliability: 'Medium' },
  { id: 'autoembed', name: "AutoEmbed.cc", movie: (id) => `https://autoembed.cc/embed/movie/${id}`, tv: (id, s, e) => `https://autoembed.cc/embed/tv/${id}/${s}/${e}`, reliability: 'Variable' }
];

const VideoPlayer: React.FC<VideoPlayerProps> = ({ movie, onClose }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [brokenServers, setBrokenServers] = useState<Set<string>>(new Set());
  const [activeServer, setActiveServer] = useState<StreamingServer>(SERVERS[0]);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [showServerMenu, setShowServerMenu] = useState(false);
  const [isAutoplaying, setIsAutoplaying] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const [countdown, setCountdown] = useState(10);
  const timerRef = useRef<number | null>(null);

  const tmdbId = movie.tmdbId || movie.id;
  const isTV = movie.contentType === 'tv';
  const embedUrl = isTV ? activeServer.tv(tmdbId, season, episode) : activeServer.movie(tmdbId);

  useEffect(() => {
    const available = SERVERS.find(s => !brokenServers.has(s.id) && s.reliability === 'High') || 
                      SERVERS.find(s => !brokenServers.has(s.id)) || 
                      SERVERS[0];
    setActiveServer(available);
  }, [brokenServers]);

  const handleNextEpisode = () => {
    setEpisode(prev => prev + 1);
    setIsAutoplaying(false);
    setCountdown(10);
  };

  const reportBroken = () => {
    setBrokenServers(prev => {
      const next = new Set(prev);
      next.add(activeServer.id);
      return next;
    });
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
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-500 overflow-hidden">
      <div 
        className="relative w-full h-full flex flex-col group/player"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setShowServerMenu(false); }}
      >
        <div className="flex-1 w-full bg-black relative">
            <iframe
                key={`${embedUrl}-${brokenServers.size}`}
                src={embedUrl}
                className="w-full h-full border-none"
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
            />
            
            {isAutoplaying && (
              <div className="absolute inset-0 bg-black/98 backdrop-blur-[60px] z-50 flex flex-col items-center justify-center animate-in zoom-in-95 duration-1000">
                <div className="relative mb-12">
                  <svg className="w-40 h-40 transform -rotate-90">
                    <circle cx="80" cy="80" r="75" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                    <circle cx="80" cy="80" r="75" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={471} strokeDashoffset={471 * (1 - countdown / 10)} className="text-blue-500 transition-all duration-1000 ease-linear" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-6xl font-black tabular-nums">{countdown}</span>
                </div>
                <div className="text-center space-y-4 mb-12">
                   <h3 className="text-5xl font-black uppercase tracking-tighter italic">Next Episode Node</h3>
                   <p className="text-gray-500 font-bold uppercase tracking-[0.4em] text-xs">Synchronizing Season {season} • Episode {episode + 1}</p>
                </div>
                <div className="flex gap-6">
                  <button onClick={handleNextEpisode} className="bg-white text-black px-16 py-6 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-4xl hover:scale-105 active:scale-95">Stream Now</button>
                  <button onClick={() => setIsAutoplaying(false)} className="bg-white/5 text-white px-16 py-6 rounded-3xl font-black text-sm uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all">Cancel Seq</button>
                </div>
              </div>
            )}
        </div>

        <div className={`absolute inset-0 pointer-events-none transition-all duration-700 ${isHovered && !isAutoplaying ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute top-0 inset-x-0 p-12 bg-gradient-to-b from-black via-black/40 to-transparent pointer-events-auto flex justify-between items-start">
            <div className="space-y-4">
              <h2 className="text-5xl font-black text-white drop-shadow-4xl flex items-center gap-6 tracking-tighter italic">
                {movie.title}
                {isTV && <span className="bg-blue-600 text-white px-5 py-2 rounded-2xl text-[10px] font-black shadow-2xl tracking-widest">SEASON {season} • EPISODE {episode}</span>}
              </h2>
              <div className="flex items-center gap-4">
                <div className={`inline-flex items-center gap-3 px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-3xl border ${
                  activeServer.reliability === 'High' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${activeServer.reliability === 'High' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
                  Node: {activeServer.name}
                </div>
                {isTV && (
                  <button onClick={() => setAutoPlayEnabled(!autoPlayEnabled)} className="flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                     {autoPlayEnabled ? <ToggleRight className="text-blue-500" size={18} /> : <ToggleLeft className="text-gray-500" size={18} />} Auto-Play
                  </button>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-6 bg-white/5 hover:bg-red-500 text-white rounded-full backdrop-blur-3xl transition-all border border-white/10 shadow-4xl active:scale-90"><X size={32} /></button>
          </div>

          <div className="absolute bottom-0 inset-x-0 p-12 pb-20 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-auto flex flex-col gap-10">
            <div className="flex flex-wrap justify-between items-center gap-8">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <button onClick={() => setShowServerMenu(!showServerMenu)} className="flex items-center gap-4 bg-white/10 hover:bg-white/20 text-white px-10 py-5 rounded-[2rem] border border-white/10 transition-all font-black text-[11px] uppercase tracking-[0.3em] shadow-3xl backdrop-blur-3xl">
                    <Server size={20} /> Shift Node <ChevronDown size={18} className={showServerMenu ? 'rotate-180' : ''} />
                  </button>
                  {showServerMenu && (
                    <div className="absolute bottom-full left-0 mb-8 w-80 bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,1)] overflow-hidden p-4 animate-in slide-in-from-bottom-6">
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-5 mb-4 border-b border-white/5 pb-3">Available Streams</div>
                      {SERVERS.map((s) => (
                        <button 
                          key={s.id} 
                          disabled={brokenServers.has(s.id)}
                          onClick={() => { setActiveServer(s); setShowServerMenu(false); }} 
                          className={`w-full flex items-center justify-between px-6 py-5 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all mb-2 ${
                            activeServer.id === s.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' : 
                            brokenServers.has(s.id) ? 'opacity-20 cursor-not-allowed grayscale' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {s.name}
                          <span className={`text-[8px] px-2 py-0.5 rounded-md border ${s.reliability === 'High' ? 'text-green-400 border-green-500/20 bg-green-500/5' : 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5'}`}>{s.reliability}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button onClick={reportBroken} className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white px-8 py-5 rounded-[2rem] border border-red-500/20 transition-all font-black text-[11px] uppercase tracking-widest flex items-center gap-4 active:scale-95">
                  <AlertTriangle size={20} /> Report Node
                </button>

                {isTV && (
                  <div className="flex items-center gap-4 bg-white/5 px-4 py-4 rounded-[2rem] border border-white/10 backdrop-blur-3xl">
                    <div className="flex items-center gap-4 px-4 border-r border-white/10">
                      <span className="text-[10px] font-black text-gray-500 uppercase">S</span>
                      <input type="number" min="1" value={season} onChange={(e) => setSeason(Math.max(1, parseInt(e.target.value) || 1))} className="w-10 bg-transparent text-white font-black text-center focus:outline-none text-sm" />
                    </div>
                    <div className="flex items-center gap-4 px-4">
                      <span className="text-[10px] font-black text-gray-500 uppercase">E</span>
                      <input type="number" min="1" value={episode} onChange={(e) => setEpisode(Math.max(1, parseInt(e.target.value) || 1))} className="w-10 bg-transparent text-white font-black text-center focus:outline-none text-sm" />
                    </div>
                  </div>
                )}
              </div>

              {isTV && (
                <button onClick={handleNextEpisode} className="bg-blue-600 text-white px-14 py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] hover:bg-blue-500 active:scale-95 transition-all shadow-4xl shadow-blue-600/40 flex items-center gap-4">
                  <SkipForward size={24} /> Next Sequence
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
