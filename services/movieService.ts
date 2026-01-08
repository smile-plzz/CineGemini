
import { Movie, SearchResult, OmdbDetails, NewsArticle } from "../types";
import { GoogleGenAI, Type } from "@google/genai";

// Primary Node (User Provided)
const OMDB_NODES = ["c5bb2c78", "1a9ba45f", "971169c8", "60327f31"];
const GNEWS_API_KEY = "70f8f36aed5c9ccfb722c933455bc237";

const PLACEHOLDER_POSTER = "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=2070&auto=format&fit=crop";

export interface SearchFilters {
  type: 'all' | 'movie' | 'series';
  year?: string;
  genre?: string;
}

async function fetchWithTimeout(resource: string, options: any = {}, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export class MovieService {
  private cache: Map<string, any> = new Map();
  private currentNodeIndex = 0;
  private ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

  private get apiKey() {
    return OMDB_NODES[this.currentNodeIndex];
  }

  private rotateNode() {
    this.currentNodeIndex = (this.currentNodeIndex + 1) % OMDB_NODES.length;
    console.warn(`CineVault: Rotating to Resilience Node ${this.currentNodeIndex}`);
  }

  /**
   * Neural Fallback using Gemini 3 Flash
   */
  private async searchWithGemini(query: string, type: string): Promise<SearchResult> {
    console.log("CineVault: Engaging Neural Metadata Engine...");
    try {
      const prompt = `Search for 10 popular ${type === 'series' ? 'TV shows' : 'movies'} related to "${query}". 
      Return a JSON array of objects with fields: title, year, rating (0.0 to 10.0), description (3 sentences), genre (array), director, cast (array), runtime, contentType (movie or tv).`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                year: { type: Type.STRING },
                rating: { type: Type.STRING },
                description: { type: Type.STRING },
                genre: { type: Type.ARRAY, items: { type: Type.STRING } },
                director: { type: Type.STRING },
                cast: { type: Type.ARRAY, items: { type: Type.STRING } },
                runtime: { type: Type.STRING },
                contentType: { type: Type.STRING }
              },
              required: ["title", "year", "rating", "description", "contentType"]
            }
          }
        }
      });

      const aiData = JSON.parse(response.text || "[]");
      const movies: Movie[] = aiData.map((m: any, idx: number) => ({
        id: `ai-${idx}-${Date.now()}`,
        imdbId: null,
        tmdbId: m.title.replace(/\s+/g, '-').toLowerCase(),
        title: m.title,
        year: m.year,
        rating: m.rating,
        description: m.description,
        posterUrl: `https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=2059&auto=format&fit=crop&text=${encodeURIComponent(m.title)}`,
        backdropUrl: `https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop`,
        genre: m.genre || ["Cinema"],
        director: m.director || "Neural Generated",
        cast: m.cast || [],
        runtime: m.runtime || "N/A",
        contentType: m.contentType === 'tv' ? 'tv' : 'movie'
      }));

      return { movies, sources: [{ title: "Gemini Neural Engine", uri: "AI-Link" }] };
    } catch (err) {
      console.error("Neural Engine Failure:", err);
      return { movies: [], sources: [] };
    }
  }

  async fetchNowPlaying(): Promise<Movie[]> {
    const cacheKey = "now-playing-v5";
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);
    
    try {
      const res = await this.searchEntertainment("2024 blockbusters", { type: 'movie' });
      const movies = res.movies.slice(0, 8);
      this.cache.set(cacheKey, movies);
      return movies;
    } catch {
      return [];
    }
  }

  async searchEntertainment(
    query: string, 
    filters: SearchFilters = { type: 'all' },
    isRetry = false
  ): Promise<SearchResult> {
    const sanitizedQuery = (query || '').trim() || '2024';
    const cacheKey = JSON.stringify({ sanitizedQuery, filters, node: this.currentNodeIndex, v: 'v11-ai-shield' });
    
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    try {
      const typeParam = filters.type === 'all' ? '' : `&type=${filters.type}`;
      const yearParam = filters.year ? `&y=${filters.year}` : '';
      
      const url = `https://www.omdbapi.com/?apikey=${this.apiKey}&s=${encodeURIComponent(sanitizedQuery)}${typeParam}${yearParam}&page=1`;
      
      const response = await fetchWithTimeout(url);
      const data = await response.json();

      if (data.Response === "False") {
        const errorMsg = data.Error || "";
        console.warn(`OMDb Node ${this.currentNodeIndex} rejected: ${errorMsg}`);
        
        // If API key is invalid or limit hit, try AI fallback instead of failing
        if (errorMsg.includes("API key") || errorMsg.includes("limit") || errorMsg.includes("not found")) {
          return await this.searchWithGemini(sanitizedQuery, filters.type);
        }
        
        return { movies: [], sources: [] };
      }

      const candidates = data.Search || [];
      const movieDetails = await Promise.all(
        candidates.slice(0, 10).map(async (c: any) => {
          try {
            return await this.fetchOmdbData(c.imdbID, c.Title);
          } catch {
            return null;
          }
        })
      );
      
      let movies: Movie[] = movieDetails
        .filter((d): d is OmdbDetails => d !== null && d.Response === "True")
        .map(d => this.mapOmdbToMovie(d));

      // Fallback if details fail but search succeeded
      if (movies.length === 0 && candidates.length > 0) {
        movies = candidates.map((c: any) => ({
          id: c.imdbID,
          title: c.Title,
          year: c.Year,
          rating: "N/A",
          description: "Full synopsis encrypted in high-tier archive.",
          posterUrl: (c.Poster && c.Poster !== 'N/A') ? c.Poster : PLACEHOLDER_POSTER,
          backdropUrl: (c.Poster && c.Poster !== 'N/A') ? c.Poster : PLACEHOLDER_POSTER,
          genre: [],
          director: "Archive Default",
          cast: [],
          runtime: "N/A",
          contentType: c.Type === 'series' ? 'tv' : 'movie'
        }));
      }

      const result = { movies, sources: [{ title: `OMDb Node ${this.currentNodeIndex}`, uri: "https://www.omdbapi.com/" }] };
      this.cache.set(cacheKey, result);
      return result;

    } catch (e: any) {
      console.error("Discovery Transport Failure. Engaging AI Fallback...");
      // For any network error or fetch failure, use Gemini
      return await this.searchWithGemini(sanitizedQuery, filters.type);
    }
  }

  async getSimilarMovies(movie: Movie): Promise<Movie[]> {
    try {
        const res = await this.searchEntertainment(movie.genre[0] || movie.title, { type: movie.contentType === 'tv' ? 'series' : 'movie' });
        return res.movies.filter(m => m.id !== movie.id).slice(0, 8);
    } catch {
        return [];
    }
  }

  async fetchOmdbData(imdbId: string | null, title: string): Promise<OmdbDetails | null> {
    try {
      const q = imdbId ? `i=${imdbId}` : `t=${encodeURIComponent(title)}`;
      const res = await fetchWithTimeout(`https://www.omdbapi.com/?apikey=${this.apiKey}&${q}&plot=short`);
      const data = await res.json();
      return data.Response === "True" ? data : null;
    } catch {
      return null;
    }
  }

  async fetchEntertainmentNews(): Promise<NewsArticle[]> {
    try {
      const res = await fetchWithTimeout(`https://gnews.io/api/v4/top-headlines?category=entertainment&lang=en&max=10&apikey=${GNEWS_API_KEY}`);
      const data = await res.json();
      return data.articles || [];
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
      rating: d.imdbRating || "N/A",
      description: d.Plot || "Synopsis restricted.",
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
