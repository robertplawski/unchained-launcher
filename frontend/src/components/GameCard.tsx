import React, { useMemo, useState } from "react";
import { type GameInfo } from "../types";
import { API_URL, launchGame } from "../api";
import { LucideDownload, LucidePlay } from "lucide-react";

interface Props {
  selected?: boolean;
  big?: boolean;
  game: GameInfo;
  last?: boolean;
  onLaunched?: (msg: string) => void;
}


const GameStatusInfo = ({ game }: { game: GameInfo }) => {
  return <p className="text-lg text-neutral-400 font-bold flex flex-row gap-4 items-center">

    {!game.installed ? <LucidePlay fontSize={"0.5rem"} fill="#00FF00" color="#00FF00" /> : <LucideDownload />}

    LAST TWO WEEKS: 12H

  </p>
}
const GameBackgroundArtwork = ({ selected, last, artworkUrl }: { selected?: boolean, last?: boolean, artworkUrl?: string }) => {
  return <img className={`-z-1 blur-sm h-full object-cover w-full absolute top-0 left-0 ${selected || last ? 'opacity-20' : 'opacity-0'}  transition-opacity`} src={artworkUrl} />
}

const GameInfo = ({ game, selected }: { game: GameInfo, selected?: boolean }) => {
  return <div className={`transition-[opacity,translate] duration-300 text-nowrap ${selected ? 'translate-y-0  transition-[translate,opacity] duration-300' : 'translate-y-6'}  absolute bottom-0 flex flex-col p-2 gap-2 ${selected ? 'opacity-100' : 'opacity-0'} `}>

    <p className=" text-2xl font-bold">{game.name}</p>

    <GameStatusInfo game={game} />
  </div>
}

const GameCard: React.FC<Props> = ({ game, onLaunched, big, selected, last }) => {
  const [_launching, setLaunching] = useState(false);


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

  const artworks = game.metadata?.artworks;
  const artworkUrl = useMemo(() => artworks?.length
    ? `${API_URL}${artworks[artworks.length - 1]}`
    : "", []);

  if (big) {
    return <>
      <GameBackgroundArtwork {...{ selected, last, artworkUrl }} />
      <div className="cursor-pointer relative flex flex-col pb-24 justify-between gap-0 min-h-90 min-w-194 w-194">
        < img className={`min-h-90 w-194 object-contain transition-[scale,border]  z-10 ${selected ? 'shadow-md scale-[1.045] border-1 border-neutral-500' : ''}`} src={API_URL + "/metadata/Dying Light The Beast/artworks/4.jpg"} />
        <GameInfo {...{ game, selected }} />
      </div >
    </>
  }


  return <>
    <GameBackgroundArtwork {...{ selected, last, artworkUrl }} />

    <div className="cursor-pointer relative flex flex-col pb-24 justify-between gap-0 min-h-90 min-w-60 w-60">
      <img className={`min-h-90 h-90 flex-1 transition-[scale,border] z-10 ${selected ? 'scale-[1.045] border-1 shadow-md border-neutral-500' : ''}`} src={API_URL + game.metadata?.big} />
      <GameInfo {...{ game, selected }} />
    </div >
  </>


};

export default GameCard;
{/*"/metadata/Teardown/big.jpg"*/ }
{/*<div className="border-1 border-neutral-200 rounded shadow-md p-4 flex flex-col items-center gap-2">
      {game.metadata && game.metadata.cover && <img src={API_URL + game.metadata.big} alt={game.name} className="object-cover rounded" />}
      <h2 className="text-xl font-bold">{game.name}</h2>
      <button
        onClick={handleLaunch}
        disabled={launching}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {launching ? "Launching..." : "Launch"}
      </button>
    </div>*/}

