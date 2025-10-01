import React from "react";
import { type GameInfo } from "../types";
import GameCard from "./GameCard";
import SeeLibraryCard from "./SeeLibraryCard";
import { useLoaderData, useNavigate } from "react-router";



const GameList: React.FC = () => {
  const games = useLoaderData<GameInfo[]>();
  if (!games) {
    return;
  }

  const navigate = useNavigate();


  return (

    <div className="flex flex-col gap-5 min-w-[100vw] overflow-hidden p-6 px-13  pt-22">
      <h2
        className={`text-3xl font-bold transition-opacity opacity-100`}
      >
        Recent Games
      </h2>

      <div className="flex flex-row gap-5 pb-16 w-[100vw] mr-[50vw]">
        {games.map((game, index) => (
          <div
            key={game.id}
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

