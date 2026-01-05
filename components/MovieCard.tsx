
import React, { useState, useEffect } from 'react';
import { Movie, OmdbDetails } from '../types';
import { Star, Clock, Info, Award, Target, Loader2 } from 'lucide-react';
import { gemini } from '../services/geminiService';

interface MovieCardProps {
  movie: Movie;
  onClick: (movie: Movie) => void;
  onWatchlistToggle: (movie: Movie) => void;
  isInWatchlist: boolean;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick, onWatchlistToggle, isInWatchlist }) => {
  const [omdbDetails, setOmdbDetails] = useState<OmdbDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchExtraData = async () => {
      if (!movie.imdbId && !movie.title) return;
      setLoading(true);
      try {
        const data = await gemini.fetchOmdbData(movie.imdbId || null, movie.title);
        if (data) setOmdbDetails(data);
      } catch (error) {
        console.error("OMDb fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchExtraData();
  }, [movie.id]);

  const rating = omdbDetails?.imdbRating || movie.rating || "N/A";
  const metascore = omdbDetails?.Metascore && omdbDetails.Metascore !== "N/A" ? omdbDetails.Metascore : null;

  return (
    <div className="group relative bg-[#121212] rounded-[2rem] overflow-hidden transition-all duration-700 hover:scale-[1.04] hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] border border-white/5 hover:border-blue-500/40">
      <div 
        className="aspect-[2/3] w-full overflow-hidden cursor-pointer relative"
        onClick={() => onClick(movie)}
      >
        <img 
          src={movie.posterUrl} 
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Unified Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6">
          <div className="space-y-4 transform translate-y-6 group-hover:translate-y-0 transition-transform duration-700 ease-out">
             {metascore && (
               <div className="flex items-center gap-2">
                 <div className={`px-2 py-1 rounded-md text-[10px] font-black text-black ${parseInt(metascore) >= 60 ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]'}`}>
                   {metascore}
                 </div>
                 <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Metascore</span>
               </div>
             )}
             
             <button 
                onClick={(e) => { e.stopPropagation(); onClick(movie); }}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl flex items-center justify-center gap-3 transition-all font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/30 active:scale-95"
             >
               <Info size={16} /> Analysis
             </button>
          </div>
        </div>

        {/* Status Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
          {movie.contentType === 'tv' && (
            <span className="bg-blue-600/80 backdrop-blur-xl text-white text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border border-white/10 shadow-lg">
              Series
            </span>
          )}
          {loading && (
            <div className="bg-black/60 backdrop-blur-xl p-2 rounded-xl border border-white/10">
              <Loader2 size={12} className="animate-spin text-blue-500" />
            </div>
          )}
        </div>
      </div>

      <div className="p-5 lg:p-6 space-y-4">
        <div className="flex justify-between items-start gap-3">
          <h3 className="font-black text-lg leading-[1.1] tracking-tight line-clamp-1 group-hover:text-blue-400 transition-colors">
            {movie.title}
          </h3>
          <div className="bg-yellow-500/10 text-yellow-500 px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1.5 border border-yellow-500/20 shrink-0">
            <Star size={12} fill="currentColor" /> {rating}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2.5">
            <span>{movie.year}</span>
            <div className="w-1 h-1 bg-gray-700 rounded-full" />
            <span className="flex items-center gap-1.5"><Clock size={14} className="text-blue-500/70" /> {movie.runtime}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {movie.genre?.slice(0, 2).map((g, idx) => (
            <span key={idx} className="text-[9px] font-black uppercase tracking-widest bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl text-gray-400">
              {g}
            </span>
          ))}
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); onWatchlistToggle(movie); }}
          className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 border active:scale-95 ${
            isInWatchlist 
              ? 'bg-blue-600 text-white border-blue-500 shadow-xl shadow-blue-600/20' 
              : 'bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/30'
          }`}
        >
          {isInWatchlist ? 'In Vault' : '+ Add Vault'}
        </button>
      </div>
    </div>
  );
};

export default MovieCard;
