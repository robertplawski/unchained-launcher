import { useSearchParams } from 'react-router-dom';

const categories = ["all", "library", "bay", "friends", "apps"]

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

  return <div>
    <div className='p-4 flex flex-row justify-center items-center gap-2'>
      {categories.map((category) => (
        <CategoryButton
          name={category}
          count={100}
          selected={selectedCategory === category}
          onClick={() => handleCategorySelect(category)}
        />
      ))}
    </div>
    <h1>Search Results for: {query} ({selectedCategory})</h1>
  </div>
}
