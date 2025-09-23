import Clock from "./Clock"
export default function Header() {
  return <div className="w-full flex flex-row items-center justify-around text-white gap-8 p-1 px-6">
    <div className="flex-1"></div>
    <Clock />
    <div className="bg-blue-500 border-white border-4 w-auto aspect-[1/1] h-12"></div>
  </div>
}
