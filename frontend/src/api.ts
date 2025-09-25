import axios from "axios";
import { type AllSearchGamesType, type GameInfo, type LaunchRequest } from "./types";

export const API_URL = "/api";

export const fetchGames = async (): Promise<GameInfo[]> => {
  const res = await axios.get<GameInfo[]>(`${API_URL}/library`);
  return res.data;
};

export const searchGames = async (query: string, category: string = "all"): Promise<AllSearchGamesType> => {
  const res = await axios.post(`${API_URL}/search`, { query, category });
  // Return the entire response data so we can check for messages
  return res.data;
};

export const launchGame = async (gameId: number, exe?: string) => {
  const data: LaunchRequest = exe ? { exe } : {};
  const res = await axios.post(`${API_URL}/games/${gameId}/launch`, data);
  return res.data;
};

export const refreshGames = async () => {
  const res = await axios.post(`${API_URL}/refresh`);
  return res.data;
};

