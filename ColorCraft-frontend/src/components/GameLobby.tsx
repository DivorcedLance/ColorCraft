import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { socket } from '../socket'

export const GameLobby: React.FC = () => {
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    if (username) {
      socket.emit('create_room', { username });
      socket.on('room_created', (data) => {
        navigate(`/room/${data.room_code}`, {
          state: { username, player_id: data.player_id, room_code: data.room_code },
        });
      });
    }
  };

  const handleJoinRandomRoom = () => {
    if (username) {
      socket.emit('join_game', { username });
      socket.on('joined_room', (data) => {
        navigate(`/room/${data.room_code}`, {
          state: { username, player_id: data.player_id, room_code: data.room_code },
        });
      });
    }
  };

  const handleJoinWithCode = () => {

    if (username && roomCode) {
      socket.emit('join_game', { username, room_code: roomCode });
      socket.on('joined_room', (data) => {
        navigate(`/room/${data.room_code}`, {
          state: { username, player_id: data.player_id, room_code: data.room_code },
        });
      });
    }
  };

  return (
    <div className='text-white flex flex-col items-center space-y-4'>
      <h1 className='text-2xl'>{username ? 'Multiplayer' : 'Enter your Nickname'}</h1>
      <input
        type='text'
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder='Enter your Username'
        className='text-black p-2 rounded w-96'
        autoFocus
      />
      {
        (username ? (
          <div className='flex flex-col items-center gap-4'>
            <button
              onClick={handleCreateRoom}
              className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-96'
            >
              Create Room
            </button>
            <button
              onClick={handleJoinRandomRoom}
              className='bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-96'
            >
              Join Random Room
            </button>
            <div className='flex'>
              <input
                type='text'
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder='Room Code'
                className='text-black p-2 rounded w-32'
              />
              <button
                onClick={handleJoinWithCode}
                className='bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded w-64'
              >
                Join Room with Code
              </button>
            </div>
          </div>
        ) : null)
      }
    </div>
  );
};
