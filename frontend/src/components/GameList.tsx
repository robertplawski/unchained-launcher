import React, { useEffect, useRef, useState } from "react";
import { fetchGames } from "../api";
import { type GameInfo } from "../types";
import GameCard from "./GameCard";
import SeeLibraryCard from "./SeeLibraryCard";
import { useNavigate } from "react-router";


export function useArrowCounter(
  min: number = 0,
  max: number = 4,
  execute: (value: number) => void
) {
  const [value, setValue] = useState<number>(min);
  const valueRef = useRef(value);

  // Keep ref updated
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    const isEditable = (element: Element | null) => {
      console.log(element)
      if (!element) return false;

      // Check if it's a form element that can receive input
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
        return (element as HTMLInputElement).type !== 'checkbox' &&
          (element as HTMLInputElement).type !== 'radio';
      }

      // Check for contenteditable
      if ((element as HTMLElement).isContentEditable) return true;

      // Check for contenteditable attribute
      const contentEditable = element.getAttribute('contenteditable');
      if (contentEditable === 'true' || contentEditable === '') return true;

      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const targetElement = e.target as Element;

      if (isEditable(targetElement)) {
        return; // ignore if typing
      }

      if (e.key === "Enter") {
        execute(valueRef.current);
      }

      setValue((prev) => {
        if (e.key === "ArrowLeft") return Math.max(min, prev - 1);
        if (e.key === "ArrowRight") return Math.min(max, prev + 1);
        return prev;
      });
    };

    const handleWheel = (e: WheelEvent) => {
      if (isEditable(document.activeElement)) return;

      const threshold = 10;

      setValue((prev) => {
        if (e.deltaY < -threshold) return Math.min(max, prev + 1);
        if (e.deltaY > threshold) return Math.max(min, prev - 1);
        return prev;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleWheel);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
    };
  }, [min, max, execute]);

  return [value, setValue] as const;
}


const GameList: React.FC = () => {
  const [games, setGames] = useState<GameInfo[]>([]);
  const [_loading, setLoading] = useState(true);




  const [currentIndex, setCurrentIndex] = useArrowCounter(0, games.length, (v: number) => handleLaunch(v));



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

  useEffect(() => {
    if (!gameRefs.current) {
      return
    }
    gameRefs.current.forEach((ref) => {
      ref?.addEventListener("click", () => setCurrentIndex(parseInt(ref.dataset.id!)))

    })
  }, [games, setCurrentIndex])

  const navigate = useNavigate();
  const handleLaunch = async (index: number) => {

    if (index === games.length) {
      // "View more in your library" card is selected
      navigate("/search");
    } else {
      const game = games[index]
      const goodid = game.category == "library" ? (game.metadata?.id || 4) : game.id
      navigate("/game/" + goodid)
    }
  };
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
    <div className="flex flex-col gap-5 min-w-[100vw] overflow-hidden p-6 px-13  pt-22">
      <h2
        className={`text-3xl font-bold transition-opacity ${currentIndex !== 0 ? "opacity-0" : "opacity-100"
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
              big={index === 0}
              selected={currentIndex === index}
              game={game}
              last={currentIndex === index + 1 && index === games.length - 1}
            />
          </div>
        ))}
        <SeeLibraryCard
          selected={currentIndex == games.length}
          onClick={() => navigate("/search")}
        />
      </div>
    </div >
  );
};

export default GameList;

