import { useEffect, useState } from "react"
import { Board } from "./Board"
import { Box } from "./Box"
import { Player } from "../types"
import Confetti from 'react-confetti';

import { countAvailableMoves } from '../logic/gameLogic'

const defaultBoard = [
  [2, 5, 3, 4, 1, 6, 7],
  [4, 1, 6, 7, 2, 5, 3],
  [7, 2, 5, 3, 4, 1, 6],
  [3, 4, 1, 6, 7, 2, 5],
  [6, 7, 2, 5, 3, 4, 1],
  [5, 3, 4, 1, 6, 7, 2],
  [1, 6, 7, 2, 5, 3, 4]
]

const APIEndPoint = 'https://colorcraft-w0ic.onrender.com/move'

export function GameIA() {
  const [board, setBoard] = useState(defaultBoard)
  const [players, setPlayers] = useState([
    { id: 1, colorId: 2, position: { x: -1, y: -1 }, score: 0, possibleMoves: -1 },
    { id: 2, colorId: 4, position: { x: -1, y: -1 }, score: 0, possibleMoves: -1 }
  ])
  const [turn, setTurn] = useState(1)

  const [result, setResult] = useState(-1)

  const [repeatTurn, setRepeatTurn] = useState(false)
  const [difficulty, setDifficulty] = useState("medium")
  
  useEffect(() => {
    startGame()
  }, [])

  useEffect(() => {
    if (turn === 2) {
      // Wait 0.5 second
      setTimeout(() => {
        requestMoveToServer()
      }, 500)
    }
  }, [turn])

  useEffect(() => {
    if (turn === 2 && repeatTurn) {
      setRepeatTurn(false)
      // Wait 0.5 second
      setTimeout(() => {
        requestMoveToServer()
      }, 500)
    }
  }, [turn, repeatTurn])

  function requestMoveToServer() {
    // Prepara el estado del juego para enviar al servidor
    const gameState = {
      board: board,
      turn: turn,
      players: players.map(player => ({
        id: player.id,
        colorId: player.colorId,
        position: player.position,
        score: player.score,
        possibleMoves: player.possibleMoves
      }))
    };
  
    fetch(APIEndPoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        state: gameState,
        difficulty: difficulty
      })
    })
    .then(response => response.json())
    .then(data => {
      // Actualiza el estado del juego con la respuesta del servidor
      setBoard(data.board);
      setPlayers(data.players.map((player: Player) => ({
        id: player.id,
        colorId: player.colorId,
        position: player.position,
        score: player.score,
        possibleMoves: player.possibleMoves
      })));
      setTurn(data.turn);
      if (data.turn === 2) {
        setRepeatTurn(true)
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
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
  

  function shuffleBoard() {
    const flatBoard: number[] = []
  
    // Llenar el tablero con 7 de cada número del 1 al 7
    for (let num = 1; num <= 7; num++) {
      for (let count = 0; count < 7; count++) {
        flatBoard.push(num)
      }
    }
  
    // Barajar el tablero plano
    for (let i = flatBoard.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = flatBoard[i]
      flatBoard[i] = flatBoard[j]
      flatBoard[j] = temp
    }
  
    // Reconstruir el tablero 7x7
    const newBoard = []
    for (let i = 0; i < 7; i++) {
      newBoard.push(flatBoard.slice(i * 7, i * 7 + 7))
    }
  
    setBoard(newBoard)
  }


  function startGame() {
    shuffleBoard()

    setPlayers([
      { id: 1, colorId: 2, position: { x: -1, y: -1 }, score: 0, possibleMoves: -1 },
      { id: 2, colorId: 4, position: { x: -1, y: -1 }, score: 0, possibleMoves: -1 }
    ])
    
    setTurn(1)
    setResult(-1)
  }

  function handleClick(x: number, y: number) {
    // seleccionar al player en base al turno
    const player = players.find(p => p.id === turn)
    if (!player) return

    if (player.position.x === -1 && player.position.y === -1) {
      // Si el jugador no tiene posición asignada, dejarle tomar cualquier ficha del tablero
      takeChip(player, x, y)
    } else {
      tryMovePlayer(player, x, y)
    }
  }

  function tryMovePlayer(player: Player, x: number, y: number) {
    // Debe ser el turno del jugador
    if (player.id !== turn) return

    // La nueva posición debe tener alguna chip
    if (board[y][x] == 0) return
    
    // No se puede mover a la misma posición
    if (player.position.x === x && player.position.y === y) return

    // Solo se puede mover a una posición adyacente
    if (Math.abs(player.position.x - x) > 1 || Math.abs(player.position.y - y) > 1) {
      // Con la excepción de que la nueva posición tenga una chip del mismo color
      if (board[y][x] !== player.colorId) return
    }

    takeChip(player, x, y)
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
  }

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col items-center font-bold text-xl">
        <div className="flex flex-row items-center">
          <select
            className="m-4 bg-white p-2 rounded-md"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
          </select>

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

      {result === 1 || result === 2 ? <Confetti /> : null}
    </div>
  )
}

