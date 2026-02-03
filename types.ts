
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

export interface WatchHistory extends Movie {
  watchedAt: number;
  lastSeason?: number;
  lastEpisode?: number;
  lastServerId?: string;
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
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings?: Array<{ Source: string; Value: string }>;
  Metascore?: string;
  imdbRating?: string;
  imdbVotes?: string;
  imdbID: string;
  Type: string;
  totalSeasons?: string;
  Response: string;
}

export interface SearchResult {
  movies: Movie[];
  sources: Array<{ title: string; uri: string }>;
}

export interface WatchlistItem extends Movie {
  addedAt: number;
}
