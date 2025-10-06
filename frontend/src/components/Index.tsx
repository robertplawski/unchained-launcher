import CategoryList from "./CategoryList";
import GameList from "./GameList";

export default function Index() {
  const categories = [
    {
      name: "whats-new",
      label: "What's new?"
    },
    {
      name: "recommended",
      label: "Recommended"
    }

  ]
  return <>

    <div className="fixed -z-100 bg-[#0a0a0a] w-full h-full "></div>

    <GameList />
    <div className={`absolute -z-10 top-0 left-0 w-full min-h-[41rem] bg-[radial-gradient(ellipse_at_top,transparent_0%,#0a0a0a_70%)]`}></div>
    <CategoryList className="-translate-y-20 blur-none z-10" categories={categories} />
    <div className="min-h-[100vh]"></div>

  </>
}
