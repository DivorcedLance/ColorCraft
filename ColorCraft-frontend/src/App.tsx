import './App.css'
// import { Game } from './components/Game'
import { GameIA } from './components/GameIA'
// import { GameRoom } from './components/GameRoom'

function App() {

  return (
    <div className='bg-[black] h-full'>
      <div className='flex items-center justify-center h-screen'>
        <GameIA />
      </div>
    </div>
  )
}

export default App
