import FocusableItem from "./FocusableItem";

export default function SeeLibraryCard({ selected, onClick }: { selected?: boolean; onClick?: () => void }) {
  return <>
    <FocusableItem
      className="cursor-pointer relative min-h-80  bg-neutral-700/70 flex flex-col pb-24 justify-between gap-0 min-h-80 min-w-60 w-60"
      onClick={onClick}
    >
      <div className={` h-90 border-0 text-white appearance-none outline-none flex-1 transition-[scale,border] z-10 ${selected ? 'scale-[1.045] border-1 shadow-md border-neutral-500' : ''}`} >
        <p className=" absolute z-10 text-3xl leading-normal text-center top-0 w-full h-full flex 500 max-h-80 justify-center items-center  ">View more<br /> in your<br /> library</p>
      </div>
    </FocusableItem>
  </>
}
