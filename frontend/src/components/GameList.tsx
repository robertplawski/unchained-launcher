import React, { useEffect, useState } from "react";
import { fetchGames, refreshGames } from "../api";
import { type GameInfo } from "../types";
import GameCard from "./GameCard";

const GameList: React.FC = () => {
  const [games, setGames] = useState<GameInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGames = async () => {
    setLoading(true);
    const data = await fetchGames();
    setGames(data);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setLoading(true);
    await refreshGames();
    await loadGames();
  };

  useEffect(() => {
    loadGames();
  }, []);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">My Games</h1>
        <button onClick={handleRefresh} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
          Refresh
        </button>
      </div>
      {loading ? (
        <p>Loading games...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {games.map(game => (
            <GameCard key={game.id} game={game} onLaunched={msg => alert(msg)} />
          ))}
        </div>
      )}
    </div>
  );
};

export default GameList;

