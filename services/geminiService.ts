
import { Movie, SearchResult, OmdbDetails, NewsArticle } from "../types";

const OMDB_API_KEY = "1a9ba45f";
const GNEWS_API_KEY = "6901869e96f642469d7a26f787127a6f";

export class MovieService {
  private cache: Map<string, any> = new Map();

  async searchEntertainment(query: string, type: 'all' | 'movie' | 'series' = 'all'): Promise<SearchResult> {
    const cacheKey = `v4.2-search-${type}-${query}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    try {
      const typeParam = type === 'all' ? '' : `&type=${type}`;
      let finalQuery = query;
      let yearFilter = "";
      
      const queryMap: Record<string, { q: string, y?: string }> = {
        "Popular": { q: "top hits 2024" },
        "Trending": { q: "blockbuster", y: "2025" },
        "Cinema": { q: "movie", y: "2024" },
        "Series": { q: "series", y: "2024" },
        "Adrenaline": { q: "action adventure fast" },
        "Noir": { q: "crime thriller detective" },
        "Cerebral": { q: "sci-fi psychological mystery" },
        "Zen": { q: "comedy feel good" },
        "Eerie": { q: "horror supernatural ghost" }
      };

      if (queryMap[query]) {
        finalQuery = queryMap[query].q;
        if (queryMap[query].y) yearFilter = `&y=${queryMap[query].y}`;
      }

      const pages = [1, 2, 3];
      const searchPromises = pages.map(page => 
        fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(finalQuery)}${typeParam}${yearFilter}&page=${page}`)
          .then(res => res.json())
      );

      const searchResponses = await Promise.all(searchPromises);
      const allSearchItems = searchResponses
        .filter(data => data.Response === "True")
        .flatMap(data => data.Search);

      if (allSearchItems.length === 0) {
          if (yearFilter) return this.searchEntertainment(finalQuery, type);
          return { movies: [], sources: [] };
      }

      const uniqueItems = Array.from(new Map(
        allSearchItems
          .filter(item => item.Poster && item.Poster !== 'N/A')
          .map(item => [item.imdbID, item])
      ).values());

      const enrichmentLimit = 18;
      const detailPromises = uniqueItems.slice(0, enrichmentLimit).map((item: any) => 
        this.fetchOmdbData(item.imdbID, item.Title)
      );
      
      const detailedResults = await Promise.all(detailPromises);
      
      let movies: Movie[] = detailedResults
        .filter((d): d is OmdbDetails => d !== null && d.Response === "True")
        .map(d => this.mapOmdbToMovie(d));

      movies = movies.sort((a, b) => {
        const ratingA = parseFloat(a.rating) || 0;
        const ratingB = parseFloat(b.rating) || 0;
        const yearA = parseInt(a.year) || 0;
        const yearB = parseInt(b.year) || 0;

        const scoreA = ratingA + (yearA / 400);
        const scoreB = ratingB + (yearB / 400);

        return scoreB - scoreA;
      });

      const result = { 
        movies, 
        sources: [{ title: "CineVault Neural Index v4.2", uri: "http://www.omdbapi.com/" }] 
      };
      
      this.cache.set(cacheKey, result);
      return result;
    } catch (e) {
      console.error("Neural Indexing Exception:", e);
      return { movies: [], sources: [] };
    }
  }

  async getSimilarMovies(movie: Movie): Promise<Movie[]> {
    const cacheKey = `v4.2-similar-${movie.id}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    try {
      const primaryGenre = movie.genre[0] || 'Drama';
      const response = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(primaryGenre)}&y=2024&type=movie`);
      const data = await response.json();

      if (data.Response === "True") {
        const results = data.Search
          .filter((m: any) => m.Poster !== 'N/A' && m.imdbID !== movie.imdbId)
          .slice(0, 10)
          .map((m: any) => ({
            id: m.imdbID,
            imdbId: m.imdbID,
            title: m.Title,
            year: m.Year,
            posterUrl: m.Poster,
            contentType: m.Type === 'series' ? 'tv' : 'movie',
            rating: '7.8',
            genre: [primaryGenre],
            runtime: 'Feature'
          }));
        this.cache.set(cacheKey, results);
        return results;
      }
      return [];
    } catch {
      return [];
    }
  }

  async fetchOmdbData(imdbId: string | null, title: string): Promise<OmdbDetails | null> {
    const cacheKey = `omdb-v4.2-${imdbId || title}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    try {
      const query = imdbId ? `i=${imdbId}` : `t=${encodeURIComponent(title)}`;
      const response = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&${query}&plot=full`);
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
    const cacheKey = 'ent-news-v4.2';
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    try {
      const response = await fetch(`https://gnews.io/api/v4/top-headlines?category=entertainment&lang=en&max=15&apikey=${GNEWS_API_KEY}`);
      const data = await response.json();
      const articles = data.articles || [];
      this.cache.set(cacheKey, articles);
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
      description: d.Plot || "Neural sync complete. Synopsizing sequence initiated.",
      posterUrl: d.Poster,
      backdropUrl: d.Poster,
      genre: d.Genre ? d.Genre.split(', ') : [],
      director: d.Director || 'Director Undefined',
      cast: d.Actors ? d.Actors.split(', ') : [],
      runtime: d.Runtime || 'N/A',
      contentType: d.Type === 'series' ? 'tv' : 'movie'
    };
  }
}

export const gemini = new MovieService();
