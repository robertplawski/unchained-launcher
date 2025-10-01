import GameCard from './GameCard';
import { useState, useCallback, useMemo, useRef, type Ref } from 'react';
import type { AllSearchGamesType, SearchResultCategory } from '../types';
import { Loader2 } from 'lucide-react';
import FocusableItem, { type FocusableItemHandle } from './FocusableItem';
import { useNavigation, useSearchParams } from 'react-router';

import { useLoaderData } from "react-router";
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

  const handleCategorySelect = useCallback((category: SearchResultCategory) => {
    setSelectedCategory(category)
  }, [query, setSearchParams, categoryFocusableItemRef.current]);

  const games = useLoaderData<AllSearchGamesType>();
  const navigation = useNavigation();

  const { state } = navigation;

  const loading = state === "loading" || state === "submitting"

  const displayedGamesData = useMemo(() => {
    if (!games) return null;
    return games[selectedCategory];
  }, [games, selectedCategory]);

  const displayedGames = displayedGamesData?.games || [];


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
              count={games?.[category]?.count || 0}
              selected={selectedCategory === category}
              onClick={() => handleCategorySelect(category)}
            />
          ))}
        </div>

        <div className='p-4 pb-24 '>
          {loading ? (
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
