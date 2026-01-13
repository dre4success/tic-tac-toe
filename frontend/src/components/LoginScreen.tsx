import React, { useState } from 'react'

interface LoginScreenProps {
  onLogin: (username: string) => Promise<unknown>
  isLoading: boolean
  error: string | null
  onBack: () => void
}

export function LoginScreen({
  onLogin,
  isLoading,
  error,
  onBack,
}: LoginScreenProps) {
  const [username, setUsername] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim()) {
      await onLogin(username.trim())
    }
  }

  return (
    <div
      className="app-container flex items-center justify-center"
      style={{ padding: '24px' }}
    >
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <button onClick={onBack} className="btn btn-ghost mb-4">
          ← Back
        </button>
        <div className="text-center mb-6">
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>
            <span style={{ color: 'var(--accent-x)' }}>TIC</span>
            <span style={{ color: 'var(--text-muted)' }}> / </span>
            <span style={{ color: 'var(--accent-o)' }}>TAC</span>
            <span style={{ color: 'var(--text-muted)' }}> / </span>
            <span>TOE</span>
          </h1>
          <p className="text-muted">Enter your username to play</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="input"
              autoFocus
              minLength={2}
              maxLength={20}
            />
          </div>

          {error && (
            <div style={{ color: 'var(--error)', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !username.trim()}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            {isLoading ? 'Loading...' : 'Play'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-muted" style={{ fontSize: '13px' }}>
            New username? We'll create an account for you.
          </p>
        </div>
      </div>
    </div>
  )
}
