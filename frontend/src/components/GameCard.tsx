import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type GameInfo } from "../types";
import { API_URL } from "../api";
import { LucideDownload, LucidePlay } from "lucide-react";
import { useImageCache } from "../hooks/useImageCache";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { useNavigate } from "react-router";
import FocusableItem, { type FocusableItemHandle } from "./FocusableItem";

interface Props {
  index?: number;
  big?: boolean;
  game: GameInfo;
  last?: boolean;
  hideGameInfo?: boolean;
  hideGameArtwork?: boolean;
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
  const { cachedImageUrl } = useImageCache(artworkUrl);
  return <img
    className={`max-h-[40rem] -z-100 blur-sm h-full object-cover w-full fixed top-0 left-0 ${selected || last ? 'opacity-20' : 'opacity-0'} transition-opacity`}
    src={cachedImageUrl}
  />
}

const GameInfo = ({ game, selected }: { game: GameInfo, selected?: boolean }) => {
  return <div className={` absolute  -bottom-24 transition-[opacity,translate] duration-300 text-nowrap ${selected ? 'translate-y-0 transition-[translate,opacity] duration-300' : 'translate-y-6'} flex flex-col p-2 gap-2 ${selected ? 'opacity-100' : 'opacity-0'}`}>
    <p className="text-2xl font-bold text-left">{game.name}</p>
    <GameStatusInfo game={game} />
  </div>
}

const GameCard: React.FC<Props> = ({ index, game, big, last, hideGameInfo, hideGameArtwork }) => {
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
  }, [artworks?.length, game.metadata?.big]);

  // Determine the main image URL
  const mainImageUrl = useMemo(() => {
    const bigImage = game.metadata?.big;
    if (bigImage) {
      return bigImage.startsWith('http') ? bigImage : `${API_URL}${bigImage}`;
    }
    return artworkUrl;
  }, [game.metadata?.big, artworkUrl]);

  // Generate low-res version for placeholder
  const lowResImageUrl = useMemo(() => {
    if (mainImageUrl) {
      // Replace high-res size identifier with low-res one
      return mainImageUrl
        .replace('t_cover_big', 't_thumb')
        .replace('t_720p', 't_thumb')
        .replace('t_1080p', 't_thumb')
        .replace(/t_\w+/, 't_thumb');
    }
    return mainImageUrl;
  }, [mainImageUrl]);

  const lowResArtworkImageUrl = useMemo(() => {
    if (artworkUrl) {
      // Replace high-res size identifier with low-res one
      return artworkUrl.replace('t_cover_big', 't_thumb')
        .replace('t_720p', 't_thumb')
        .replace('t_1080p', 't_thumb')
        .replace(/t_\w+/, 't_thumb');
    }
    return artworkUrl;
  }, [artworkUrl]);

  // Use cached images
  const { cachedImageUrl: cachedMainImageUrl } = useImageCache(mainImageUrl);
  const { cachedImageUrl: cachedLowResImageUrl } = useImageCache(lowResImageUrl);

  const { cachedImageUrl: cachedArtworkImageUrl } = useImageCache(artworkUrl);
  const { cachedImageUrl: cachedLowResArtworkImageUrl } = useImageCache(lowResArtworkImageUrl);


  const navigate = useNavigate();

  const focusableItemRef = useRef<FocusableItemHandle>(null);



  // Add state to track the focused state
  const [selected, setIsSelected] = useState(false);

  // Use useEffect to sync the ref's focus state
  useEffect(() => {
    const interval = setInterval(() => {
      if (focusableItemRef.current) {
        const isCurrentlyFocused = focusableItemRef.current.isFocused;
        if (isCurrentlyFocused !== selected) {
          setIsSelected(isCurrentlyFocused);
        }
      }
    }, 100); // Check every 100ms

    return () => clearInterval(interval);
  }, [selected]);
  const openGamePage = useCallback(() => {
    navigate(`/game/` + (game.category == "library" ? (game?.metadata?.id || game.id) : game.id))
  }, [game])


  if (big) {
    return <>
      {!hideGameArtwork && <GameBackgroundArtwork {...{ selected, last, artworkUrl }} />}
      <FocusableItem ref={focusableItemRef} focus={index == 0} onClick={openGamePage} className={`cursor-pointer relative flex flex-col justify-between gap-0 h-80 aspect-[1920/976]`}>
        <LazyLoadImage

          loading="lazy"
          effect="blur"
          src={cachedArtworkImageUrl}
          placeholderSrc={cachedLowResArtworkImageUrl}
          className={`h-80 aspect-auto object-cover flex-1 transition-[scale,border] z-10 ${selected ? 'shadow-md  border-1 border-neutral-500' : ''}`}
        />
        <img
          src={cachedLowResImageUrl}
          className={`absolute object-contain min-h-80 scale-[1.05] h-90 flex-1 transition-[scale,border,opacity] blur-lg ${selected ? 'opacity-80' : 'opacity-0'}  -z-10 `}
          width="100%"
          height="auto"
        />
        {!hideGameInfo && <GameInfo {...{ game, selected }} />}
      </FocusableItem>
    </>
  }

  return <>
    {!hideGameArtwork && <GameBackgroundArtwork {...{ selected, last, artworkUrl }} />}
    <FocusableItem ref={focusableItemRef} onClick={openGamePage} className={`cursor-pointer relative flex flex-col justify-between gap-0 min-h-80 min-w-60 w-60 `}>
      <img
        src={cachedLowResImageUrl}
        className={`hidden absolute object-contain min-h-80 h-90 flex-1 transition-[scale,border,opacity] blur-lg ${selected ? 'opacity-80' : 'opacity-0'}  `}
        width="100%"
        height="auto"
      />
      <LazyLoadImage
        loading="lazy"
        effect="blur"
        src={cachedMainImageUrl}
        placeholderSrc={cachedLowResImageUrl}
        className={`min-h-80 object-contain flex-1 transition-[scale,border] z-10 ${selected ? ' border-1 shadow-md border-neutral-500' : ''}`}


      />

      {!hideGameInfo && <GameInfo {...{ game, selected }} />}
    </FocusableItem >
  </>
}

export default GameCard;
