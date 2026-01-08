
import React, { useState, useEffect } from 'react';
import { Movie } from '../types';
import { movieService } from '../services/movieService';
import { Star, Play, ChevronRight, ChevronLeft } from 'lucide-react';

interface NowPlayingCarouselProps {
  onSelectMovie: (movie: Movie) => void;
}

const NowPlayingCarousel: React.FC<NowPlayingCarouselProps> = ({ onSelectMovie }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await movieService.fetchNowPlaying();
        setMovies(data);
      } catch (err) {
        console.error("Carousel load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-[400px] md:h-[500px] bg-white/5 rounded-3xl animate-pulse flex items-center justify-center">
        <div className="text-gray-500 uppercase font-black tracking-widest text-[10px]">Syncing Theatrical Feed...</div>
      </div>
    );
  }

  if (movies.length === 0) return null;

  return (
    <section className="relative group overflow-hidden rounded-3xl">
      <div className="flex items-center justify-between mb-6 px-2">
        <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          Theatrical Premieres
        </h3>
        <div className="flex gap-2">
          <button className="p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/5 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button className="p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/5 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-6 snap-x no-scrollbar">
        {movies.map((movie) => (
          <div 
            key={movie.id}
            onClick={() => onSelectMovie(movie)}
            className="min-w-[280px] md:min-w-[400px] h-[350px] md:h-[450px] relative rounded-3xl overflow-hidden snap-start cursor-pointer group/item transition-all duration-500 hover:scale-[1.02]"
          >
            <img 
              src={movie.posterUrl} 
              alt={movie.title}
              className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-1000"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            
            <div className="absolute bottom-0 inset-x-0 p-6 md:p-8 space-y-3 translate-y-2 group-hover/item:translate-y-0 transition-transform duration-500">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-lg">New Release</span>
                <div className="flex items-center gap-1.5 text-yellow-500">
                  <Star size={12} fill="currentColor" />
                  <span className="text-[10px] font-black">{movie.rating}</span>
                </div>
              </div>

              <h4 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white drop-shadow-lg line-clamp-1">
                {movie.title}
              </h4>

              <div className="flex items-center gap-4 opacity-0 group-hover/item:opacity-100 transition-opacity duration-500">
                <button className="flex items-center gap-2 bg-white text-black px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">
                  <Play size={12} fill="currentColor" /> Preview
                </button>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{movie.genre[0]} &bull; {movie.year}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default NowPlayingCarousel;
