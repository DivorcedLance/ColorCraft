import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { socket } from '../socket'

export const GameRoom: React.FC = () => {
  const location = useLocation();
  const { username, player_id, room_code } = location.state;
  const [gameState, setGameState] = useState("");

  useEffect(() => {
    // Listen for game updates
    socket.on('game_status', (newState) => {
      console.log("game_status")
      console.log(newState.message)
    });
  }, []);

  useEffect(() => {
    // Listen for game updates
    socket.on('game_update', (newState) => {
      console.log("game_update")
      console.log(newState)
      setGameState(newState);
    });
  }, []);

  const handleMove = () => {
    // Emit the content of the textarea as the game move
    socket.emit('move', { room_code, game_state: gameState });
  };

  return (
    <div className='text-white'>
      <h1 className='text-2xl'>Game Room: {room_code}</h1>
      <p>Username: {username}</p>
      <p>Player ID: {player_id}</p>
      <div>
        <h2>Game State</h2>
        <pre>{JSON.stringify(gameState, null, 2)}</pre>
      </div>

      <div className='mt-4'>
        <h3>Simulate Game State</h3>
        <textarea
          className='w-full p-2 border text-black border-gray-300 rounded'
          rows={5}
          value={gameState}
          onChange={(e) => setGameState(e.target.value)}
          placeholder="Enter game state simulation here..."
        />
      </div>

      <button
        onClick={handleMove}
        className='mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
      >
        Make a Move
      </button>
    </div>
  );
};
