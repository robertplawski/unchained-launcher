import React from "react";
import GameList from "./components/GameList";
import Header from "./components/Header";

const App: React.FC = () => {
  return (
    <>
      <div className="-z-1 absolute bg-black w-full h-[100vh]">
      </div>
      {/*<img src={steambig} className="absolute -z-1" />*/}
      <div className=" text-white relative h-full  max-h-[40rem] max-w-[100vw]  overflow-clip">
        <Header />
        <GameList />
      </div>
      <div className="text-white bg-black absolute bottom-0 items-center p-4 font-bold px-12  text-xl flex justify-between flex-row  w-full">
        <p>Menu</p>
        <p>Back</p>
      </div>

    </>
  );
};

export default App;

