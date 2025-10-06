import type { Ref } from "react"
import type { FocusableItemHandle } from "./FocusableItem"
import FocusableItem from "./FocusableItem"

export default function CategoryButton({
  name,
  count,
  selected,
  onClick,
  query,
  ref
}: {
  query?: string,
  ref?: Ref<FocusableItemHandle>,
  name: string,
  count?: number,
  selected: boolean,
  onClick: () => void
}) {




  return <FocusableItem focus={name == "all" + (query ? "" : "")} ref={ref} onClick={onClick} onSelect={onClick}
    className={`flex flex-row gap-2 p-3 px-6 ${selected ? 'bg-neutral-700' : ''} transition-[background] hover:bg-neutral-700/80 font-bold cursor-pointer uppercase rounded-full`}
  >
    <span>{name}</span>
    {count && <span className='text-neutral-400'>{count}</span>}
  </FocusableItem>
}

