import { useState, useCallback } from 'react'
import { useUser } from './hooks/useUser'
import { useLocalGame } from './hooks/useLocalGame'
import { useOnlineGame } from './hooks/useOnlineGame'
import { LoginScreen } from './components/LoginScreen'
import { MainMenu } from './components/MainMenu'
import { LocalGame } from './components/LocalGame'
import { OnlineLobby } from './components/OnlineLobby'
import { OnlineGame } from './components/OnlineGame'
import { Toast } from './components/Toast'

type Screen = 'menu' | 'local' | 'online-lobby' | 'online-game'

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [boardSize, setBoardSize] = useState(3)
  const [currentGameId, setCurrentGameId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // User hook
  const {
    user,
    isLoading: userLoading,
    error: userError,
    login,
    logout,
  } = useUser()

  // Local game hook
  const localGame = useLocalGame(boardSize)

  // Online game hook
  const onlineGame = useOnlineGame({
    user,
    gameId: currentGameId,
    onError: setError,
  })

  // Handle starting local game
  const handlePlayLocal = useCallback(
    (size: number) => {
      setBoardSize(size)
      localGame.resetGame(size)
      setScreen('local')
    },
    [localGame]
  )

  // Handle creating online game
  const handleCreateOnlineGame = useCallback(
    async (size: number) => {
      setBoardSize(size)
      const state = await onlineGame.createGame(size, 'ONLINE')
      if (state) {
        setCurrentGameId(state.id)
        setScreen('online-game')
      }
    },
    [onlineGame]
  )

  // Handle joining online game
  const handleJoinGame = useCallback(
    async (gameId: string) => {
      const state = await onlineGame.joinGame(gameId)
      if (state) {
        setCurrentGameId(state.id)
        setScreen('online-game')
      }
    },
    [onlineGame]
  )

  // Handle leaving online game
  const handleLeaveGame = useCallback(() => {
    onlineGame.clearGame()
    setCurrentGameId(null)
    setScreen('online-lobby')
  }, [onlineGame])

  // Handle online move
  const handleOnlineMove = useCallback(
    async (position: number) => {
      if (!onlineGame.isMyTurn()) return
      await onlineGame.makeMove(position)
    },
    [onlineGame]
  )

  // Loading state
  if (userLoading) {
    return (
      <div
        className="app-container flex items-center justify-center"
        style={{ minHeight: '100vh' }}
      >
        <p className="text-muted">Loading...</p>
      </div>
    )
  }

  // Not logged in
  if (!user) {
    return (
      <>
        <LoginScreen
          onLogin={login}
          isLoading={userLoading}
          error={userError}
        />
        {error && <Toast message={error} onClose={() => setError(null)} />}
      </>
    )
  }

  // Render current screen
  return (
    <>
      {screen === 'menu' && (
        <MainMenu
          user={user}
          onLogout={logout}
          onPlayLocal={handlePlayLocal}
          onPlayOnline={() => setScreen('online-lobby')}
        />
      )}

      {screen === 'local' && (
        <LocalGame
          board={localGame.board}
          size={localGame.size}
          currentPlayer={localGame.currentPlayer}
          winner={localGame.winner}
          onCellClick={localGame.makeMove}
          onNewGame={() => localGame.resetGame(boardSize)}
          onBack={() => setScreen('menu')}
        />
      )}

      {screen === 'online-lobby' && (
        <OnlineLobby
          user={user}
          onBack={() => setScreen('menu')}
          onCreateGame={handleCreateOnlineGame}
          onJoinGame={handleJoinGame}
          isLoading={onlineGame.isLoading}
        />
      )}

      {screen === 'online-game' && (
        <OnlineGame
          user={user}
          gameState={onlineGame.gameState}
          isConnected={onlineGame.isConnected}
          isMyTurn={onlineGame.isMyTurn()}
          mySymbol={onlineGame.getMySymbol()}
          onCellClick={handleOnlineMove}
          onLeave={handleLeaveGame}
        />
      )}

      {error && <Toast message={error} onClose={() => setError(null)} />}
    </>
  )
}
