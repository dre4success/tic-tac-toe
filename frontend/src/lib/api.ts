import {
  GetUserResponse,
  CreateUserResponse,
  GameListItem,
  GameMode,
  GamesListResponse,
  GameState,
  PlayerStats,
  StatsResponse,
  User,
  WSMessage,
} from './types'

const API_URL = '/api'
const WS_URL =
  location.protocol === 'https:'
    ? `wss://${location.host}/ws`
    : `ws://${location.host}/ws`

export class ApiError extends Error {
  public status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  })

  const data = await res.json()

  if (!res.ok) {
    throw new ApiError(res.status, data.error || 'Request failed')
  }
  return data
}

export const api = {
  createUser: async (username: string): Promise<User> => {
    const data = await request<CreateUserResponse>('/users', {
      method: 'POST',
      body: JSON.stringify({ username }),
    })
    return data.user
  },

  getUser: async (id: string): Promise<User> => {
    const data = await request<GetUserResponse>(
      `/users?id=${encodeURIComponent(id)}`
    )
    return data.user
  },
  getUserByUsername: async (username: string): Promise<User> => {
    const data = await request<GetUserResponse>(
      `/users/by-username?username=${encodeURIComponent(username)}`
    )
    return data.user
  },

  // Game endpoints
  createGame: async (
    playerId: string,
    boardSize: number = 3,
    mode: GameMode = 'ONLINE'
  ): Promise<GameState> => {
    return request<GameState>('/games', {
      method: 'POST',
      body: JSON.stringify({
        player_id: playerId,
        board_size: boardSize,
        mode,
      }),
    })
  },

  joinGame: async (gameId: string, playerId: string): Promise<GameState> => {
    return request<GameState>('/games/join', {
      method: 'POST',
      body: JSON.stringify({
        game_id: gameId,
        player_id: playerId,
      }),
    })
  },

  getGame: async (gameId: string): Promise<GameState> => {
    return request<GameState>(`/games?id=${encodeURIComponent(gameId)}`)
  },

  listGames: async (): Promise<GameListItem[]> => {
    const data = await request<GamesListResponse>('/games/list')
    return data.games
  },

  makeMove: async (
    gameId: string,
    playerId: string,
    position: number
  ): Promise<GameState> => {
    return request<GameState>('/games/move', {
      method: 'POST',
      body: JSON.stringify({
        game_id: gameId,
        player_id: playerId,
        position,
      }),
    })
  },

  // Stats endpoint
  getStats: async (): Promise<PlayerStats[]> => {
    const data = await request<StatsResponse>('/stats')
    return data.stats
  },
}

// WebSocket connectoin manager
export class GameWebSocket {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private pingInterval: number | null = null

  constructor(
    private gameId: string,
    private playerId: string,
    private onMessage: (message: WSMessage<GameState>) => void,
    private onOpen?: () => void,
    private onClose?: () => void,
    private onError?: (error: Event) => void
  ) {}

  connect() {
    const url = `${WS_URL}?game_id=${encodeURIComponent(
      this.gameId
    )}&player_id=${encodeURIComponent(this.playerId)}`

    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
      this.startPing()
      this.onOpen?.()
    }

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        this.onMessage(message)
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err)
      }
    }

    this.ws.onclose = () => {
      console.log('WebSocket disconnected')
      this.stopPing()
      this.onClose?.()
      this.attemptReconnect()
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.onError?.(error)
    }
  }

  private startPing() {
    this.pingInterval = setInterval(() => {
      this.send({ type: 'PING' })
    }, 30_000)
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      )
      setTimeout(
        () => this.connect(),
        this.reconnectDelay * this.reconnectAttempts
      )
    }
  }

  send(message: { type: string; payload?: unknown }) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  disconnect() {
    this.maxReconnectAttempts = 0
    this.stopPing()
    this.ws?.close()
    this.ws = null
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN
  }
}
