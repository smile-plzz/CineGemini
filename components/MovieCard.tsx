
import React from 'react';
import { Movie } from '../types';
import { Star, Clock, Info } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
  onClick: (movie: Movie) => void;
  onWatchlistToggle: (movie: Movie) => void;
  isInWatchlist: boolean;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick, onWatchlistToggle, isInWatchlist }) => {
  const rating = movie.rating || "N/A";

  return (
    <article 
      className="group relative bg-[#121212] rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.03] border border-white/5 hover:border-blue-500/30 flex flex-col h-full"
    >
      <div 
        className="aspect-[2/3] w-full overflow-hidden cursor-pointer relative"
        onClick={() => onClick(movie)}
      >
        <img 
          src={movie.posterUrl} 
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
           <button 
              onClick={(e) => { e.stopPropagation(); onClick(movie); }}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl flex items-center justify-center gap-2 transition-all font-black text-[9px] uppercase tracking-widest shadow-lg"
           >
             <Info size={14} /> Analysis
           </button>
        </div>

        {movie.contentType === 'tv' && (
          <div className="absolute top-2 right-2">
            <span className="bg-blue-600/90 backdrop-blur-md text-white text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest border border-white/10">
              TV
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 gap-2">
        <h3 className="font-black text-sm leading-tight tracking-tight line-clamp-1 group-hover:text-blue-400 transition-colors">
          {movie.title}
        </h3>
        
        <div className="flex items-center justify-between text-[9px] text-gray-500 font-black uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <span>{movie.year}</span>
            <div className="w-1 h-1 bg-gray-700 rounded-full" />
            <span className="flex items-center gap-1"><Clock size={12} className="text-blue-500/50" /> {movie.runtime}</span>
          </div>
          <div className="flex items-center gap-1 text-yellow-500">
            <Star size={10} fill="currentColor" /> {rating}
          </div>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); onWatchlistToggle(movie); }}
          className={`mt-auto w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
            isInWatchlist 
              ? 'bg-blue-600/10 text-blue-500 border-blue-500/30' 
              : 'bg-white/5 text-white/50 border-white/5 hover:bg-white/10'
          }`}
        >
          {isInWatchlist ? 'In Vault' : '+ Vault'}
        </button>
      </div>
    </article>
  );
};

export default MovieCard;
