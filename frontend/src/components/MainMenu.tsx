import { useState, useEffect } from 'react'
import type { User, PlayerStats } from '../lib/types'
import { api } from '../lib/api'

interface MainMenuProps {
  user: User | null
  onLogout: () => void
  onPlayLocal: (boardSize: number) => void
  onPlayOnline: () => void
}

export function MainMenu({
  user,
  onLogout,
  onPlayLocal,
  onPlayOnline,
}: MainMenuProps) {
  const [boardSize, setBoardSize] = useState(3)
  const [stats, setStats] = useState<PlayerStats[]>([])
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await api.getStats()
      setStats(data)
    } catch (err) {
      console.error('Failed to load stats:', err)
    } finally {
      setLoadingStats(false)
    }
  }

  return (
    <div
      className="app-container"
      style={{ padding: '24px', minHeight: '100vh' }}
    >
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--accent-x)' }}>TIC</span>
              <span style={{ color: 'var(--text-muted)' }}>/</span>
              <span style={{ color: 'var(--accent-o)' }}>TAC</span>
              <span style={{ color: 'var(--text-muted)' }}>/</span>
              <span>TOE</span>
            </h1>
            <p className="text-muted">
              Welcome{' '}
              <span style={{ color: 'var(--text-primary)' }}>
                {user?.username}
              </span>
            </p>
          </div>
          {user && (
            <button onClick={onLogout} className="btn btn-ghost">
              Logout
            </button>
          )}
        </div>

        {/* Game Options */}
        <div className="card mb-6">
          <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>New Game</h2>

          {/* Board Size Slider */}
          <div className="mb-6">
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

          {/* Play Buttons */}
          <div className="flex flex-col gap-4">
            <button
              onClick={() => onPlayLocal(boardSize)}
              className="btn btn-primary"
              style={{ width: '100%', padding: '16px' }}
            >
              <span style={{ fontSize: '20px' }}>🎮</span>
              Play Local
            </button>
            <button
              onClick={onPlayOnline}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '16px' }}
            >
              <span style={{ fontSize: '20px' }}>🌐</span>
              Play Online
            </button>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="card">
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>
            Leaderboard
          </h2>

          {loadingStats ? (
            <p className="text-muted text-center" style={{ padding: '20px' }}>
              Loading...
            </p>
          ) : stats.length === 0 ? (
            <p className="text-muted text-center" style={{ padding: '20px' }}>
              No games played yet
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {stats.slice(0, 10).map((stat, index) => (
                <div key={stat.user_id} className="leaderboard-item">
                  <div className="flex items-center gap-4">
                    <span
                      className={`leaderboard-rank ${index < 3 ? 'top-3' : ''}`}
                    >
                      #{index + 1}
                    </span>
                    <span
                      style={{
                        fontWeight: stat.user_id === user?.id ? 600 : 400,
                      }}
                    >
                      {stat.username}
                      {stat.user_id === user?.id && (
                        <span
                          className="text-muted"
                          style={{ fontSize: '12px', marginLeft: '8px' }}
                        >
                          (you)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex gap-4" style={{ fontSize: '14px' }}>
                    <span style={{ color: 'var(--success)' }}>
                      {stat.wins}W
                    </span>
                    <span style={{ color: 'var(--error)' }}>
                      {stat.losses}L
                    </span>
                    <span className="text-muted">{stat.draws}D</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
