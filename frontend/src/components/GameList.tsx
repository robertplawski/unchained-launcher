import React, { useEffect, useRef, useState } from "react";
import { fetchGames } from "../api";
import { type GameInfo } from "../types";
import GameCard from "./GameCard";
import SeeLibraryCard from "./SeeLibraryCard";
import { useNavigate } from "react-router";



const GameList: React.FC = () => {
  const [games, setGames] = useState<GameInfo[]>([]);
  const [_loading, setLoading] = useState(true);



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


  const navigate = useNavigate();
  /*const handleLaunch = async (index: number) => {

    if (index === games.length) {
      // "View more in your library" card is selected
      navigate("/search");
    } else {
      const game = games[index]
      const goodid = game.category == "library" ? (game.metadata?.id || 4) : game.id
      navigate("/game/" + goodid)
    }
  };*/

  return (

    <div className="flex flex-col gap-5 min-w-[100vw] overflow-hidden p-6 px-13  pt-22">
      <h2
        className={`text-3xl font-bold transition-opacity ${0 !== 0 ? "opacity-0" : "opacity-100"
          }`}
      >
        Recent Games
      </h2>

      <div className="flex flex-row gap-5 pb-16 w-[100vw] mr-[50vw]">
        {games.map((game, index) => (
          <div
            key={game.id}
            data-id={game.id}
            // callback ref type: HTMLDivElement | null
            ref={(el) => {
              gameRefs.current[index] = el;
            }}
          >
            <GameCard
              index={index}
              big={index == 0}
              game={game}
            />
          </div>
        ))}
        <SeeLibraryCard
          onClick={() => navigate("/search")}
        />

      </div>

    </div >

  );
};

export default GameList;

