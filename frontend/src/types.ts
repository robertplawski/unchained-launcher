export interface GameInfo {
  id: number;
  name: string;
  appid?: string;
  exes: string[];
  metadata?: GameMetadata;
}
export type GameMetadata = {
  name?: string;
  genres: string[];
  platforms: string[];
  first_release_date?: string;
  summary?: string;
  cover?: string | null;
  big?: string | null;
  screenshots: string[];
  steam_id?: number | null;
};

export interface LaunchRequest {
  exe?: string;
}

