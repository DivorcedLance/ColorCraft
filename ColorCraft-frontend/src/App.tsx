import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css';
import { GameIA } from './components/GameIA';
import { GameLocal } from './components/GameLocal';
import { GameLobby } from './components/GameLobby';
import { GameRoom } from './components/GameRoom';
import { Preload } from './components/Preload';

function App() {
  return (
    <Router>
      <div className='bg-[black] h-full'>
        <div className='flex items-center justify-center h-screen'>
          <Routes>
            <Route path="/" element={<Menu />} />
            <Route path="/solo" element={<GameIA />} />
            <Route path="/local" element={<GameLocal />} />
            <Route path="/multiplayer" element={<GameLobby />} />
            <Route path="/room/:room_code" element={<GameRoom />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

function Menu() {
  return (
    <div className='text-white flex flex-col items-center space-y-4'>
      <Preload />
      <h1 className='text-2xl font-bold'>Elige tu modo de juego</h1>
      <Link to="/solo">
        <button className='bg-[#0094BC] hover:bg-[#0094BC] text-white font-bold py-2 px-4 rounded w-96'>
          Solo (vs IA)
        </button>
      </Link>
      <Link to="/local">
        <button className='bg-[#F83313] hover:bg-[#F83313] text-white font-bold py-2 px-4 rounded w-96'>
          Multiplayer Local
        </button>
      </Link>
      <Link to="/multiplayer">
        <button className='bg-[#8BC240] hover:bg-[#8BC240] text-white font-bold py-2 px-4 rounded w-96'>
          Multiplayer Online
        </button>
      </Link>
    </div>
  );
}

export default App;
