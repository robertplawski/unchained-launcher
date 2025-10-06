import { BellIcon, GlobeIcon, SearchIcon, SettingsIcon } from "lucide-react"
import Clock from "./Clock"
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import FocusableItem from "./FocusableItem";

export default function Header() {

  const inputRef = useRef<HTMLInputElement>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isOnSearchPage = location.pathname === '/search';

  const [scrolled, setIsScrolled] = useState(false);

  // Detect scroll to "lift" header
  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Get current query from URL and use it as input value
  const [query, setQuery] = useState('');
  const currentQuery = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(currentQuery);

  // Update local state when query parameter changes
  useEffect(() => {
    setInputValue(currentQuery);
  }, [currentQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Remove query parameters from current location
        navigate(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOnSearchPage, navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key == "Escape") {
        e.preventDefault();
        inputRef.current?.blur();
      }
      // Check for Ctrl + F
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault(); // Prevent browser's default search
        inputRef.current?.focus(); // Focus the input
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault?.();

    if (!inputRef.current) {
      return;
    }

    const value = inputRef.current.value.trim();

    const currentUrl = new URL(window.location.href);
    const currentParams = new URLSearchParams(currentUrl.search);

    if (value) currentParams.set('q', value);
    else currentParams.delete('q');

    const newSearch = currentParams.toString();
    const newPath = `/search${newSearch ? '?' + newSearch : ''}`;
    navigate(newPath);

  };

  // Handle input changes to update the state
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setQuery(query)
    //navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const focusInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  return <div className={`absolute top-0 z-100 w-full flex flex-row items-center justify-around text-xl text-white gap-2 focus-within:bg-black ${isOnSearchPage ? 'bg-black' : ''} ${scrolled ? 'backdrop-blur-3xl' : ''} transition-[background]`}>
    <form onSubmit={handleSearch} className={`flex flex-1 items-center flex-row gap-6 italic focus-within:bg-white ${isOnSearchPage ? 'bg-white' : ''} transition-[background]`}>
      <FocusableItem onClick={focusInput} onSelect={focusInput} className="noscale relative pl-12 flex-1 p-4 parent flex gap-6 flex-row items-center ">
        <SearchIcon className={`left-0 mx-4 absolute opacity-100 peer-focus:opacity-0 transition-opacity`} color="#000" strokeWidth={2.5} />
        <input
          value={inputValue} // Controlled input
          onChange={handleInputChange} // Update state on change
          placeholder="Search for games..."
          ref={inputRef}
          type='search'
          className={`flex-1 text-black peer outline-none appearance-none focus:opacity-100 ${isOnSearchPage || inputValue != "" ? 'opacity-100' : 'opacity-0'} transition-[opacity]`}
        />
        <SearchIcon onClick={focusInput} className={`mx-4 right-0 absolute opacity-100 peer-focus:opacity-0 transition-opacity cursor-pointer`} strokeWidth={2.5} />

      </FocusableItem>
    </form>
    <FocusableItem className="p-4">
      <BellIcon fill="white" />
    </FocusableItem>
    <FocusableItem className="p-4">
      <SettingsIcon />
    </FocusableItem>
    <FocusableItem className="p-4">
      <GlobeIcon />
    </FocusableItem>
    <FocusableItem className="p-3">
      <Clock />
    </FocusableItem>
    <FocusableItem className="p-3">
      <div className="flex items-center justify-center font-bold bg-neutral-700 border-blue-500 border-r-4 w-auto aspect-[1/1] h-8">
        ?
      </div>
    </FocusableItem>
  </div>
}
