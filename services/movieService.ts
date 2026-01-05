
import { Movie, SearchResult, OmdbDetails, NewsArticle } from "../types";

// Primary and Fallback Keys to ensure availability
const OMDB_KEYS = ["c5bb2c78"];
const GNEWS_API_KEY = "70f8f36aed5c9ccfb722c933455bc237";

const PLACEHOLDER_POSTER = "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=2070&auto=format&fit=crop";

export interface SearchFilters {
  type: 'all' | 'movie' | 'series';
  year?: string;
  genre?: string;
}

export class MovieService {
  private cache: Map<string, any> = new Map();
  private currentKeyIndex = 0;

  private get apiKey() {
    return OMDB_KEYS[this.currentKeyIndex];
  }

  private rotateKey() {
    this.currentKeyIndex = (this.currentKeyIndex + 1) % OMDB_KEYS.length;
  }

  /**
   * Universal Discovery Engine
   * High-fidelity search with error recovery and data merging.
   */
  async searchEntertainment(
    query: string, 
    filters: SearchFilters = { type: 'all' }
  ): Promise<SearchResult> {
    const sanitizedQuery = query.trim() || '2024';
    const cacheKey = JSON.stringify({ sanitizedQuery, filters, v: 'v4-robust' });
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    try {
      const typeParam = filters.type === 'all' ? '' : `&type=${filters.type}`;
      const yearParam = filters.year ? `&y=${filters.year}` : '';
      
      let finalQuery = sanitizedQuery;
      const moodMap: Record<string, string> = {
        "Adrenaline": "action",
        "Noir": "noir",
        "Cerebral": "sci-fi",
        "Zen": "slice of life",
        "Eerie": "horror",
        "Popular": "2024",
        "Trending": "2025",
        "Cinema": "movie",
        "Series": "series"
      };

      if (moodMap[sanitizedQuery]) {
        finalQuery = moodMap[sanitizedQuery];
      }

      if (filters.genre) {
        finalQuery = `${finalQuery} ${filters.genre}`;
      }

      // OMDb 's' parameter works best with queries > 2 chars
      const effectiveQuery = finalQuery.length < 3 ? `${finalQuery} movie` : finalQuery;

      const pagesToFetch = [1, 2];
      const searchPromises = pagesToFetch.map(page => 
        fetch(`https://www.omdbapi.com/?apikey=${this.apiKey}&s=${encodeURIComponent(effectiveQuery)}${typeParam}${yearParam}&page=${page}`)
          .then(async res => {
            const data = await res.json();
            if (data.Response === "False") {
              console.warn(`OMDb API Error [Page ${page}]:`, data.Error);
              if (data.Error === "Invalid API key!") this.rotateKey();
            }
            return data;
          })
          .catch(err => {
            console.error("Network Error:", err);
            return { Response: "False" };
          })
      );

      const responses = await Promise.all(searchPromises);
      const candidates = responses
        .filter(r => r && r.Response === "True")
        .flatMap(r => r.Search || []);

      if (candidates.length === 0) {
        console.log("No candidates found, attempting fallback to popular...");
        if (sanitizedQuery !== "2024") {
            return this.searchEntertainment("2024", { type: filters.type });
        }
        return { movies: [], sources: [] };
      }

      const seen = new Set();
      const uniqueCandidates = candidates.filter(c => {
        if (!c || !c.imdbID || seen.has(c.imdbID)) return false;
        seen.add(c.imdbID);
        return true;
      }).slice(0, 20);

      const details = await Promise.all(
        uniqueCandidates.map(c => this.fetchOmdbData(c.imdbID, c.Title))
      );
      
      let movies: Movie[] = details
        .filter((d): d is OmdbDetails => d !== null && d.Response === "True")
        .map(d => this.mapOmdbToMovie(d));

      // Quality sorting: high ratings first
      movies = movies.sort((a, b) => {
        const scoreA = (parseFloat(a.rating) || 0) + (parseInt(a.year) / 1000);
        const scoreB = (parseFloat(b.rating) || 0) + (parseInt(b.year) / 1000);
        return scoreB - scoreA;
      });

      const result = { 
        movies, 
        sources: [{ title: "OMDb API Core", uri: "http://www.omdbapi.com/" }] 
      };
      
      this.cache.set(cacheKey, result);
      return result;
    } catch (e) {
      console.error("Critical Discovery Failure:", e);
      return { movies: [], sources: [] };
    }
  }

  async getSimilarMovies(movie: Movie): Promise<Movie[]> {
    const genre = movie.genre[0] || 'Action';
    const res = await this.searchEntertainment(genre, { type: movie.contentType === 'tv' ? 'series' : 'movie' });
    return res.movies.filter(m => m.id !== movie.id).slice(0, 8);
  }

  async fetchOmdbData(imdbId: string | null, title: string): Promise<OmdbDetails | null> {
    const key = `raw-${imdbId || title}`;
    if (this.cache.has(key)) return this.cache.get(key);

    try {
      const q = imdbId ? `i=${imdbId}` : `t=${encodeURIComponent(title)}`;
      const res = await fetch(`https://www.omdbapi.com/?apikey=${this.apiKey}&${q}&plot=full`);
      const data = await res.json();
      if (data.Response === "True") {
        this.cache.set(key, data);
        return data;
      }
      return null;
    } catch {
      return null;
    }
  }

  async fetchEntertainmentNews(): Promise<NewsArticle[]> {
    const key = 'news-cache';
    if (this.cache.has(key)) return this.cache.get(key);

    try {
      const res = await fetch(`https://gnews.io/api/v4/top-headlines?category=entertainment&lang=en&max=10&apikey=${GNEWS_API_KEY}`);
      const data = await res.json();
      const articles = data.articles || [];
      this.cache.set(key, articles);
      return articles;
    } catch {
      return [];
    }
  }

  private mapOmdbToMovie(d: OmdbDetails): Movie {
    const poster = (!d.Poster || d.Poster === 'N/A') ? PLACEHOLDER_POSTER : d.Poster;
    return {
      id: d.imdbID,
      imdbId: d.imdbID,
      tmdbId: d.imdbID,
      title: d.Title,
      year: d.Year,
      rating: d.imdbRating && d.imdbRating !== 'N/A' ? d.imdbRating : "N/A",
      description: d.Plot || "No synopsis available for this title.",
      posterUrl: poster,
      backdropUrl: poster,
      genre: d.Genre ? d.Genre.split(', ') : [],
      director: d.Director || 'Unknown',
      cast: d.Actors ? d.Actors.split(', ') : [],
      runtime: d.Runtime || 'N/A',
      contentType: d.Type === 'series' ? 'tv' : 'movie'
    };
  }
}

export const movieService = new MovieService();
