import { useEffect, useState } from "react"
import { Board } from "./Board"
import { Box } from "./Box"
import { Preload } from "./Preload"
import { Player } from "../types"

const defaultBoard = [
  [2, 5, 3, 4, 1, 6, 7],
  [4, 1, 6, 7, 2, 5, 3],
  [7, 2, 5, 3, 4, 1, 6],
  [3, 4, 1, 6, 7, 2, 5],
  [6, 7, 2, 5, 3, 4, 1],
  [5, 3, 4, 1, 6, 7, 2],
  [1, 6, 7, 2, 5, 3, 4]
]

export function GameIA() {
  const [board, setBoard] = useState(defaultBoard)
  const [players, setPlayers] = useState([
    { id: 1, colorId: 2, position: { x: -1, y: -1 }, score: 0 },
    { id: 2, colorId: 4, position: { x: -1, y: -1 }, score: 0 }
  ])
  const [turn, setTurn] = useState(1)
  const [repeatTurn, setRepeatTurn] = useState(false)
  const [result, setResult] = useState(-1)

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

  useEffect(() => {
    const p1AvailableMoves = countAvailableMoves(players[0])
    const p2AvailableMoves = countAvailableMoves(players[1])

    if (p1AvailableMoves === 0 && p2AvailableMoves === 0) {
      // Game over
      if (players[0].score > players[1].score) {
        setResult(1)
      } else if (players[0].score < players[1].score) {
        setResult(2)
      } else {
        setResult(0)
      }
    } else if (p1AvailableMoves === 0) {
      setTurn(2)
    } else if (p2AvailableMoves === 0) {
      setTurn(1)
    }
  }, [board, players, countAvailableMoves])

  function get_color(board: number[][], x: number, y: number) {
    return board[y][x]
  }

  function getAdjacentCells(board: number[][], x: number, y: number) {
    const adjacentCells = []
    for (let i = -1; i < 2; i++) {
      for (let j = -1; j < 2; j++) {
        if ((i !== 0 || j !== 0) && 0 <= x + i && x + i < board.length && 0 <= y + j && y + j < board[0].length) {
          adjacentCells.push([x + i, y + j])
        }
      }
    }
    return adjacentCells
  }

  function getColorPositions(board: number[][], colorId: number) {
    const colorPositions = []
    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board[0].length; x++) {
        if (board[y][x] === colorId) {
          colorPositions.push([x, y])
        }
      }
    }
    return colorPositions
  }

  function getAvailableMovesAux(colorId: number, x: number, y: number) {
    const possibleMoves = []
    const adjacentCells = getAdjacentCells(board, x, y)
    // Get adjacent cells that are not empty
    const adjacentTakes = adjacentCells.filter(adjacentCell => get_color(board, adjacentCell[0], adjacentCell[1]) !== 0)
    possibleMoves.push(...adjacentTakes)

    const colorPositions = getColorPositions(board, colorId)
    possibleMoves.push(...colorPositions)

    // Remove duplicates
    return possibleMoves.filter((value, index, self) => self.indexOf(value) === index)
  }

  function getAvailableMoves(player: Player) {
    const x = player.position.x
    const y = player.position.y

    if (x === -1 && y === -1) {
      const availableMoves = []
      for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[0].length; j++) {
          if (board[i][j] !== 0) {
            availableMoves.push([j, i])
          }
        }
      }
      return availableMoves
    } else {
      return getAvailableMovesAux(player.colorId, x, y)
    }
  }

  function countAvailableMoves(player: Player) {
    return getAvailableMoves(player).length
  }

  function requestMoveToServer() {
    // Prepara el estado del juego para enviar al servidor
    const gameState = {
      board: board,
      turn: turn,
      players: players.map(player => ({
        id: player.id,
        colorId: player.colorId,
        position: player.position,
        score: player.score
      }))
    };
  
    fetch('http://127.0.0.1:5000/move', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gameState)
    })
    .then(response => response.json())
    .then(data => {
      // Actualiza el estado del juego con la respuesta del servidor
      setBoard(data.board);
      setPlayers(data.players.map((player: Player) => ({
        id: player.id,
        colorId: player.colorId,
        position: player.position,
        score: player.score
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
  

  function shuffleBoard() {
    const newBoard = defaultBoard.map(row => [...row])
    for (let i = newBoard.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = newBoard[i]
      newBoard[i] = newBoard[j]
      newBoard[j] = temp
    }
    setBoard(newBoard)
  }

  function startGame() {
    shuffleBoard()
    setPlayers([
      { id: 1, colorId: 2, position: { x: -1, y: -1 }, score: 0 },
      { id: 2, colorId: 4, position: { x: -1, y: -1 }, score: 0 }
    ])
    setTurn(1)
    setResult(-1)
  }

  function handleClick(x: number, y: number) {
    // seleccionar al player en base al turno
    const player = players.find(p => p.id === turn)
    if (!player) return

    if (player.position.x === -1 && player.position.y === -1) {
      // Si el jugador no tiene posición asignada, asignarle la posición
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
    // Si la chip es del mismo color que el jugador no cambiar de turno
    if (board[y][x] !== player.colorId) {
      // Cambiar turno
      setTurn(turn === 1 ? 2 : 1)
    }

    // Quitar la chip del tablero
    const newBoard = board.map(row => [...row])
    newBoard[y][x] = 0
    setBoard(newBoard)

    // Aumentar score
    setPlayers(prevPlayers =>
      prevPlayers.map(p => {
        if (p.id === player.id) {
          return { ...p, score: p.score + 1, position: { x, y } }
        }
        return p
      })
    )
  }

  return (
    <div className="flex flex-col items-center">
      <Preload />
      <div className="flex flex-col items-center font-bold text-xl">
        <button className="bg-white m-4 p-2 rounded-md" onClick={startGame}>New Game</button>
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
          <button className="bg-white m-4 p-2 rounded-md" onClick={() => setTurn(turn === 1 ? 2 : 1)}>End Turn</button>
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
    </div>
  )
}

