import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css';
import { GameIA } from './components/GameIA';
import { Game } from './components/Game';
import { GameLobby } from './components/GameLobby';
import { GameRoom } from './components/GameRoom';

function App() {
  return (
    <Router>
      <div className='bg-[black] h-full'>
        <div className='flex items-center justify-center h-screen'>
          <Routes>
            <Route path="/" element={<Menu />} />
            <Route path="/solo" element={<GameIA />} />
            <Route path="/local" element={<Game />} />
            <Route path="/multiplayer" element={<GameLobby />} />
            <Route path="/room/:room_code" element={<GameRoom />} /> {/* Route for GameRoom */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

function Menu() {
  return (
    <div className='text-white flex flex-col items-center space-y-4'>
      <h1 className='text-2xl'>Elige tu modo de juego</h1>
      <Link to="/solo">
        <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'>
          Solo (GameIA)
        </button>
      </Link>
      <Link to="/local">
        <button className='bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded'>
          Multiplayer Local (Game)
        </button>
      </Link>
      <Link to="/multiplayer">
        <button className='bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded'>
          Multiplayer (GameLobby)
        </button>
      </Link>
    </div>
  );
}

export default App;
