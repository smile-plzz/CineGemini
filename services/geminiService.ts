
import { GoogleGenAI, Type } from "@google/genai";
import { Movie, SearchResult, OmdbDetails, NewsArticle } from "../types";

const OMDB_API_KEY = "1a9ba45f";
const GNEWS_API_KEY = "6901869e96f642469d7a26f787127a6f";

export class GeminiService {
  private cache: Map<string, any> = new Map();

  private getClient() {
    // Always create a new instance to ensure we use the current API_KEY from the environment
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async searchEntertainment(query: string, type: 'all' | 'movies' | 'tv' = 'all'): Promise<SearchResult> {
    const cacheKey = `search-${type}-${query}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Perform an expert cinematic search for ${type === 'all' ? 'movies and TV' : type} matching: "${query}". 
      Return at least 12 high-quality titles.
      Format: JSON. Include YouTube trailer links, TMDB IDs, and IMDB IDs.
      Write a concise 2-sentence AI insight about the curated selection.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            aiInsight: { type: Type.STRING },
            movies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  tmdbId: { type: Type.STRING },
                  imdbId: { type: Type.STRING },
                  title: { type: Type.STRING },
                  year: { type: Type.STRING },
                  rating: { type: Type.STRING },
                  description: { type: Type.STRING },
                  posterUrl: { type: Type.STRING },
                  backdropUrl: { type: Type.STRING },
                  genre: { type: Type.ARRAY, items: { type: Type.STRING } },
                  director: { type: Type.STRING },
                  cast: { type: Type.ARRAY, items: { type: Type.STRING } },
                  runtime: { type: Type.STRING },
                  trailerUrl: { type: Type.STRING },
                  contentType: { type: Type.STRING, enum: ['movie', 'tv'] }
                },
                required: ["id", "title", "posterUrl", "contentType"]
              }
            }
          }
        }
      }
    });

    try {
      const data = JSON.parse(response.text || "{}");
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.web?.title || "Search Reference",
        uri: chunk.web?.uri || ""
      })).filter((s: any) => s.uri) || [];

      const result = {
        aiInsight: data.aiInsight || "Synchronizing with global cinematic trends for these top picks.",
        movies: (data.movies || []).map((m: any) => ({
          ...m,
          tmdbId: m.tmdbId || m.id,
          imdbId: m.imdbId || null,
          posterUrl: m.posterUrl || `https://images.unsplash.com/photo-1485846234645-a62644ef7467?w=400&h=600&fit=crop`,
          rating: m.rating || "N/A",
          runtime: m.runtime || "Feature"
        })),
        sources
      };
      
      this.cache.set(cacheKey, result);
      return result;
    } catch (e) {
      console.error("Gemini Search Error:", e);
      return { aiInsight: "Discovery engine stabilized. No current results.", movies: [], sources: [] };
    }
  }

  async getSimilarMovies(movie: Movie): Promise<Movie[]> {
    const cacheKey = `similar-${movie.id}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Recommend 10 movies/shows strictly similar to "${movie.title}" (${movie.year}). Focus on thematic and stylistic parallels.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            movies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  tmdbId: { type: Type.STRING },
                  imdbId: { type: Type.STRING },
                  title: { type: Type.STRING },
                  year: { type: Type.STRING },
                  rating: { type: Type.STRING },
                  posterUrl: { type: Type.STRING },
                  contentType: { type: Type.STRING, enum: ['movie', 'tv'] }
                },
                required: ["id", "title", "posterUrl", "contentType"]
              }
            }
          }
        }
      }
    });

    try {
      const data = JSON.parse(response.text || "{}");
      const results = (data.movies || []).map((m: any) => ({
        ...m,
        tmdbId: m.tmdbId || m.id,
        posterUrl: m.posterUrl || `https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=400&h=600&fit=crop`,
        rating: m.rating || "7.8",
        year: m.year || movie.year
      }));
      this.cache.set(cacheKey, results);
      return results;
    } catch (e) {
      return [];
    }
  }

  async fetchOmdbData(imdbId: string | null, title: string): Promise<OmdbDetails | null> {
    const cacheKey = `omdb-${imdbId || title}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    try {
      const query = imdbId && imdbId.startsWith('tt') ? `i=${imdbId}` : `t=${encodeURIComponent(title)}`;
      const response = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&${query}`);
      const data = await response.json();
      if (data.Response === "True") {
        this.cache.set(cacheKey, data);
        return data;
      }
      return null;
    } catch {
      return null;
    }
  }

  async fetchEntertainmentNews(): Promise<NewsArticle[]> {
    const cacheKey = 'ent-news';
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    try {
      const response = await fetch(`https://gnews.io/api/v4/top-headlines?category=entertainment&lang=en&max=12&apikey=${GNEWS_API_KEY}`);
      const data = await response.json();
      this.cache.set(cacheKey, data.articles || []);
      return data.articles || [];
    } catch {
      return [];
    }
  }

  async getChatResponse(history: { role: string; text: string }[], message: string): Promise<string> {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `History:\n${history.map(h => `${h.role}: ${h.text}`).join('\n')}\nUser: ${message}`,
      config: {
        systemInstruction: "You are CineGemini, an expert AI concierge for luxury cinema discovery. Your tone is refined, enthusiastic, and incredibly knowledgeable about film history and theory.",
      }
    });
    return response.text || "The projection booth is currently unattended. Please query again.";
  }
}

export const gemini = new GeminiService();
