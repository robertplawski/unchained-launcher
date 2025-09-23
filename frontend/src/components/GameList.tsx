import React, { useEffect, useRef, useState } from "react";
import { fetchGames, launchGame } from "../api";
import { type GameInfo } from "../types";
import GameCard from "./GameCard";

export function useArrowCounter(min: number = 0, max: number = 4, execute: Function) {
  const [value, setValue] = useState<number>(min);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        execute(value)
      }
      setValue((prev) => {
        if (e.key === "ArrowLeft") {
          return Math.max(min, prev - 1);
        } else if (e.key === "ArrowRight") {
          return Math.min(max, prev + 1);
        }
        return prev;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [min, max, value]);

  return value;
}

const GameList: React.FC = () => {
  const [games, setGames] = useState<GameInfo[]>([]);
  const [_loading, setLoading] = useState(true);




  const handleLaunch = async (index: number) => {
    const game = games[index]
    try {
      await launchGame(index);
      alert(`Launched game ${game.name}`)
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to launch");
    } finally {
    }
  }

  const currentIndex = useArrowCounter(0, games.length - 1, (v: number) => handleLaunch(v));

  const loadGames = async () => {
    setLoading(true);
    const data = await fetchGames();
    setGames(data);
    setLoading(false);
  };

  /*const handleRefresh = async () => {
    setLoading(true);
    await refreshGames();
    await loadGames();
  };*/

  useEffect(() => {
    loadGames();
  }, []);

  // Use null instead of undefined
  const gameRefs = useRef<Array<HTMLDivElement | null>>([]);

  // scroll to the currently selected game whenever index changes
  useEffect(() => {
    const currentRef = gameRefs.current[currentIndex];
    if (currentRef) {
      currentRef.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [currentIndex, games]);

  return (
    <div className="flex flex-col gap-5 w-[100vw] overflow-hidden p-6 px-13">
      <h2
        className={`text-3xl font-bold transition-opacity ${currentIndex !== 0 ? "opacity-0" : "opacity-100"
          }`}
      >
        Recent Games
      </h2>

      <div className="flex flex-row gap-5 pb-16 w-full">
        {games.map((game, index) => (
          <div
            key={game.id}
            // callback ref type: HTMLDivElement | null
            ref={(el) => {
              gameRefs.current[index] = el;
            }}
          >
            <GameCard
              big={index === 0}
              selected={currentIndex === index}
              game={game}
              onLaunched={(msg) => alert(msg)}
            />
          </div>
        ))}
      </div>
    </div >
  );
};

export default GameList;

