import React, { useState, useEffect } from 'react'
import type { User, GameListItem } from '../lib/types'
import { api } from '../lib/api'

interface OnlineLobbyProps {
  user: User
  onBack: () => void
  onCreateGame: (boardSize: number) => void
  onJoinGame: (gameId: string) => void
  isLoading: boolean
}

export function OnlineLobby({
  user,
  onBack,
  onCreateGame,
  onJoinGame,
  isLoading,
}: OnlineLobbyProps) {
  const [boardSize, setBoardSize] = useState(3)
  const [games, setGames] = useState<GameListItem[]>([])
  const [loadingGames, setLoadingGames] = useState(true)
  const [joinGameId, setJoinGameId] = useState('')

  useEffect(() => {
    loadGames()
    const interval = setInterval(loadGames, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadGames = async () => {
    try {
      const data = await api.listGames()
      setGames(data.filter((g) => g.player_x_id !== user.id))
    } catch (err) {
      console.error('Failed to load games:', err)
    } finally {
      setLoadingGames(false)
    }
  }

  const handleJoinById = (e: React.FormEvent) => {
    e.preventDefault()
    if (joinGameId.trim()) {
      onJoinGame(joinGameId.trim())
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

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
            ONLINE LOBBY
          </h1>
          <div style={{ width: '80px' }} />
        </div>

        {/* Create Game */}
        <div className="card mb-6">
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>
            Create Game
          </h2>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-muted" style={{ fontSize: '14px' }}>
                Board Size
              </label>
              <span
                className="font-mono"
                style={{ color: 'var(--accent-x)', fontSize: '18px' }}
              >
                {boardSize}×{boardSize}
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="10"
              value={boardSize}
              onChange={(e) => setBoardSize(Number(e.target.value))}
              className="slider w-full"
            />
          </div>

          <button
            onClick={() => onCreateGame(boardSize)}
            disabled={isLoading}
            className="btn btn-primary w-full"
          >
            {isLoading ? 'Creating...' : 'Create Game'}
          </button>
        </div>

        {/* Join by ID */}
        <div className="card mb-6">
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>
            Join by Game ID
          </h2>
          <form onSubmit={handleJoinById} className="flex gap-2">
            <input
              type="text"
              value={joinGameId}
              onChange={(e) => setJoinGameId(e.target.value)}
              placeholder="Enter game ID"
              className="input"
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              disabled={isLoading || !joinGameId.trim()}
              className="btn btn-secondary"
            >
              Join
            </button>
          </form>
        </div>

        {/* Available Games */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 style={{ fontSize: '18px' }}>Available Games</h2>
            <button
              onClick={loadGames}
              className="btn btn-ghost"
              style={{ padding: '4px 8px', fontSize: '14px' }}
            >
              Refresh
            </button>
          </div>

          {loadingGames ? (
            <p className="text-muted text-center" style={{ padding: '20px' }}>
              Loading...
            </p>
          ) : games.length === 0 ? (
            <div className="text-center" style={{ padding: '32px' }}>
              <p className="text-muted mb-2">No games available</p>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                Create one and share the ID with a friend!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {games.map((game) => (
                <div key={game.id} className="lobby-game-item">
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                      {game.player_x_name}
                    </div>
                    <div className="flex gap-4" style={{ fontSize: '13px' }}>
                      <span className="text-muted">
                        {game.board_size}×{game.board_size}
                      </span>
                      <span className="text-muted">
                        {formatTime(game.created_at)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onJoinGame(game.id)}
                    disabled={isLoading}
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px' }}
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
