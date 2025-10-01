import { BellIcon, GlobeIcon, SearchIcon, SettingsIcon, XCircleIcon } from "lucide-react"
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

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const query = e.currentTarget.value.trim();

      // Get current URL and parse existing parameters
      const currentUrl = new URL(window.location.href);
      const currentParams = new URLSearchParams(currentUrl.search);

      if (query) {
        // Update only the query parameter, keep others
        currentParams.set('q', query);
      } else {
        // Remove query parameter if empty, keep others
        currentParams.delete('q');
      }

      // Build new URL with updated parameters - go to /search/q
      const newSearch = currentParams.toString();
      const newPath = `/search${newSearch ? '?' + newSearch : ''}`;
      navigate(newPath);

      // Optional: blur input after search
      inputRef.current?.blur();
    }
  }

  // Handle input changes to update the state
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setQuery(query)
    //navigate(`/search?q=${encodeURIComponent(query)}`);
  };


  const clearInput = () => {
    if (inputRef.current) {
      setInputValue("")
    }
  }

  const focusInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  return <div className={`absolute top-0 z-100 w-full flex flex-row items-center justify-around text-xl text-white gap-2 focus-within:bg-black ${isOnSearchPage ? 'bg-black' : ''} transition-[background]`}>
    <div className={`relative flex flex-1 items-center flex-row gap-6 italic focus-within:bg-white ${isOnSearchPage ? 'bg-white' : ''} transition-[background]`}>
      <FocusableItem onClick={focusInput} onSelect={focusInput} className="flex-1 p-4 parent flex gap-6 flex-row items-center ">

        <SearchIcon className={` opacity-0 peer-focus:opacity-100 ${isOnSearchPage || inputValue != "" ? 'opacity-100' : 'opacity-0'}  transition-opacity`} color="black" strokeWidth={2.5} />
        <input
          value={inputValue} // Controlled input
          onChange={handleInputChange} // Update state on change
          onKeyDown={handleSearch}
          placeholder="Search for games..."
          ref={inputRef}
          type='search'
          className={`flex-1 text-black peer outline-none appearance-none focus:opacity-100 ${isOnSearchPage || inputValue != "" ? 'opacity-100' : 'opacity-0'} transition-[opacity]`}
        />
        <XCircleIcon scale={2} color="#000" onClick={clearInput} className={`absolute right-3 ${inputValue != "" ? ' opacity-100' : "opacity-0 "}  transition-opacity cursor-pointer`} strokeWidth={2.5} />


        <SearchIcon onClick={focusInput} className={`peer-focus:opacity-100 opacity-0 transition-opacity cursor-pointer`} strokeWidth={2.5} />


      </FocusableItem>

    </div>
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
