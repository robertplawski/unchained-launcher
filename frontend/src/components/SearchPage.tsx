import { useNavigate, useSearchParams } from 'react-router-dom';
import GameCard from './GameCard';
import SeeLibraryCard from './SeeLibraryCard';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import type { GameInfo } from '../types';
import { fetchGames, searchGames } from '../api';

const categories = ["all", "installed", "library", "bay", "apps"]

function CategoryButton({
  name,
  count,
  selected,
  onClick
}: {
  name: string,
  count: number,
  selected: boolean,
  onClick: () => void
}) {
  return <button
    onClick={onClick}
    className={`flex flex-row gap-2 p-3 px-6 ${selected ? 'bg-neutral-700' : ''} transition-[background] hover:bg-neutral-700/80 font-bold cursor-pointer uppercase rounded-full`}
  >
    <span>{name}</span>
    <span className='text-neutral-400'>{count}</span>
  </button>
}

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

      const threshold = 100;

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

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('category') || 'all';
  const navigate = useNavigate();

  const handleCategorySelect = useCallback((category: string) => {
    setSearchParams({ q: query, category });
  }, [query, setSearchParams]);

  const [loading, setLoading] = useState<boolean>(false);
  const [games, setGames] = useState<GameInfo[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [_isSearching, setIsSearching] = useState<boolean>(false);

  const loadGames = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Fetching games...'); // Debug log
      const data = await fetchGames();
      console.log('Games fetched:', data.length); // Debug log

      setGames(data);
    } catch (error) {
      console.error('Failed to load games:', error);
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
      console.log('Searching for:', searchQuery); // Debug log
      const results = await searchGames(searchQuery);
      console.log('Search results:', results.length); // Debug log

      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (query) {
      handleSearch(query);
    } else {
      loadGames();
      setSearchResults([]);
    }
  }, [query]);

  // Only show loading when initially loading games (not when searching)
  const showLoading = loading && !query;

  const displayedGames = useMemo(() => query ? searchResults : games, [query, games, searchResults]);

  // Arrow navigation
  const [currentIndex, setCurrentIndex] = useArrowCounter(0, Math.max(0, displayedGames.length), (v: number) => {
    if (v === displayedGames.length) {
      // "View more in your library" card is selected
      handleSeeLibrary();
    } else {
      handleLaunch(v);
    }
  });
  const gameRefs = useRef<Array<HTMLDivElement | null>>([]);

  // Update refs when games change
  useEffect(() => {
    if (!gameRefs.current) {
      return
    }
    gameRefs.current.forEach((ref) => {
      if (ref) {
        ref.addEventListener("click", () => {
          const id = ref.dataset.id;
          if (id) {
            const index = parseInt(id);
            if (index === displayedGames.length) {
              // "View more in your library" card is clicked
              handleSeeLibrary();
            } else {
              setCurrentIndex(index);
            }
          }
        });
      }
    });

    // Reset current index when games change
    setCurrentIndex(0);
  }, [displayedGames, setCurrentIndex]);

  const handleLaunch = async (index: number) => {
    if (index === displayedGames.length) {
      // "View more in your library" card is selected
      navigate("/search");
    } else if (displayedGames[index]) {
      const game = displayedGames[index];
      const gameName = game.name || `game-${game.id}`;
      navigate("/game/" + encodeURIComponent(gameName));
    }
  };

  // Scroll to the currently selected game whenever index changes
  useEffect(() => {
    const currentRef = gameRefs.current[currentIndex];
    if (currentRef) {
      currentRef.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [currentIndex]);

  // Handle the "View more in your library" card
  const handleSeeLibrary = () => {
    navigate("/search");
  };

  return (
    <div>
      <div className='p-4'>
        <div className='flex flex-row flex-wrap justify-center  items-center gap-2'>
          {categories.map((category) => (
            <CategoryButton
              key={category}
              name={category}
              count={displayedGames.length}
              selected={selectedCategory === category}
              onClick={() => handleCategorySelect(category)}
            />
          ))}
        </div>
      </div>

      <div className='p-4'>
        {showLoading ? (
          <div className="text-center py-8">
            <p className="text-neutral-400">Loading games...</p>
          </div>
        ) : (
          <div className="flex flex-row gap-8 px-8 pb-16 flex-wrap justify-center pl-0">
            {displayedGames.map((game: any, index: number) => (
              <div
                key={game.id || index}
                data-id={index}
                ref={(el) => {
                  gameRefs.current[index] = el;
                }}
              >
                <GameCard
                  hideGameArtwork={true}
                  hideGameInfo={true}
                  selected={currentIndex === index}
                  game={{
                    id: game.id || index,
                    name: game.name,
                    appid: game.steam_id,
                    exes: [],
                    metadata: {
                      cover: game.cover ? game.cover.replace('t_thumb', 't_720p') : undefined,
                      big: game.cover ? game.cover.replace('t_thumb', 't_720p') : undefined,
                      screenshots: game.screenshots?.map((s: string) => s?.replace('t_thumb', 't_screenshot_huge')) || [],
                      artworks: game.artworks?.map((a: string) => a?.replace('t_thumb', 't_1080p')) || [],
                      genres: game.genres || [],
                      platforms: game.platforms || [],
                      first_release_date: game.first_release_date,
                      summary: game.summary,
                      steam_id: game.steam_id
                    },
                    installed: false
                  }}
                />
              </div>
            ))}

          </div>
        )}
      </div>
    </div>
  );
}
