import { Box } from "./Box";
import { Player } from "../types"

export function Board({board, players, handleClick} : {
  board: number[][],
  players: Player[],
  handleClick: (x: number, y: number) => void
}) {
  return (
    <div className="flex flex-col items-center">
      <div className='grid grid-cols-7 gap-1 lg:gap-4 md:gap-3 sm:gap-2'>
        {board.map((row, i) => (
          row.map((chipId, j) => (
            <Box key={i * 7 + j} chipId={chipId} borderId={
              players.find(player => player.position.x === j && player.position.y === i)?.colorId || 0
            } onClick={() => handleClick(j, i)} />
          ))
        ))}
      </div>
    </div>
  )
}