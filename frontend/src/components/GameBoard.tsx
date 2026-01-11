import type { Symbol } from '../lib/types'

interface GameBoardProps {
  board: Symbol[]
  size: number
  onCellClick: (index: number) => void
  disabled: boolean
  winningCells?: number[]
}

export function GameBoard({
  board,
  size,
  onCellClick,
  disabled,
  winningCells = [],
}: GameBoardProps) {
  const fontSize = Math.max(18, Math.min(48, 320 / size))

  return (
    <div
      className="game-board"
      style={{
        gridTemplateColumns: `repeat(${size}, 1fr)`,
        maxWidth: size > 5 ? '480px' : '360px',
        width: '100%',
      }}
    >
      {board.map((cell, index) => {
        const isWinning = winningCells.includes(index)
        const isFilled = cell !== ''

        return (
          <button
            key={index}
            onClick={() => onCellClick(index)}
            disabled={disabled || isFilled}
            className={`game-cell ${isFilled ? 'filled' : ''} ${
              cell ? `symbol-${cell.toLowerCase()}` : ''
            } ${isWinning ? 'winning' : ''}`}
            style={{ fontSize: `${fontSize}px` }}
            aria-label={
              cell ? `Cell ${index + 1}: ${cell}` : `Cell ${index + 1}: empty`
            }
          >
            {cell}
          </button>
        )
      })}
    </div>
  )
}
