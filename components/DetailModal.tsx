
import React, { useState, useEffect, useRef } from 'react';
import { Movie, OmdbDetails } from '../types';
import { X, Play, Calendar, Clock, Star, Plus, Sparkles, Loader2, Award, ChevronRight, Youtube } from 'lucide-react';
import { gemini } from '../services/geminiService';

interface DetailModalProps {
  movie: Movie;
  onClose: () => void;
  onWatch: (movie: Movie) => void;
  onWatchlistToggle: (movie: Movie) => void;
  isInWatchlist: boolean;
  onSelectMovie: (movie: Movie) => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ movie, onClose, onWatch, onWatchlistToggle, isInWatchlist, onSelectMovie }) => {
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [omdbData, setOmdbData] = useState<OmdbDetails | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadContent = async () => {
      if (containerRef.current) containerRef.current.scrollTop = 0;
      setLoadingSimilar(true);
      try {
        const [similar, omdb] = await Promise.all([
          gemini.getSimilarMovies(movie),
          gemini.fetchOmdbData(movie.imdbId || null, movie.title)
        ]);
        setSimilarMovies(similar);
        setOmdbData(omdb);
      } catch (err) {
        console.error("Discovery error:", err);
      } finally {
        setLoadingSimilar(false);
      }
    };
    loadContent();
  }, [movie.id]);

  const rating = omdbData?.imdbRating || movie.rating || "N/A";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 lg:p-12 overflow-hidden animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-black/98 backdrop-blur-3xl" onClick={onClose} aria-hidden="true" />
      
      <div 
        ref={containerRef}
        className="relative bg-[#080808] w-full max-w-7xl h-full md:rounded-[3.5rem] overflow-y-auto shadow-[0_0_120px_rgba(0,0,0,0.9)] border border-white/5 flex flex-col scroll-smooth custom-scrollbar"
      >
        <button 
          onClick={onClose}
          className="fixed md:absolute top-8 right-8 z-[70] p-5 bg-white/5 hover:bg-red-500 text-white rounded-full transition-all border border-white/10 backdrop-blur-3xl group shadow-2xl"
          aria-label="Close"
        >
          <X size={24} className="group-hover:rotate-90 transition-transform" />
        </button>

        <div className="flex flex-col lg:flex-row min-h-full">
          {/* Hero Media Section */}
          <div className="w-full lg:w-1/2 relative shrink-0">
            <div className="sticky top-0 h-full">
              <img 
                src={movie.posterUrl} 
                alt={movie.title}
                className="w-full h-full object-cover aspect-[4/5] lg:aspect-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent" />
              
              <div className="absolute bottom-12 left-12 flex items-end gap-6">
                <div className="bg-blue-600 p-8 rounded-[2.5rem] shadow-3xl shadow-blue-600/40 border border-white/20 transform hover:scale-105 transition-transform duration-500">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100 mb-2">Global Rating</div>
                  <div className="text-5xl font-black text-white flex items-center gap-3">
                    {rating} <Star size={24} fill="white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Context Section */}
          <div className="p-10 md:p-16 lg:p-24 flex-1 space-y-16 relative">
            <div className="space-y-10">
              <div className="flex flex-wrap gap-3">
                {movie.genre?.map((g, idx) => (
                  <span key={idx} className="bg-white/5 text-white/70 border border-white/10 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:border-blue-500/50 transition-all cursor-default">
                    {g}
                  </span>
                ))}
              </div>
              <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.8] text-white">
                {movie.title}
              </h2>
              <div className="flex flex-wrap items-center gap-10 text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">
                <span className="flex items-center gap-3 text-white"><Calendar size={20} className="text-blue-500" /> {movie.year}</span>
                <span className="flex items-center gap-3 text-white"><Clock size={20} className="text-blue-500" /> {movie.runtime}</span>
                <span className="bg-blue-600/10 text-blue-500 px-4 py-1.5 rounded-xl border border-blue-500/20">{movie.contentType}</span>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-px w-12 bg-blue-600/50" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-blue-500">Synopsis</h3>
              </div>
              <p className="text-gray-300 leading-[1.6] text-xl md:text-2xl font-medium italic opacity-90 border-l-4 border-blue-600/30 pl-10 py-2">
                {movie.description}
              </p>
            </div>

            {omdbData?.Awards && omdbData.Awards !== "N/A" && (
              <div className="bg-yellow-500/5 border border-yellow-500/10 p-8 rounded-[2.5rem] flex items-center gap-8 group hover:border-yellow-500/30 transition-all">
                <div className="bg-yellow-500/20 p-5 rounded-2xl">
                  <Award className="text-yellow-500 group-hover:rotate-12 transition-transform" size={32} />
                </div>
                <div className="text-lg font-bold text-yellow-100/90 italic tracking-tight">{omdbData.Awards}</div>
              </div>
            )}

            <div className="flex flex-wrap gap-5 pt-8">
              <button 
                onClick={() => onWatch(movie)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-5 bg-white text-black px-12 py-6 rounded-3xl font-black text-xl hover:bg-blue-600 hover:text-white transition-all shadow-3xl hover:shadow-blue-600/40 active:scale-95 group"
              >
                <Play fill="currentColor" size={24} /> <span>Watch Now</span>
              </button>
              <button 
                onClick={() => onWatchlistToggle(movie)}
                className={`flex items-center justify-center gap-3 px-8 py-6 rounded-3xl font-black text-xl border transition-all active:scale-95 ${
                  isInWatchlist ? 'bg-blue-600 text-white border-blue-500 shadow-2xl shadow-blue-600/30' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                }`}
              >
                <Plus size={32} className={isInWatchlist ? 'rotate-45 transition-transform' : ''} />
              </button>
              {movie.trailerUrl && (
                <a 
                  href={movie.trailerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-6 bg-red-600/10 border border-red-600/20 rounded-3xl hover:bg-red-600 hover:text-white text-red-500 transition-all flex items-center justify-center font-black active:scale-95"
                >
                  <Youtube size={32} />
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-16 pt-16 border-t border-white/5">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-gray-600 tracking-[0.5em]">Director</h4>
                <p className="text-white text-3xl font-black tracking-tight">{omdbData?.Director || movie.director || "TBA"}</p>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-gray-600 tracking-[0.5em]">Key Cast</h4>
                <p className="text-gray-400 text-sm font-bold leading-relaxed italic">
                  {omdbData?.Actors || movie.cast?.join(', ') || "Ensemble Cast"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Deep Discovery Section */}
        <div className="p-10 md:p-24 border-t border-white/5 bg-gradient-to-b from-transparent to-black">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-10 mb-16">
            <div className="space-y-3 text-center sm:text-left">
              <h3 className="text-5xl font-black tracking-tighter uppercase flex items-center justify-center sm:justify-start gap-5 italic">
                <Sparkles size={40} className="text-blue-500 animate-pulse" /> Deep Discovery
              </h3>
              <p className="text-[11px] font-black text-gray-500 uppercase tracking-[0.4em]">Proprietary Gemini Cross-Referencing</p>
            </div>
            {loadingSimilar && <Loader2 className="animate-spin text-blue-500" size={40} />}
          </div>

          <div className="flex gap-10 overflow-x-auto pb-10 snap-x scroll-smooth no-scrollbar">
            {loadingSimilar ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="min-w-[280px] aspect-[2/3] bg-white/5 rounded-[3rem] animate-pulse" />
              ))
            ) : similarMovies.length > 0 ? (
              similarMovies.map((similar) => (
                <div 
                  key={similar.id} 
                  className="min-w-[240px] md:min-w-[300px] group cursor-pointer snap-center"
                  onClick={() => onSelectMovie(similar)}
                >
                  <div className="relative aspect-[2/3] rounded-[3rem] overflow-hidden mb-8 border border-white/5 group-hover:border-blue-500/50 transition-all duration-700 shadow-3xl">
                    <img 
                      src={similar.posterUrl} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-blue-600 rounded-full p-6 shadow-3xl scale-75 group-hover:scale-100 transition-transform duration-500">
                          <ChevronRight className="text-white" size={32} />
                        </div>
                    </div>
                  </div>
                  <h4 className="text-2xl font-black truncate text-white/90 group-hover:text-blue-400 transition-colors mb-2">{similar.title}</h4>
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">{similar.year} • {similar.contentType}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 font-bold uppercase tracking-[0.4em] text-[10px] italic py-20 text-center w-full">Scanning cinematic patterns for matches...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
