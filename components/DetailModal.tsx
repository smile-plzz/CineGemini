
import React, { useState, useEffect, useRef } from 'react';
import { Movie, OmdbDetails } from '../types';
import { X, Play, Calendar, Clock, Star, Plus, Film, Loader2, Award, ChevronRight } from 'lucide-react';
import { movieService } from '../services/movieService';

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
          movieService.getSimilarMovies(movie),
          movieService.fetchOmdbData(movie.imdbId || null, movie.title)
        ]);
        setSimilarMovies(similar);
        setOmdbData(omdb);
      } catch (err) {
        console.error("Data load error:", err);
      } finally {
        setLoadingSimilar(false);
      }
    };
    loadContent();
  }, [movie.id]);

  const rating = omdbData?.imdbRating || movie.rating || "N/A";

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center overflow-hidden animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      
      <div 
        ref={containerRef}
        className="relative bg-[#0d0d0d] w-full h-[92vh] md:h-[85vh] md:max-w-6xl md:rounded-3xl overflow-y-auto shadow-2xl border-t md:border border-white/10 flex flex-col scroll-smooth no-scrollbar"
      >
        {/* Header/Close Button */}
        <div className="sticky top-0 right-0 z-[110] p-4 flex justify-end pointer-events-none">
          <button 
            onClick={onClose}
            className="p-3 bg-black/60 hover:bg-white/10 text-white rounded-full transition-all border border-white/20 backdrop-blur-xl pointer-events-auto"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Visual Hero */}
          <div className="w-full md:w-[40%] relative shrink-0">
            <div className="aspect-[2/3] md:aspect-auto md:h-full relative overflow-hidden">
              <img 
                src={movie.posterUrl} 
                alt={movie.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-transparent md:bg-gradient-to-r" />
            </div>
          </div>

          {/* Details Content */}
          <div className="flex-1 p-6 md:p-12 lg:p-16 space-y-8">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {movie.genre?.map((g, idx) => (
                  <span key={idx} className="bg-blue-600/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {g}
                  </span>
                ))}
              </div>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight">
                {movie.title}
              </h2>
              <div className="flex items-center gap-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                <span className="flex items-center gap-2 text-white"><Calendar size={14} className="text-blue-500" /> {movie.year}</span>
                <span className="flex items-center gap-2 text-white"><Clock size={14} className="text-blue-500" /> {movie.runtime}</span>
                <span className="flex items-center gap-2 text-yellow-500"><Star size={14} fill="currentColor" /> {rating}</span>
              </div>
            </div>

            <p className="text-gray-300 text-base md:text-lg leading-relaxed font-medium">
              {movie.description}
            </p>

            {omdbData?.Awards && omdbData.Awards !== "N/A" && (
              <div className="flex items-center gap-4 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl">
                <Award className="text-yellow-500 shrink-0" size={24} />
                <span className="text-sm font-semibold text-yellow-200/80">{omdbData.Awards}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={() => onWatch(movie)}
                className="flex-1 flex items-center justify-center gap-3 bg-white text-black py-4 rounded-xl font-bold hover:bg-blue-600 hover:text-white transition-all active:scale-95"
              >
                <Play fill="currentColor" size={20} /> <span>Stream Now</span>
              </button>
              <button 
                onClick={() => onWatchlistToggle(movie)}
                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl font-bold border transition-all active:scale-95 ${
                  isInWatchlist ? 'bg-blue-600/20 text-blue-400 border-blue-500/40' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                }`}
              >
                <Plus size={20} className={isInWatchlist ? 'rotate-45 transition-transform' : ''} />
                <span>{isInWatchlist ? 'In Vault' : 'Add to Vault'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-white/5">
              <div>
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Director</h4>
                <p className="text-white font-bold">{omdbData?.Director || movie.director}</p>
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Cast</h4>
                <p className="text-gray-400 text-sm font-medium line-clamp-2">{omdbData?.Actors || movie.cast?.join(', ')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Movies */}
        <div className="p-6 md:p-12 bg-black/40 border-t border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 italic">
              <Film size={24} className="text-blue-500" /> Recommendations
            </h3>
            {loadingSimilar && <Loader2 className="animate-spin text-blue-500" size={20} />}
          </div>

          <div className="flex gap-4 overflow-x-auto pb-6 snap-x no-scrollbar">
            {loadingSimilar ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="min-w-[140px] md:min-w-[180px] aspect-[2/3] bg-white/5 rounded-2xl animate-pulse" />
              ))
            ) : similarMovies.length > 0 ? (
              similarMovies.map((similar) => (
                <div 
                  key={similar.id} 
                  className="min-w-[140px] md:min-w-[180px] group cursor-pointer snap-start"
                  onClick={() => onSelectMovie(similar)}
                >
                  <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-white/5 group-hover:border-blue-500/50 transition-all">
                    <img 
                      src={similar.posterUrl} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ChevronRight className="text-white" size={24} />
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-3 truncate">{similar.title}</h4>
                  <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">{similar.year}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest text-center w-full py-10">No similar matches found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
