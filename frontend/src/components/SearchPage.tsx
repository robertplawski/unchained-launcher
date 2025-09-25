import { useSearchParams } from 'react-router-dom';
import GameCard from './GameCard';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
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

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('category') || 'all';

  const handleCategorySelect = useCallback((category: string) => {
    setSearchParams({ q: query, category });
  }, [query, setSearchParams]);

  const [loading, setLoading] = useState<boolean>(false);
  const [games, setGames] = useState<GameInfo[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);


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
  }, [query, handleSearch, loadGames]);

  // Only show loading when initially loading games (not when searching)
  const showLoading = loading && !query;

  const displayedGames = useMemo(() => query ? searchResults : games, [query, games, searchResults]);

  return (

    <div>
      <div className='p-4'>
        <div className='flex flex-row flex-wrap justify-center  items-center gap-2'>
          {categories.map((category) => (
            <CategoryButton
              key={category}
              name={category}
              count={100}
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
        ) : isSearching ? (
          <div className="text-center py-8">
            <p className="text-neutral-400">Searching...</p>
          </div>
        ) : (

          <div className="flex flex-row gap-8 px-8 pb-16 flex-wrap justify-center pl-0">
            {displayedGames.map((game: any, index: number) => (
              <GameCard
                hideGameInfo={true}
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
            ))}

          </div>
        )}

        {!showLoading && !isSearching && displayedGames.length === 0 && (
          <div className="text-center py-8">
            <p className="text-neutral-400">
              {query ? 'No games found. Try a different search term.' : 'No games in your library.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
