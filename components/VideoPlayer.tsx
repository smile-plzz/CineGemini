import React, { useState, useEffect, useRef } from 'react';
import { X, Server, ChevronDown, SkipForward, AlertTriangle, ToggleLeft, ToggleRight, RotateCcw } from 'lucide-react';
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
  { id: 'vidlink', name: "VidLink Core", movie: (id) => `https://vidlink.pro/movie/${id}`, tv: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`, reliability: 'High' },
  { id: 'vidsrc-to', name: "VidSrc Prime", movie: (id) => `https://vidsrc.to/embed/movie/${id}`, tv: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`, reliability: 'High' },
  { id: 'vidsrc-me', name: "VidSrc Legacy", movie: (id) => `https://vidsrc.me/embed/movie?tmdb=${id}`, tv: (id, s, e) => `https://vidsrc.me/embed/tv?tmdb=${id}&sea=${s}&epi=${e}`, reliability: 'High' },
  { id: 'vidsrc-icu', name: "Icu Stream", movie: (id) => `https://vidsrc.icu/embed/movie/${id}`, tv: (id, s, e) => `https://vidsrc.icu/embed/tv/${id}/${s}/${e}`, reliability: 'Medium' }
];

const VideoPlayer: React.FC<VideoPlayerProps> = ({ movie, onClose }) => {
  const [activeServer, setActiveServer] = useState<StreamingServer>(SERVERS[0]);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [showServerMenu, setShowServerMenu] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [isHovered, setIsHovered] = useState(true);
  
  const tmdbId = movie.tmdbId || movie.id;
  const isTV = movie.contentType === 'tv';
  const embedUrl = isTV ? activeServer.tv(tmdbId, season, episode) : activeServer.movie(tmdbId);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    let timeout: number;
    if (isHovered) {
      timeout = window.setTimeout(() => setIsHovered(false), 3500);
    }
    return () => clearTimeout(timeout);
  }, [isHovered]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-500 overflow-hidden">
      <div 
        className="relative w-full h-full flex flex-col cursor-none"
        onMouseMove={() => setIsHovered(true)}
        style={{ cursor: isHovered ? 'default' : 'none' }}
      >
        <iframe
          key={embedUrl}
          src={embedUrl}
          className="w-full h-full border-none"
          allow="autoplay; fullscreen; encrypted-media"
          allowFullScreen
        />

        {/* Cinematic HUD */}
        <div className={`absolute inset-0 pointer-events-none transition-all duration-1000 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute top-0 inset-x-0 p-8 lg:p-12 bg-gradient-to-b from-black via-black/40 to-transparent pointer-events-auto flex justify-between items-start">
            <div className="space-y-4">
              <h2 className="text-4xl lg:text-5xl font-black text-white drop-shadow-2xl flex items-center gap-6 tracking-tighter italic uppercase">
                {movie.title}
                {isTV && <span className="bg-blue-600 text-[10px] px-4 py-2 rounded-xl">S{season} E{episode}</span>}
              </h2>
              <div className="flex gap-4">
                <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10 text-blue-400">Node: {activeServer.name}</span>
                <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10 text-green-400">Status: Active</span>
              </div>
            </div>
            <button onClick={onClose} className="p-6 bg-white/5 hover:bg-red-500 text-white rounded-full transition-all border border-white/10 shadow-2xl active:scale-90"><X size={32} /></button>
          </div>

          <div className="absolute bottom-0 inset-x-0 p-8 lg:p-12 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-auto">
            <div className="flex flex-wrap items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <button 
                    onClick={() => setShowServerMenu(!showServerMenu)} 
                    className="flex items-center gap-4 bg-white/10 hover:bg-white/20 text-white px-10 py-5 rounded-3xl border border-white/10 transition-all font-black text-[11px] uppercase tracking-[0.2em]"
                  >
                    <Server size={20} /> Switch Node <ChevronDown size={18} className={showServerMenu ? 'rotate-180' : ''} />
                  </button>
                  {showServerMenu && (
                    <div className="absolute bottom-full left-0 mb-6 w-72 bg-[#0a0a0a]/98 backdrop-blur-3xl border border-white/10 rounded-[2rem] overflow-hidden p-3 shadow-4xl animate-in slide-in-from-bottom-4">
                      {SERVERS.map(s => (
                        <button 
                          key={s.id} 
                          onClick={() => { setActiveServer(s); setShowServerMenu(false); }} 
                          className={`w-full flex items-center justify-between px-5 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all mb-1 ${activeServer.id === s.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                        >
                          {s.name}
                          <span className="text-[8px] opacity-60">{s.reliability}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {isTV && (
                  <div className="flex items-center gap-4 bg-white/5 px-6 py-5 rounded-3xl border border-white/10">
                    <input 
                      type="number" 
                      value={season} 
                      onChange={(e) => setSeason(Math.max(1, parseInt(e.target.value) || 1))} 
                      className="w-8 bg-transparent text-white font-black text-center focus:outline-none"
                    />
                    <span className="text-[9px] font-black opacity-30 uppercase tracking-widest">S / E</span>
                    <input 
                      type="number" 
                      value={episode} 
                      onChange={(e) => setEpisode(Math.max(1, parseInt(e.target.value) || 1))} 
                      className="w-8 bg-transparent text-white font-black text-center focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6">
                {isTV && (
                  <button onClick={() => setEpisode(e => e + 1)} className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-5 rounded-3xl font-black text-sm uppercase tracking-widest transition-all shadow-xl flex items-center gap-4 active:scale-95">
                    <SkipForward size={24} /> Next Episode
                  </button>
                )}
                <button onClick={() => window.location.reload()} className="p-5 bg-white/10 rounded-full border border-white/10 hover:bg-white/20 transition-all text-white active:rotate-180">
                  <RotateCcw size={20} />
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