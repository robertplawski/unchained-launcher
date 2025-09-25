import { useSearchParams } from 'react-router-dom';
import GameCard from './GameCard';
import { useEffect, useState } from 'react';
import type { GameInfo } from '../types';
import { fetchGames } from '../api';

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
    <span>
      {name}
    </span>
    <span className='text-neutral-400'>
      {count}
    </span>
  </button>
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('category') || 'all';

  const handleCategorySelect = (category: string) => {
    setSearchParams({ q: query, category });
  };

  // make that into a hook
  const [_loading, setLoading] = useState<boolean>(true);

  const [games, setGames] = useState<GameInfo[]>([]);

  const loadGames = async () => {
    setLoading(true);
    const data = await fetchGames();
    setGames(data);
    setLoading(false);
  };

  useEffect(() => { loadGames() }, [query])

  return <div>
    <div className='p-4 flex flex-row justify-center items-center gap-2'>
      {categories.map((category, index) => (
        <CategoryButton
          key={index}
          name={category}
          count={100}
          selected={selectedCategory === category}
          onClick={() => handleCategorySelect(category)}
        />
      ))}
    </div>
    <div className='p-4'>

      <div className="flex flex-row gap-10 justify-around px-8 pb-16 w-[100vw] pl-0">
        {games.map((game) => (

          <div
            key={game.id}
            data-id={game.id}

          >
            <GameCard
              game={game}
            />
          </div>
        ))}
      </div>
    </div>
  </div>
}
