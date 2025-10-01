import GameCard from './GameCard';
import { useEffect, useState, useCallback, useMemo, useRef, type Ref } from 'react';
import type { AllSearchGamesType, GameInfo, SearchResultCategory } from '../types';
import { fetchGames, searchGames } from '../api';
import { Loader2 } from 'lucide-react';
import FocusableItem, { type FocusableItemHandle } from './FocusableItem';
import { useSearchParams } from 'react-router';

const categories: SearchResultCategory[] = ["all", "library", "bay", "peers", "apps"];

function CategoryButton({
  name,
  count,
  selected,
  onClick,
  query,
  ref
}: {
  query: string,
  ref?: Ref<FocusableItemHandle>,
  name: string,
  count: number,
  selected: boolean,
  onClick: () => void
}) {



  /*useEffect(() => {
    if (!focusableItemRef.current) {
      return;
    }
    focusableItemRef.current.focus();
  }, [
    focusableItemRef
  ])*/

  return <FocusableItem focus={name == "all" + (query ? "" : "")} ref={ref} onClick={onClick} onSelect={onClick}
    className={`flex flex-row gap-2 p-3 px-6 ${selected ? 'bg-neutral-700' : ''} transition-[background] hover:bg-neutral-700/80 font-bold cursor-pointer uppercase rounded-full`}
  >
    <span>{name}</span>
    <span className='text-neutral-400'>{count}</span>
  </FocusableItem>
}


export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [selectedCategory, setSelectedCategory] = useState<SearchResultCategory>('all'); //(searchParams.get('category') || 'all') as SearchResultCategory;


  const categoryFocusableItemRef = useRef<FocusableItemHandle>(null);
  console.log(categoryFocusableItemRef)

  const handleCategorySelect = useCallback((category: SearchResultCategory) => {
    setSelectedCategory(category)
  }, [query, setSearchParams, categoryFocusableItemRef.current]);

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
    /*if (!searchQuery.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }*/

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
    handleSearch(query);
  }, [query, loadGames, handleSearch]);


  // Only show loading when initially loading games (not when searching)
  const showLoading = loading && !query;

  const displayedGamesData = useMemo(() => {
    if (!searchResults) return null;
    return searchResults[selectedCategory];
  }, [searchResults, selectedCategory]);

  const displayedGames = displayedGamesData?.games || [];

  /*const handleLaunch = async (index: number) => {
    if (index === displayedGames.length) {
      // "View more in your library" card is selected
      navigate("/search");
    } else {
      const game = displayedGames[index]
      const goodid = game.category == "library" ? (game.metadata?.id || 4) : game.id
      navigate("/game/" + goodid)
    }
  };

  // Handle the "View more in your library" card
  const handleSeeLibrary = () => {
    navigate("/search");
  };*/

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
    < >

      <div className="max-h-screen overflow-y-auto pt-16">
        <div className='sticky -translate-y-2 top-0 z-10 py-4 flex flex-row flex-wrap justify-center items-center gap-2 bg-black/80 shadow-lg backdrop-blur-lg'>

          {categories.map((category) => (
            <CategoryButton
              query={query}
              key={category}
              name={category}
              count={searchResults?.[category]?.count || 0}
              selected={selectedCategory === category}
              onClick={() => handleCategorySelect(category)}
            />
          ))}
        </div>

        <div className='p-4 pb-24 '>
          {showLoading || _isSearching ? (
            <div className="text-center py-8 w-full justify-center flex">
              <Loader2 className='animate-spin ' />
            </div>
          ) : displayedGames.length === 0 ? (
            <p>No games/apps found...</p>
          ) : (
            <div className=' flex items-center justify-center w-full'>
              <div className="grid grid-cols-[repeat(2,1fr)] sm:grid-cols-[repeat(3,1fr)] md:grid-cols-[repeat(5,1fr)] lg:grid-cols-[repeat(6,1fr)] gap-8 pb-16">
                {displayedGames.map((game, index) => (
                  <div
                    className='col-span-1'
                    key={`${game.id}-${game.name}-${index}`}

                  >
                    <GameCard
                      index={index}
                      hideGameArtwork={true}
                      hideGameInfo={true}
                      game={game.category == "library" ? game : {
                        category: game.category,
                        id: game.id,
                        name: game.name,
                        exes: [],
                        metadata: {
                          id: game.id,
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
    </>
  );
}
