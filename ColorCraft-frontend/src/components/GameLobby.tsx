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
      <h1 className='text-2xl'>Multiplayer Lobby</h1>
      <input
        type='text'
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder='Enter your Username'
        className='text-black p-2 rounded'
      />
      <div className='flex space-x-4'>
        <button
          onClick={handleCreateRoom}
          className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
        >
          Create Room
        </button>
        <button
          onClick={handleJoinRandomRoom}
          className='bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded'
        >
          Join Random Room
        </button>
        <input
          type='text'
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          placeholder='Room Code'
          className='text-black p-2 rounded'
        />
        <button
          onClick={handleJoinWithCode}
          className='bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded'
        >
          Join Room with Code
        </button>
      </div>
    </div>
  );
};
