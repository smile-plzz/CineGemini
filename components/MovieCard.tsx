import React, { useState, useMemo } from 'react';
import { Movie } from '../types';
import { Star, Calendar, Film, Tv, Clock } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
  onClick: (movie: Movie) => void;
  onWatchlistToggle: (movie: Movie) => void;
  isInWatchlist: boolean;
}

// Helper to map genre IDs to text (You can move this to a utility file)
const getGenreName = (id?: number) => {
  const genres: Record<number, string> = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
    99: 'Doc', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
    27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
  };
  return id ? genres[id] || 'General' : 'General';
};

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick, onWatchlistToggle, isInWatchlist }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Robust Data Handling
  const rating = typeof movie.rating === 'number' ? movie.rating.toFixed(1) : "N/A";
  const releaseYear = movie.year || (movie.first_air_date ? new Date(movie.first_air_date).getFullYear() : 'N/A');
  const primaryGenre = movie.genre_ids && movie.genre_ids.length > 0 ? getGenreName(movie.genre_ids[0]) : "Unknown";
  
  // Dynamic Color for Rating
  const ratingColor = useMemo(() => {
    if (movie.rating >= 7.5) return "text-green-400";
    if (movie.rating >= 5) return "text-yellow-400";
    return "text-red-400";
  }, [movie.rating]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setImgError(true);
    e.currentTarget.src = "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=2070&auto=format&fit=crop";
  };

  return (
    <article 
      className="group relative bg-[#0d0d0d] rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.03] border border-white/5 hover:border-blue-500/40 flex flex-col h-full animate-in zoom-in-95 duration-500 shadow-lg hover:shadow-blue-900/10"
    >
      {/* --- Image Container --- */}
      <div 
        className="aspect-[2/3] w-full overflow-hidden cursor-pointer relative bg-white/5"
        onClick={() => onClick(movie)}
      >
        {/* Skeleton Loader behind image */}
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 animate-pulse bg-white/5 flex items-center justify-center">
            <Film className="opacity-20 animate-bounce" size={24} />
          </div>
        )}

        <img 
          src={movie.posterUrl} 
          alt={movie.title}
          onError={handleImageError}
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:contrast-110 
            ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
        />
        
        {/* Overlay Hover State */}
        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 text-center backdrop-blur-[2px]">
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
             <Calendar size={10} /> {releaseYear}
           </p>
           
           <h4 className="text-sm font-black text-white leading-tight mb-2 line-clamp-3">
             {movie.title}
           </h4>
           
           {/* Mini Metadata in Overlay */}
           <div className="flex gap-2 mb-4">
              <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded text-white/70">{primaryGenre}</span>
              {movie.original_language && (
                <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded text-white/70 uppercase">{movie.original_language}</span>
              )}
           </div>

           <button 
             onClick={(e) => { e.stopPropagation(); onClick(movie); }}
             className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-blue-900/20 active:scale-95 transition-all w-full max-w-[120px]"
           >
             View Intel
           </button>
        </div>

        {/* Top Right Tag (TV/Movie) */}
        <div className="absolute top-2 right-2">
          <span className={`flex items-center gap-1 text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest backdrop-blur-md shadow-sm border border-white/5
            ${movie.contentType === 'tv' ? 'bg-purple-600/90 text-white' : 'bg-blue-600/90 text-white'}`}>
            {movie.contentType === 'tv' ? <Tv size={8} /> : <Film size={8} />}
            {movie.contentType === 'tv' ? 'Series' : 'Film'}
          </span>
        </div>

        {/* Bottom Left Rating Badge */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 shadow-lg">
          <Star size={10} fill="currentColor" className={ratingColor} />
          <span className={`text-[10px] font-black ${ratingColor}`}>{rating}</span>
        </div>
      </div>

      {/* --- Card Details --- */}
      <div className="p-3 space-y-3 mt-auto bg-gradient-to-b from-[#0d0d0d] to-[#080808]">
        <div className="space-y-1">
          <h3 className="font-bold text-xs leading-tight truncate text-white/90 group-hover:text-blue-400 transition-colors">
            {movie.title}
          </h3>
          <div className="flex items-center justify-between text-[9px] text-white/40 font-medium uppercase tracking-wider">
             <span>{releaseYear}</span>
             <span className="flex items-center gap-1 truncate max-w-[80px] justify-end">
               {primaryGenre}
             </span>
          </div>
        </div>
        
        <button 
          onClick={(e) => { e.stopPropagation(); onWatchlistToggle(movie); }}
          className={`w-full py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${
            isInWatchlist 
              ? 'bg-blue-600/10 text-blue-500 border-blue-500/30 shadow-[0_0_10px_rgba(37,99,235,0.1)]' 
              : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10 hover:text-white hover:border-white/10'
          }`}
        >
          {isInWatchlist ? (
            <>
              <Clock size={10} /> Vaulted
            </>
          ) : (
            '+ Vault'
          )}
        </button>
      </div>
    </article>
  );
};

export default MovieCard;
