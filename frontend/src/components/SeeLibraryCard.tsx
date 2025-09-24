import { API_URL } from "../api";

export default function SeeLibraryCard({ selected }: { selected: boolean }) {
  return <>
    <div className="cursor-pointer relative flex flex-col pb-24 justify-between gap-0 min-h-90 min-w-60 w-60">
      <div className={`min-h-90  bg-neutral-700/70 h-90 border-0 text-white appearance-none outline-none flex-1 transition-[scale,border] z-10 ${selected ? 'scale-[1.045] border-1 shadow-md border-neutral-500' : ''}`} >
        <p className=" absolute z-10 text-3xl leading-normal text-center top-0 w-full h-full flex 500 max-h-90 justify-center items-center  ">View more<br /> in your<br /> library</p>
      </div>
    </div >
  </>
}
