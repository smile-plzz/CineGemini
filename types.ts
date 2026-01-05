
export interface Movie {
  id: string;
  title: string;
  year: string;
  rating: string;
  description: string;
  posterUrl: string;
  backdropUrl: string;
  genre: string[];
  director: string;
  cast: string[];
  runtime: string;
  trailerUrl?: string;
  contentType: 'movie' | 'tv';
  tmdbId?: string;
  imdbId?: string;
}

export interface NewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
}

export interface OmdbDetails {
  Ratings?: Array<{ Source: string; Value: string }>;
  Metascore?: string;
  imdbRating?: string;
  imdbVotes?: string;
  Awards?: string;
  BoxOffice?: string;
  Production?: string;
  Website?: string;
  Director?: string;
  Actors?: string;
  Response: string;
}

export interface SearchResult {
  movies: Movie[];
  aiInsight: string;
  sources: Array<{ title: string; uri: string }>;
}

export interface WatchlistItem extends Movie {
  addedAt: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
