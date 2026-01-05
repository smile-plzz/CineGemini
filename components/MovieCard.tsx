
import React from 'react';
import { Movie } from '../types';
import { Star } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
  onClick: (movie: Movie) => void;
  onWatchlistToggle: (movie: Movie) => void;
  isInWatchlist: boolean;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick, onWatchlistToggle, isInWatchlist }) => {
  const rating = movie.rating || "N/A";

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=2070&auto=format&fit=crop";
  };

  return (
    <article 
      className="group relative bg-[#0d0d0d] rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.03] border border-white/5 hover:border-blue-500/40 flex flex-col h-full animate-in zoom-in-95 duration-500"
    >
      <div 
        className="aspect-[2/3] w-full overflow-hidden cursor-pointer relative"
        onClick={() => onClick(movie)}
      >
        <img 
          src={movie.posterUrl} 
          alt={movie.title}
          onError={handleImageError}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        
        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 text-center">
           <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">{movie.year}</p>
           <h4 className="text-sm font-black text-white leading-tight mb-4 line-clamp-2">{movie.title}</h4>
           <button 
              onClick={(e) => { e.stopPropagation(); onClick(movie); }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-lg active:scale-95 transition-transform"
           >
             View Intel
           </button>
        </div>

        {movie.contentType === 'tv' && (
          <div className="absolute top-2 right-2">
            <span className="bg-blue-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-widest">
              TV
            </span>
          </div>
        )}

        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-white/10">
          <Star size={10} fill="#eab308" className="text-yellow-500" />
          <span className="text-[9px] font-bold text-white">{rating}</span>
        </div>
      </div>

      <div className="p-3 space-y-3 mt-auto">
        <h3 className="font-bold text-xs leading-tight truncate text-white/90">
          {movie.title}
        </h3>
        
        <button 
          onClick={(e) => { e.stopPropagation(); onWatchlistToggle(movie); }}
          className={`w-full py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${
            isInWatchlist 
              ? 'bg-blue-600/10 text-blue-500 border-blue-500/30' 
              : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10 hover:text-white'
          }`}
        >
          {isInWatchlist ? 'Vaulted' : '+ Vault'}
        </button>
      </div>
    </article>
  );
};

export default MovieCard;
