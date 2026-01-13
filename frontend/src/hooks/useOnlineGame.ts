import { useCallback, useEffect, useRef, useState } from 'react'
import { User, GameState, WSMessage } from '../lib/types'
import { api, GameWebSocket } from '../lib/api'

interface UseOnlineGameOptions {
  user: User | null
  gameId: string | null
  onError?: (error: string) => void
}

export function useOnlineGame({ user, gameId, onError }: UseOnlineGameOptions) {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const wsRef = useRef<GameWebSocket | null>(null)

  // Handle WebSocket messages
  const handleMessage = useCallback(
    (message: WSMessage<GameState>) => {
      switch (message.type) {
        case 'GAME_STATE':
        case 'MOVE_MADE':
        case 'PLAYER_JOINED':
        case 'GAME_OVER':
          if (message.payload) {
            setGameState(message.payload)
          }
          break
        case 'ERROR':
          const errorPayload = message.payload as { error: string } | undefined
          onError?.(errorPayload?.error || 'Unknown error')
          break
        case 'PONG':
          break
        default:
          console.log('Unknown message type:', message.type)
      }
    },
    [onError]
  )

  // connect to WebSocket when game and user are available
  useEffect(() => {
    if (!gameId || !user) return

    wsRef.current?.disconnect()

    const ws = new GameWebSocket(
      gameId,
      user.id,
      handleMessage,
      () => setIsConnected(true),
      () => setIsConnected(false),
      () => onError?.('WebSocket connection error')
    )

    ws.connect()
    wsRef.current = ws

    return () => {
      ws.disconnect()
      wsRef.current = null
    }
  }, [gameId, user, handleMessage, onError])

  // Create a new game
  const createGame = useCallback(
    async (boardSize: number = 3, mode: 'LOCAL' | 'ONLINE' = 'ONLINE') => {
      if (!user) {
        onError?.('You must be logged in to create a game')
        return null
      }

      setIsLoading(true)
      try {
        const state = await api.createGame(user.id, boardSize, mode)
        setGameState(state)
        return state
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to create game'
        onError?.(message)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [user, onError]
  )
  // Join an existing game
  const joinGame = useCallback(
    async (targetGameId: string) => {
      if (!user) {
        onError?.('You must be logged in to join a game')
        return null
      }

      setIsLoading(true)
      try {
        const state = await api.joinGame(targetGameId, user.id)
        setGameState(state)
        return state
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to join game'
        onError?.(message)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [user, onError]
  )

  // Make a move
  const makeMove = useCallback(
    async (position: number) => {
      if (!user || !gameId) {
        onError?.('Cannot make move: missing user or game')
        return null
      }

      try {
        const state = await api.makeMove(gameId, user.id, position)
        setGameState(state)
        return state
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to make move'
        onError?.(message)
        return null
      }
    },
    [user, gameId, onError]
  )

  // Refresh game state
  const refreshGame = useCallback(async () => {
    if (!gameId) return null

    setIsLoading(true)
    try {
      const state = await api.getGame(gameId)
      setGameState(state)
      return state
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to refresh game'
      onError?.(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [gameId, onError])

  // Determine if it's the current user's turn
  const isMyTurn = useCallback(() => {
    if (!gameState || !user) return false

    const mySymbol =
      user.id === gameState.player_x_id
        ? 'X'
        : user.id === gameState.player_o_id
        ? 'O'
        : null

    return gameState.status === 'ACTIVE' && gameState.current_turn === mySymbol
  }, [gameState, user])

  // Get the user's symbol in this game
  const getMySymbol = useCallback(() => {
    if (!gameState || !user) return null

    if (user.id === gameState.player_x_id) return 'X'
    if (user.id === gameState.player_o_id) return 'O'
    return null
  }, [gameState, user])

  // Clear game state
  const clearGame = useCallback(() => {
    wsRef.current?.disconnect()
    wsRef.current = null
    setGameState(null)
    setIsConnected(false)
  }, [])

  return {
    gameState,
    isConnected,
    isLoading,
    createGame,
    joinGame,
    makeMove,
    refreshGame,
    isMyTurn,
    getMySymbol,
    clearGame,
  }
}
