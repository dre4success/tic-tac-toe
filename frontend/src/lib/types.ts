// Player symbols
export type Symbol = 'X' | 'O' | ''

// Game status
export type GameStatus = 'WAITING' | 'ACTIVE' | 'COMPLETED' | 'ABANDONED'

// Game mode
export type GameMode = 'LOCAL' | 'ONLINE'

// User account
export interface User {
  id: string
  username: string
  created_at: string
  updated_at: string
}

// A single move in the game
export interface Move {
  id: string
  game_id: string
  player_id: string
  position: number
  symbol: Symbol
  move_number: number
  created_at: string
}

// Current game state (computed from moves)
export interface GameState {
  id: string
  board_size: number
  status: GameStatus
  mode: GameMode
  player_x_id: string
  player_o_id: string | null
  player_x_name: string
  player_o_name: string
  board: Symbol[]
  current_turn: Symbol
  winner: Symbol | null
  is_draw: boolean
  moves: Move[]
}

// Player statistics
export interface PlayerStats {
  user_id: string
  username: string
  wins: number
  losses: number
  draws: number
  total: number
}

// Game list item (for lobby)
export interface GameListItem {
  id: string
  board_size: number
  status: GameStatus
  mode: GameMode
  player_x_id: string
  player_x_name: string
  created_at: string
}

// WebSocket message types
export type WSMessageType =
  | 'GAME_STATE'
  | 'MOVE_MADE'
  | 'PLAYER_JOINED'
  | 'PLAYER_LEFT'
  | 'GAME_OVER'
  | 'ERROR'
  | 'PING'
  | 'PONG'

export interface WSMessage<T = unknown> {
  type: WSMessageType
  payload?: T
}

// API request/response types
export interface CreateUserRequest {
  username: string
}

export interface CreateUserResponse {
  user: User
}

export interface GetUserResponse {
  user: User
}

export interface CreateGameRequest {
  player_id: string
  board_size: number
  mode: GameMode
}

export interface JoinGameRequest {
  game_id: string
  player_id: string
}

export interface MakeMoveRequest {
  game_id: string
  player_id: string
  position: number
}

export interface StatsResponse {
  stats: PlayerStats[]
}

export interface GamesListResponse {
  games: GameListItem[]
}
