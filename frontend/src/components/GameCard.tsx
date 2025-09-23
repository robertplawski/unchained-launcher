import React, { useState } from "react";
import { type GameInfo } from "../types";
import { launchGame } from "../api";

interface Props {
  game: GameInfo;
  onLaunched?: (msg: string) => void;
}

const GameCard: React.FC<Props> = ({ game, onLaunched }) => {
  const [launching, setLaunching] = useState(false);

  const handleLaunch = async () => {
    setLaunching(true);
    try {
      const res = await launchGame(game.id);
      onLaunched?.(res.message);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to launch");
    } finally {
      setLaunching(false);
    }
  };


  return (
    <div className="border rounded shadow p-4 flex flex-col items-center gap-2">
      {game.metadata && game.metadata.cover && <img src={game.metadata.cover} alt={game.name} className="w-32 h-40 object-cover rounded" />}
      <h2 className="text-xl font-bold">{game.name}</h2>
      <p>{game.exes.length} executable(s)</p>
      <button
        onClick={handleLaunch}
        disabled={launching}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {launching ? "Launching..." : "Launch"}
      </button>
    </div>
  );
};

export default GameCard;

