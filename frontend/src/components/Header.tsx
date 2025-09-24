import { BellIcon, GlobeIcon, SearchIcon, SettingsIcon } from "lucide-react"
import Clock from "./Clock"
import { useEffect, useRef } from "react";
export default function Header() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  return <div className="w-full flex flex-row items-center justify-around text-xl text-white gap-6 focus-within:bg-black transition-[background]">
    <div className="relative p-3 flex flex-1 items-center flex-row gap-6 italic focus-within:bg-white transition-[background]">
      <input placeholder="Search for games..." ref={inputRef} type='search' className="peer pl-10 flex-1 text-black outline-none appearance-none focus:opacity-100 opacity-0 transition-[opacity]" />
      <SearchIcon className='absolute left-4 peer-focus:opacity-100 opacity-0 transition-opacity' color="black" strokeWidth={2.5} />
      <SearchIcon onClick={focusInput} className="cursor-pointer" strokeWidth={2.5} />

    </div>
    <BellIcon fill="white" />
    <SettingsIcon />
    <GlobeIcon />
    <Clock />
    <div className="mr-2 flex items-center justify-center font-bold bg-neutral-700 border-blue-500 border-r-4 w-auto aspect-[1/1] h-8">
      ?
    </div>
  </div>
}
