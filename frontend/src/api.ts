import axios from "axios";
import { type AllSearchGamesType, type GameInfo } from "./types";

export const API_URL = "/api";

export const fetchGames = async (): Promise<GameInfo[]> => {
  const res = await axios.get<GameInfo[]>(`${API_URL}/library`);
  return res.data;
};

export const searchGames = async (query: string, category: string = "all"): Promise<AllSearchGamesType> => {
  const res = await axios.post(`${API_URL}/search`, { query, category });
  return res.data;
};

export const launchGame = async (gameId: number) => {
  const res = await axios.get(
    `${API_URL}/games/${gameId}/launch`,
  );
  return res.data;
};

export const refreshGames = async () => {
  const res = await axios.post(`${API_URL}/refresh`);
  return res.data;
};

export const getIgdbGameMetadata = async (game_id: string): Promise<GameInfo> => {
  const res = await axios.get(`${API_URL}/game/igdb/${game_id}`)
  return res.data

}
