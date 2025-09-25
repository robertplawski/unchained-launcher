import React, { useMemo } from "react";
import { type GameInfo } from "../types";
import { API_URL } from "../api";
import { LucideDownload, LucidePlay } from "lucide-react";

interface Props {
  selected?: boolean;
  big?: boolean;
  game: GameInfo;
  last?: boolean;
  hideGameInfo?: boolean;
}
export function formatFileSize(mb: number): string {
  if (mb < 1) {
    // Convert to KB if less than 1 MB
    const kb = mb * 1024;
    if (kb < 1) {
      // Convert to bytes if less than 1 KB
      const bytes = kb * 1024;
      return `${Math.round(bytes)} B`;
    }
    return `${Math.round(kb)} KB`;
  }

  if (mb < 1024) {
    return `${mb.toFixed(1)} MB`;
  }

  // Convert to GB if 1024+ MB
  const gb = mb / 1024;
  if (gb < 1024) {
    return `${gb.toFixed(1)} GB`;
  }

  // Convert to TB if 1024+ GB
  const tb = gb / 1024;
  return `${tb.toFixed(1)} TB`;
}

const GameStatusInfo = ({ game }: { game: GameInfo }) => {
  return <p className="text-lg text-neutral-400 flex flex-row gap-4 items-center">

    {!game.installed ? <LucidePlay fontSize={"0.5rem"} fill="#00FF00" color="#00FF00" /> : <LucideDownload />}

    Size on disk {formatFileSize(game.size || 0)}

  </p>
}
const GameBackgroundArtwork = ({ selected, last, artworkUrl }: { selected?: boolean, last?: boolean, artworkUrl?: string }) => {
  return <img className={`max-h-[40rem] -z-100 blur-sm h-full object-cover w-full fixed top-0 left-0 ${selected || last ? 'opacity-20' : 'opacity-0'}  transition-opacity`} src={artworkUrl} />
}

const GameInfo = ({ game, selected }: { game: GameInfo, selected?: boolean }) => {

  return <div className={`transition-[opacity,translate] duration-300 text-nowrap ${selected ? 'translate-y-0  transition-[translate,opacity] duration-300' : 'translate-y-6'}  absolute bottom-0 flex flex-col p-2 gap-2 ${selected ? 'opacity-100' : 'opacity-0'} `}>

    <p className=" text-2xl font-bold">{game.name}</p>

    <GameStatusInfo game={game} />
  </div>
}

const GameCard: React.FC<Props> = ({ game, big, selected, last, hideGameInfo }) => {




  const artworks = game.metadata?.artworks;
  const artworkUrl = useMemo(() => {
    if (artworks?.length) {
      // If it's a search result, the URL might already be complete
      const url = artworks[artworks.length - 1];
      return url.startsWith('http') ? url : `${API_URL}${url}`;
    }
    // Fallback to big image if no artworks
    const bigImage = game.metadata?.big;
    if (bigImage) {
      return bigImage.startsWith('http') ? bigImage : `${API_URL}${bigImage}`;
    }
    return "";
  }, [artworks, game.metadata?.big]);

  // Determine the main image URL
  const mainImageUrl = useMemo(() => {
    const bigImage = game.metadata?.big;
    if (bigImage) {
      return bigImage.startsWith('http') ? bigImage : `${API_URL}${bigImage}`;
    }
    return artworkUrl;
  }, [game.metadata?.big, artworkUrl]);

  if (big) {
    return <>
      <GameBackgroundArtwork {...{ selected, last, artworkUrl }} />
      <div className={`cursor-pointer relative flex flex-col justify-between gap-0 min-h-90 min-w-194 w-194 ${!hideGameInfo ? 'pb-24' : ''}`}>
        < img className={`min-h-90 w-194 object-contain transition-[scale,border]  z-10 ${selected ? 'shadow-md scale-[1.045] border-1 border-neutral-500' : ''}`} src={artworkUrl} />
        {!hideGameInfo && <GameInfo {...{ game, selected }} />}
      </div >
    </>
  }


  return <>
    <GameBackgroundArtwork {...{ selected, last, artworkUrl }} />

    <div className={`cursor-pointer relative flex flex-col justify-between gap-0 min-h-90 min-w-60 w-60 ${!hideGameInfo ? 'pb-24' : ''}`} >
      < img className={`min-h-90 h-90 flex-1 transition-[scale,border] z-10 ${selected ? 'scale-[1.045] border-1 shadow-md border-neutral-500' : ''}`} src={mainImageUrl} />
      {!hideGameInfo && <GameInfo {...{ game, selected }} />}
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

