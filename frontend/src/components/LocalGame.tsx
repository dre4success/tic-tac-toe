import { GameBoard } from './GameBoard'
import type { Symbol } from '../lib/types'

interface LocalGameProps {
  board: Symbol[]
  size: number
  currentPlayer: 'X' | 'O'
  winner: 'X' | 'O' | 'Draw' | null
  onCellClick: (index: number) => void
  onNewGame: () => void
  onBack: () => void
}

export function LocalGame({
  board,
  size,
  currentPlayer,
  winner,
  onCellClick,
  onNewGame,
  onBack,
}: LocalGameProps) {
  const isGameOver = winner !== null

  return (
    <div
      className="app-container"
      style={{ padding: '24px', minHeight: '100vh' }}
    >
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={onBack} className="btn btn-ghost">
            ← Back
          </button>
          <h1 className="font-mono" style={{ fontSize: '20px' }}>
            LOCAL GAME
          </h1>
          <button
            onClick={onNewGame}
            className="btn btn-secondary"
            style={{ padding: '8px 16px' }}
          >
            New Game
          </button>
        </div>

        {/* Game Status */}
        <div className="card mb-6">
          {!isGameOver ? (
            <div className="flex justify-center items-center gap-4">
              <div
                className={`player-indicator ${
                  currentPlayer === 'X' ? 'player-x active' : 'player-o'
                }`}
                style={{ opacity: currentPlayer === 'X' ? 1 : 0.5 }}
              >
                <span
                  style={{
                    fontSize: '24px',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  X
                </span>
                <span>Player X</span>
              </div>
              <span className="text-muted">vs</span>
              <div
                className={`player-indicator ${
                  currentPlayer === 'O' ? 'player-o active' : 'player-x'
                }`}
                style={{ opacity: currentPlayer === 'O' ? 1 : 0.5 }}
              >
                <span
                  style={{
                    fontSize: '24px',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  O
                </span>
                <span>Player O</span>
              </div>
            </div>
          ) : (
            <div className="text-center">
              {winner === 'Draw' ? (
                <div>
                  <span style={{ fontSize: '32px' }}>🤝</span>
                  <h2 style={{ fontSize: '24px', marginTop: '8px' }}>
                    It's a Draw!
                  </h2>
                </div>
              ) : (
                <div>
                  <span style={{ fontSize: '32px' }}>🎉</span>
                  <h2
                    style={{
                      fontSize: '24px',
                      marginTop: '8px',
                      color:
                        winner === 'X' ? 'var(--accent-x)' : 'var(--accent-o)',
                    }}
                  >
                    Player {winner} Wins!
                  </h2>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Game Board */}
        <div className="card" style={{ padding: '24px' }}>
          <GameBoard
            board={board}
            size={size}
            onCellClick={onCellClick}
            disabled={isGameOver}
          />
        </div>

        {/* Play Again */}
        {isGameOver && (
          <div className="mt-6 text-center">
            <button
              onClick={onNewGame}
              className="btn btn-primary"
              style={{ padding: '16px 32px' }}
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
