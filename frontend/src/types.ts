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

export interface GameInfo {
  id: number;
  name: string;
  appid?: string;
  exes: string[];
  metadata?: GameMetadata;
  installed?: boolean;
}

export interface LaunchRequest {
  exe?: string;
}

