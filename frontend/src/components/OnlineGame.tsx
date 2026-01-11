import type { GameState, User } from '../lib/types'
import { GameBoard } from './GameBoard'

interface OnlineGameProps {
  user: User
  gameState: GameState | null
  isConnected: boolean
  isMyTurn: boolean
  mySymbol: 'X' | 'O' | null
  onCellClick: (index: number) => void
  onLeave: () => void
}

export function OnlineGame({
  gameState,
  isConnected,
  isMyTurn,
  mySymbol,
  onCellClick,
  onLeave,
}: OnlineGameProps) {
  if (!gameState) {
    return (
      <div
        className="app-container flex items-center justify-center"
        style={{ minHeight: '100vh' }}
      >
        <div className="card text-center">
          <p className="text-muted">Loading game...</p>
        </div>
      </div>
    )
  }

  const isWaiting = gameState.status === 'WAITING'
  const isGameOver = gameState.status === 'COMPLETED'
  const opponentName =
    mySymbol === 'X' ? gameState.player_o_name : gameState.player_x_name

  let statusMessage = ''
  let statusEmoji = ''

  if (isWaiting) {
    statusMessage = 'Waiting for opponent...'
    statusEmoji = '⏳'
  } else if (isGameOver) {
    if (gameState.is_draw) {
      statusMessage = "It's a Draw!"
      statusEmoji = '🤝'
    } else if (gameState.winner === mySymbol) {
      statusMessage = 'You Won!'
      statusEmoji = '🎉'
    } else {
      statusMessage = 'You Lost'
      statusEmoji = '😔'
    }
  } else if (isMyTurn) {
    statusMessage = 'Your turn!'
    statusEmoji = '👆'
  } else {
    statusMessage = `${opponentName || 'Opponent'}'s turn...`
    statusEmoji = '⏳'
  }

  const copyGameId = () => {
    navigator.clipboard.writeText(gameState.id)
  }

  return (
    <div
      className="app-container"
      style={{ padding: '24px', minHeight: '100vh' }}
    >
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <button onClick={onLeave} className="btn btn-ghost">
            ← Leave
          </button>
          <div
            className={`status-badge ${
              isConnected ? 'connected' : 'disconnected'
            }`}
          >
            <span className="status-dot" />
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        {/* Players */}
        <div className="card mb-4">
          <div className="flex justify-between items-center">
            <div
              className={`player-indicator player-x ${
                gameState.current_turn === 'X' && !isGameOver ? 'active' : ''
              }`}
              style={{
                opacity: gameState.current_turn === 'X' || isGameOver ? 1 : 0.5,
              }}
            >
              <span
                style={{ fontSize: '20px', fontFamily: 'var(--font-display)' }}
              >
                X
              </span>
              <div>
                <div style={{ fontWeight: 500 }}>{gameState.player_x_name}</div>
                {mySymbol === 'X' && (
                  <span style={{ fontSize: '11px', opacity: 0.7 }}>(you)</span>
                )}
              </div>
            </div>

            <span className="text-muted font-mono">VS</span>

            <div
              className={`player-indicator player-o ${
                gameState.current_turn === 'O' && !isGameOver ? 'active' : ''
              }`}
              style={{
                opacity:
                  gameState.current_turn === 'O' || isGameOver || isWaiting
                    ? 1
                    : 0.5,
              }}
            >
              <span
                style={{ fontSize: '20px', fontFamily: 'var(--font-display)' }}
              >
                O
              </span>
              <div>
                <div style={{ fontWeight: 500 }}>
                  {gameState.player_o_name || '???'}
                </div>
                {mySymbol === 'O' && (
                  <span style={{ fontSize: '11px', opacity: 0.7 }}>(you)</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="card mb-4 text-center">
          <span style={{ fontSize: '28px' }}>{statusEmoji}</span>
          <h2
            style={{
              fontSize: '20px',
              marginTop: '8px',
              color: isGameOver
                ? gameState.winner === mySymbol
                  ? 'var(--success)'
                  : gameState.is_draw
                  ? 'var(--text-primary)'
                  : 'var(--error)'
                : isMyTurn
                ? 'var(--accent-x)'
                : 'var(--text-secondary)',
            }}
          >
            {statusMessage}
          </h2>
        </div>

        {/* Waiting state - show game ID */}
        {isWaiting && (
          <div
            className="card mb-4"
            style={{
              background: 'rgba(234, 179, 8, 0.1)',
              borderColor: 'rgba(234, 179, 8, 0.3)',
            }}
          >
            <p className="text-muted mb-2" style={{ fontSize: '14px' }}>
              Share this Game ID with a friend:
            </p>
            <div className="flex gap-2">
              <code
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px',
                  wordBreak: 'break-all',
                }}
              >
                {gameState.id}
              </code>
              <button
                onClick={copyGameId}
                className="btn btn-secondary"
                style={{ padding: '8px 12px' }}
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {/* Game Board */}
        <div className="card" style={{ padding: '24px' }}>
          <GameBoard
            board={gameState.board}
            size={gameState.board_size}
            onCellClick={onCellClick}
            disabled={!isMyTurn || isGameOver || isWaiting}
          />
        </div>

        {/* Play Again */}
        {isGameOver && (
          <div className="mt-6 text-center">
            <button
              onClick={onLeave}
              className="btn btn-primary"
              style={{ padding: '16px 32px' }}
            >
              Back to Lobby
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
