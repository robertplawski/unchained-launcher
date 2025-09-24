import { BatteryIcon, GlobeIcon, NetworkIcon, SearchIcon, SettingsIcon, WifiIcon } from "lucide-react"
import Clock from "./Clock"
import { useRef } from "react";
export default function Header() {
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  return <div className="w-full flex flex-row items-center justify-around text-xl text-white gap-6 focus-within:bg-black transition-[background]">
    <div className="relative p-4 flex flex-1 items-center flex-row gap-6 italic focus-within:bg-white transition-[background]">
      <input placeholder="Search for games..." ref={inputRef} type='search' className="peer pl-10 flex-1 text-black outline-none appearance-none focus:opacity-100 opacity-0 transition-[opacity]" />
      <SearchIcon className='absolute left-4 peer-focus:opacity-100 opacity-0 transition-opacity' color="black" strokeWidth={2.5} />
      <SearchIcon strokeWidth={2.5} />
    </div>
    <SettingsIcon />
    <GlobeIcon />
    <Clock />
    <div className="mr-2 flex items-center justify-center font-bold bg-neutral-700 border-blue-500 border-r-4 w-auto aspect-[1/1] h-8">
      ?
    </div>
  </div>
}
