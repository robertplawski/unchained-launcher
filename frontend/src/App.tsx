import React from "react";
import GameList from "./components/GameList";

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <GameList />
    </div>
  );
};

export default App;

