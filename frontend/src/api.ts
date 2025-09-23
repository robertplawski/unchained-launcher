import axios from "axios";
import { type GameInfo, type LaunchRequest } from "./types";

const API_URL = "http://localhost:8000"; // change if needed

export const fetchGames = async (): Promise<GameInfo[]> => {
  const res = await axios.get<GameInfo[]>(`${API_URL}/games`);
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

