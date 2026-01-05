
import { Movie, SearchResult, OmdbDetails, NewsArticle } from "../types";

const OMDB_API_KEY = "1a9ba45f";
const GNEWS_API_KEY = "6901869e96f642469d7a26f787127a6f";

export interface SearchFilters {
  type: 'all' | 'movie' | 'series';
  year?: string;
  genre?: string;
}

export class MovieService {
  private cache: Map<string, any> = new Map();

  /**
   * Universal Discovery Engine v4.4
   * Performs high-fidelity search with multi-page retrieval and data merging.
   */
  async searchEntertainment(
    query: string, 
    filters: SearchFilters = { type: 'all' }
  ): Promise<SearchResult> {
    const sanitizedQuery = query.trim() || '2024';
    const cacheKey = JSON.stringify({ sanitizedQuery, filters, v: 'production-v2' });
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    try {
      const typeParam = filters.type === 'all' ? '' : `&type=${filters.type}`;
      const yearParam = filters.year ? `&y=${filters.year}` : '';
      
      let finalQuery = sanitizedQuery;
      // Refined keywords for OMDb 's' parameter - simpler is often better for broad results
      const moodMap: Record<string, string> = {
        "Adrenaline": "action",
        "Noir": "crime",
        "Cerebral": "mystery",
        "Zen": "comedy",
        "Eerie": "horror",
        "Popular": "2024",
        "Trending": "2025",
        "Cinema": "movie",
        "Series": "series"
      };

      if (moodMap[sanitizedQuery]) {
        finalQuery = moodMap[sanitizedQuery];
      }

      // Add genre context if specified
      if (filters.genre) {
        finalQuery = `${finalQuery} ${filters.genre}`;
      }

      // Phase 1: Deep Scanning - Fetching more pages for population
      const pagesToFetch = [1, 2, 3];
      const searchPromises = pagesToFetch.map(page => 
        fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(finalQuery)}${typeParam}${yearParam}&page=${page}`)
          .then(res => res.json())
      );

      const responses = await Promise.all(searchPromises);
      const candidates = responses
        .filter(r => r.Response === "True")
        .flatMap(r => r.Search);

      if (candidates.length === 0) {
        // Fallback to a very broad search if everything else fails
        if (sanitizedQuery !== "2024") {
            return this.searchEntertainment("2024", { type: filters.type });
        }
        return { movies: [], sources: [] };
      }

      // Phase 2: Deduplication and Quality Control
      const seen = new Set();
      const uniqueCandidates = candidates.filter(c => {
        if (!c || !c.imdbID || seen.has(c.imdbID) || !c.Poster || c.Poster === 'N/A') return false;
        seen.add(c.imdbID);
        return true;
      }).slice(0, 24); // Increased limit for better population

      // Phase 3: High-Fidelity Enrichment
      const details = await Promise.all(
        uniqueCandidates.map(c => this.fetchOmdbData(c.imdbID, c.Title))
      );
      
      let movies: Movie[] = details
        .filter((d): d is OmdbDetails => d !== null && d.Response === "True")
        .map(d => this.mapOmdbToMovie(d));

      // Phase 4: Production Scoring - Rank by Rating and Year
      movies = movies.sort((a, b) => {
        const scoreA = (parseFloat(a.rating) || 0) + (parseInt(a.year) / 500);
        const scoreB = (parseFloat(b.rating) || 0) + (parseInt(b.year) / 500);
        return scoreB - scoreA;
      });

      const result = { 
        movies, 
        sources: [{ title: "CineVault Neural Node", uri: "http://www.omdbapi.com/" }] 
      };
      
      this.cache.set(cacheKey, result);
      return result;
    } catch (e) {
      console.error("Discovery Core Failure:", e);
      return { movies: [], sources: [] };
    }
  }

  async getSimilarMovies(movie: Movie): Promise<Movie[]> {
    const genre = movie.genre[0] || 'Action';
    const res = await this.searchEntertainment(genre, { type: movie.contentType === 'tv' ? 'series' : 'movie' });
    return res.movies.filter(m => m.id !== movie.id).slice(0, 10);
  }

  async fetchOmdbData(imdbId: string | null, title: string): Promise<OmdbDetails | null> {
    const key = `raw-${imdbId || title}`;
    if (this.cache.has(key)) return this.cache.get(key);

    try {
      const q = imdbId ? `i=${imdbId}` : `t=${encodeURIComponent(title)}`;
      const res = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&${q}&plot=full`);
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
    const key = 'news-v-final';
    if (this.cache.has(key)) return this.cache.get(key);

    try {
      const res = await fetch(`https://gnews.io/api/v4/top-headlines?category=entertainment&lang=en&max=15&apikey=${GNEWS_API_KEY}`);
      const data = await res.json();
      const articles = data.articles || [];
      this.cache.set(key, articles);
      return articles;
    } catch {
      return [];
    }
  }

  private mapOmdbToMovie(d: OmdbDetails): Movie {
    return {
      id: d.imdbID,
      imdbId: d.imdbID,
      tmdbId: d.imdbID,
      title: d.Title,
      year: d.Year,
      rating: d.imdbRating && d.imdbRating !== 'N/A' ? d.imdbRating : "7.2",
      description: d.Plot || "Data link synchronization failed. No synopsis retrieved.",
      posterUrl: d.Poster,
      backdropUrl: d.Poster,
      genre: d.Genre ? d.Genre.split(', ') : [],
      director: d.Director || 'Archive Unknown',
      cast: d.Actors ? d.Actors.split(', ') : [],
      runtime: d.Runtime || 'N/A',
      contentType: d.Type === 'series' ? 'tv' : 'movie'
    };
  }
}

export const gemini = new MovieService();
