export interface GameMetadata {
  cover?: string;
  big?: string;
  screenshots?: string[];
  artworks?: string[];
  genres?: string[];
  platforms?: string[];
  first_release_date?: number;
  summary?: string;
  steam_id?: string;
}
export interface LaunchRequest {
  exe?: string;
}
// src/types.ts
export interface GameInfo {
  id: number;
  name: string;
  category?: string;
  exes: string[];
  installed?: boolean;
  size?: number;
  // Properties that were missing but are accessed in SearchPage.tsx
  cover?: string;
  screenshots?: string[];  // Make optional
  artworks?: string[];     // Make optional
  genres?: string[];
  platforms?: string[];
  first_release_date?: number;
  summary?: string;
  steam_id?: number;
  metadata?: {  // Make optional
    id: number;
    cover?: string;
    big?: string;
    screenshots?: string[];  // Make optional
    artworks: string[];     // Make optional
    genres?: string[];
    platforms?: string[];
    first_release_date?: number;
    summary?: string;
    steam_id?: number;
  };
}

export interface AllSearchGamesType {
  all: SearchGamesType,
  library: SearchGamesType,
  bay: SearchGamesType,
  peers: SearchGamesType,
  apps: SearchGamesType
}

export interface SearchGamesType {
  games: GameInfo[];
  count: number;
  message?: string;
}

export type SearchResultCategory = keyof AllSearchGamesType;
