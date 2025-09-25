import React from 'react';
import { useParams } from 'react-router-dom';
import type { GameInfo } from '../types';

const GamePage: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  
  // In a real implementation, you would fetch game data based on the name
  // For now, we'll just display the name
  const game: Partial<GameInfo> = {
    name: name || 'Unknown Game',
    metadata: {
      summary: 'This is a placeholder summary for the game. In a real implementation, this would be fetched from an API or database.',
      genres: ['Action', 'Adventure'],
      platforms: ['PC', 'Mac'],
    }
  };

  return (
    <div className="p-4">
      <div className="bg-gray-800 rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-4">{game.name}</h1>
        
        {game.metadata?.summary && (
          <p className="text-gray-300 mb-6">{game.metadata.summary}</p>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {game.metadata?.genres && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Genres</h2>
              <ul className="list-disc list-inside">
                {game.metadata.genres.map((genre, index) => (
                  <li key={index} className="text-gray-300">{genre}</li>
                ))}
              </ul>
            </div>
          )}
          
          {game.metadata?.platforms && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Platforms</h2>
              <ul className="list-disc list-inside">
                {game.metadata.platforms.map((platform, index) => (
                  <li key={index} className="text-gray-300">{platform}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="mt-6">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Play Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default GamePage;