import { useNavigate, useSearchParams } from 'react-router-dom';
import GameCard from './GameCard';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import type { AllSearchGamesType, GameInfo, SearchResultCategory } from '../types';
import { fetchGames, searchGames } from '../api';

const categories: SearchResultCategory[] = ["all", "library", "bay", "peers", "apps"];

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

    /*const _handleWheel = (e: WheelEvent) => {
      if (isEditable(document.activeElement)) return;

      const threshold = 100;

      setValue((prev) => {
        if (e.deltaY < -threshold) return Math.min(max, prev + 1);
        if (e.deltaY > threshold) return Math.max(min, prev - 1);
        return prev;
      });
    };*/

    window.addEventListener("keydown", handleKeyDown);
    //window.addEventListener("wheel", handleWheel);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      //window.removeEventListener("wheel", handleWheel);
    };
  }, [min, max, execute]);

  return [value, setValue] as const;
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const selectedCategory = (searchParams.get('category') || 'all') as SearchResultCategory;

  const navigate = useNavigate();

  const handleCategorySelect = useCallback((category: string) => {
    setSearchParams({ q: query, category });
  }, [query, setSearchParams]);

  const [loading, setLoading] = useState<boolean>(false);
  const [_games, setGames] = useState<GameInfo[]>([]);
  const [searchResults, setSearchResults] = useState<AllSearchGamesType | null>(null);
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
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
      console.log('Searching for:', searchQuery, 'in category:', selectedCategory); // Debug log
      const results = await searchGames(searchQuery);
      console.log('Search results:', results); // Debug log

      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults(null);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (query) {
      handleSearch(query);
    } else {
      if (selectedCategory === 'library') {
        loadGames();
      } else if (selectedCategory === 'all' || selectedCategory === 'bay') {
        // Load default search results for 'all' and 'bay' categories
        handleSearch('popular');
      } else {
        // Clear results for other categories
        setGames([]);
        setSearchResults(null);
      }
    }
  }, [query, selectedCategory, loadGames, handleSearch]);

  // Only show loading when initially loading games (not when searching)
  const showLoading = loading && !query;

  const displayedGamesData = useMemo(() => {
    if (!searchResults) return null;
    return searchResults[selectedCategory];
  }, [searchResults, selectedCategory]);

  const displayedGames = displayedGamesData?.games || [];

  // Arrow navigation
  const [currentIndex, setCurrentIndex] = useArrowCounter(
    0,
    Math.max(0, displayedGames.length - 1),
    (v: number) => {
      if (v === displayedGames.length) {
        // "View more in your library" card is selected
        handleSeeLibrary();
      } else {
        handleLaunch(v);
      }
    }
  );

  const gameRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Update refs when games change
  useEffect(() => {
    gameRefs.current = gameRefs.current.slice(0, displayedGames.length);

    gameRefs.current.forEach((ref, index) => {
      if (ref) {
        const handleClick = () => {
          setCurrentIndex(index);
        };
        ref.removeEventListener('click', handleClick);
        ref.addEventListener('click', handleClick);
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

  // Helper function to safely get a property value
  const getPropertyValue = (primary?: string, secondary?: string) => {
    return primary || secondary;
  };

  // Helper function to safely map arrays
  const mapArray = <T, U>(primary: T[] | undefined, secondary: T[] | undefined, mapper: (item: T) => U): U[] => {
    const arr = primary || secondary;
    if (!arr) return [];
    return arr.map(mapper);
  };

  return (
    <div>
      <div className='p-4'>
        <div className='flex flex-row flex-wrap justify-center items-center gap-2'>
          {categories.map((category) => (
            <CategoryButton
              key={category}
              name={category}
              count={searchResults?.[category]?.count || 0}
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
        ) : displayedGames.length === 0 ? (
          <p>No games/apps found...</p>
        ) : (
          <div className='flex items-center justify-center w-full'>
            <div className="grid grid-cols-[repeat(2,1fr)] sm:grid-cols-[repeat(3,1fr)] md:grid-cols-[repeat(5,1fr)] lg:grid-cols-[repeat(6,1fr)] gap-8 pb-16">
              {displayedGames.map((game, index) => (
                <div
                  className='col-span-1'
                  key={`${game.id}-${game.name}-${index}`}
                  ref={(el) => {
                    gameRefs.current[index] = el;
                  }}
                >
                  <GameCard
                    hideGameArtwork={true}
                    hideGameInfo={true}
                    selected={currentIndex === index}
                    game={{
                      category: game.category,
                      id: game.id || index,
                      name: game.name,
                      exes: [],
                      metadata: {
                        cover: getPropertyValue(game.cover, game.metadata?.cover)?.replace('t_thumb', 't_720p'),
                        big: getPropertyValue(game.cover, game.metadata?.big)?.replace('t_thumb', 't_720p'),
                        screenshots: mapArray(
                          game.screenshots,
                          game.metadata?.screenshots,
                          (s: string) => s?.replace('t_thumb', 't_screenshot_huge')
                        ),
                        artworks: mapArray(
                          game.artworks,
                          game.metadata?.artworks,
                          (a: string) => a?.replace('t_thumb', 't_1080p')
                        ),
                        genres: game.genres || game.metadata?.genres || [],
                        platforms: game.platforms || game.metadata?.platforms || [],
                        first_release_date: game.first_release_date || game.metadata?.first_release_date,
                        summary: game.summary || game.metadata?.summary,
                        steam_id: game.steam_id || game.metadata?.steam_id
                      },
                      installed: selectedCategory === 'library',
                      size: game.size || 0
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
