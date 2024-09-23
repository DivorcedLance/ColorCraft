import { Player } from "../types"

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

function getAvailableMoves(board: number[][], player: Player) {
  const x = player.position.x
  const y = player.position.y

  const availableMoves = []

  if (x === -1 && y === -1) {
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[0].length; j++) {
        if (board[j][i] !== 0) {
          availableMoves.push([i, j])
        }
      }
    }
    return availableMoves
  } else {
    const adjacentCells = getAdjacentCells(board, x, y)
    // Get adjacent cells that are not empty
    const adjacentTakes = adjacentCells.filter(adjacentCell => get_color(board, adjacentCell[0], adjacentCell[1]) !== 0)
    availableMoves.push(...adjacentTakes)

    const colorPositions = getColorPositions(board, player.colorId)
    availableMoves.push(...colorPositions)

    // Remove duplicates
    return availableMoves.filter((value, index, self) => self.indexOf(value) === index)
  }
}

export function countAvailableMoves(board: number[][], player: Player) {
  return getAvailableMoves(board, player).length
}

export function playerCanMove(player: Player, turn: number, board: number[][],  x: number, y: number) {
  // Debe ser el turno del jugador
  if (player.id !== turn) return false

  // La nueva posición debe tener alguna chip
  if (board[y][x] == 0) return false
  
  // No se puede mover a la misma posición
  if (player.position.x === x && player.position.y === y) return false

  // Solo se puede mover a una posición adyacente
  if (Math.abs(player.position.x - x) > 1 || Math.abs(player.position.y - y) > 1) {
    // Con la excepción de que la nueva posición tenga una chip del mismo color
    if (board[y][x] !== player.colorId) return false
  }

  return true
}

export function shuffleBoard() {
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

  return newBoard
}