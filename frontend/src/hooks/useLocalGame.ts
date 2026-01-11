import { useState, useCallback } from 'react'
import type { Symbol } from '../lib/types'

type Player = 'X' | 'O'
type Winner = Player | 'Draw' | null

const checkWin = (
  board: Symbol[],
  size: number,
  index: number,
  player: Player
): boolean => {
  const row = Math.floor(index / size)
  const col = index % size

  const getCell = (r: number, c: number): Symbol =>
    r >= 0 && r < size && c >= 0 && c < size ? board[r * size + c] : ''

  const scan = (rowStep: number, colStep: number): boolean => {
    let count = 1

    for (let i = 1; i < size; i++) {
      if (getCell(row + rowStep * i, col + colStep * i) !== player) break
      count++
    }

    for (let i = 1; i < size; i++) {
      if (getCell(row - rowStep * i, col - colStep * i) !== player) break
      count++
    }

    return count >= size
  }

  return scan(0, 1) || scan(1, 0) || scan(1, 1) || scan(1, -1)
}

export function useLocalGame(initialSize: number = 3) {
  const [size, setSize] = useState(initialSize)
  const [board, setBoard] = useState<Symbol[]>(
    Array(initialSize * initialSize).fill('')
  )
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X')
  const [winner, setWinner] = useState<Winner>(null)

  const makeMove = useCallback(
    (index: number) => {
      if (board[index] || winner) return false

      const newBoard = [...board]
      newBoard[index] = currentPlayer
      setBoard(newBoard)

      if (checkWin(newBoard, size, index, currentPlayer)) {
        setWinner(currentPlayer)
      } else if (!newBoard.includes('')) {
        setWinner('Draw')
      } else {
        setCurrentPlayer((prev) => (prev === 'X' ? 'O' : 'X'))
      }

      return true
    },
    [board, currentPlayer, size, winner]
  )

  const resetGame = useCallback((newSize: number = size) => {
    const validSize = Math.min(15, Math.max(3, newSize))
    setSize(validSize)
    setBoard(Array(validSize * validSize).fill(''))
    setWinner(null)
    setCurrentPlayer('X')
  }, [])

  return {
    board,
    size,
    currentPlayer,
    winner,
    makeMove,
    resetGame,
  }
}
