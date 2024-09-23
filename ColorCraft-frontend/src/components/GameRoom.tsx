import { useEffect, useState } from "react"
import { Board } from "./Board"
import { Box } from "./Box"
import { Player } from "../types"
import Confetti from 'react-confetti';
import { useLocation } from 'react-router-dom';

import { socket } from '../socket'

import { countAvailableMoves, playerCanMove, shuffleBoard } from '../logic/gameLogic'

const defaultBoard = [
  [2, 5, 3, 4, 1, 6, 7],
  [4, 1, 6, 7, 2, 5, 3],
  [7, 2, 5, 3, 4, 1, 6],
  [3, 4, 1, 6, 7, 2, 5],
  [6, 7, 2, 5, 3, 4, 1],
  [5, 3, 4, 1, 6, 7, 2],
  [1, 6, 7, 2, 5, 3, 4]
]
export function GameRoom() {
  const location = useLocation();
  const { username, player_id, room_code } = location.state;
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // Listen for game updates
    socket.on('game_status', (newStatus) => {
      console.log("game_status")
      console.log(newStatus.message)
    });

    // Cleanup on unmount
    return () => {
      socket.off('game_status');
    };
  }, []);

  useEffect(() => {
    // Listen for game updates
    socket.on('game_update', (newState) => {
      setBoard(newState.board);
      setPlayers(newState.players);
      setTurn(newState.turn);
    });

    // Cleanup on unmount
    return () => {
      socket.emit('leave_game', { username, room_code });
    };
  }, [username, room_code]);

  useEffect(() => {
    if (!updating) return;
    socket.emit('move', { room_code, game_state: {board, players, turn} });
    setUpdating(false);
  }, [updating, room_code]);

  const [board, setBoard] = useState(defaultBoard)
  const [players, setPlayers] = useState([
    { id: 1, colorId: 2, position: { x: -1, y: -1 }, score: 0, possibleMoves: -1 },
    { id: 2, colorId: 4, position: { x: -1, y: -1 }, score: 0, possibleMoves: -1 }
  ])
  const [turn, setTurn] = useState(1)

  const [result, setResult] = useState(-1)

  useEffect(() => {
    startGame()
  }, [])

  function startGame() {
    setBoard(shuffleBoard())

    setPlayers([
      { id: 1, colorId: 2, position: { x: -1, y: -1 }, score: 0, possibleMoves: -1 },
      { id: 2, colorId: 4, position: { x: -1, y: -1 }, score: 0, possibleMoves: -1 }
    ])
    
    setTurn(1)
    setResult(-1)
    setUpdating(true)
  }

  useEffect(() => {
    if (players[0].possibleMoves === 0 && players[1].possibleMoves === 0) {
      // Game over
      if (players[0].score > players[1].score) {
        setResult(1)
      } else if (players[0].score < players[1].score) {
        setResult(2)
      } else {
        setResult(0)
      }
    } else if (players[0].possibleMoves === 0) {
      setTurn(2)
    } else if (players[1].possibleMoves === 0) {
      setTurn(1)
    }
  }, [board, players])

  function handleClick(x: number, y: number) {
    // comprobar que la id del cliente sea la del jugador en turno
    if (player_id != turn) return

    // seleccionar al player en base al turno
    const player = players.find(p => p.id === turn)
    if (!player) return

    if (player.position.x === -1 && player.position.y === -1) {
      // Si el jugador no tiene posición asignada, dejarle tomar cualquier ficha del tablero
      takeChip(player, x, y)
    } else {
      if (playerCanMove(player, turn, board, x, y)) {
        takeChip(player, x, y)
      }
    }
  }

  function takeChip(player: Player, x: number, y: number) {
    let newTurn : number = turn;
    // Si la chip es del mismo color que el jugador no cambiar de turno
    if (board[y][x] !== player.colorId) {
      // Cambiar turno
      newTurn = turn === 1 ? 2 : 1
    }

    // Quitar la chip del tablero
    const newBoard = board.map(row => [...row])
    newBoard[y][x] = 0

    // Aumentar score
    setPlayers(prevPlayers =>
      prevPlayers.map(p => {
        if (p.id === player.id) {
          const np = { ...p, score: p.score + 1, position: { x, y } }
          return {...np, possibleMoves: countAvailableMoves(newBoard, np)}
        }
        return {...p, possibleMoves: countAvailableMoves(newBoard, p)}
      })
    )

    setBoard(newBoard)
    setTurn(newTurn)
    setUpdating(true)
  }

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col items-center font-bold text-xl">
        <div className="flex flex-row">
          <div className="flex flex-col text-white">
            <h1 className='text-2xl'>Game Room: {room_code}</h1>
            <p>Username: {username}</p>
            <p>Player ID: {player_id}</p>
          </div>
          <button className="bg-white m-4 p-2 rounded-md" onClick={startGame}>New Game</button>
        </div>

        <Board board={board} players={players} handleClick={handleClick} />
        <div className="flex flex-row items-center">
          <div className="text-white">
            {
              (result == -1) ? turn === 1 ? 'Player 1 turn' : 'Player 2 turn' 
              : (result == 1) ? 'Player 1 wins'
              : (result == 2) ? 'Player 2 wins'
              : 'Draw'
            }
          </div>
        </div>
        <div className="flex flex-row items-center">
          {players.map(player => (
            <div key={player.id} className="flex flex-col items-center m-4">
              <Box chipId={player.colorId} borderId={
                (player.id !== turn) ? 0 : player.colorId
              } onClick={() => {}} />
              <div className="text-white">Player {player.id}</div>
              <div className="text-white">Score: {player.score}</div>
            </div>
          ))}
        </div>
      </div>

      {result === player_id ? <Confetti /> : null}
    </div>
  )
}

