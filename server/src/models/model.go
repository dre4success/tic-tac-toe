package models

import "time"

type GameStatus string

const (
	StatusWaiting   GameStatus = "WAITING"
	StatusActive    GameStatus = "ACTIVE"
	StatusCompleted GameStatus = "COMPLETED"
	StatusAbandoned GameStatus = "ABANDONED"
)

type GameMode string

const (
	ModeLocal  GameMode = "LOCAL"
	ModeOnline GameMode = "ONLINE"
)

type Symbol string

const (
	SymbolX Symbol = "X"
	SymbolO Symbol = "O"
)

type User struct {
	ID        string    `json:"id" db:"id"`
	Username  string    `json:"username" db:"username"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

type Move struct {
	ID         string    `json:"id" db:"id"`
	GameID     string    `json:"game_id" db:"game_id"`
	PlayerID   string    `json:"player_id" db:"player_id"`
	Position   int       `json:"position" db:"position"`
	Symbol     Symbol    `json:"symbol" db:"symbol"`
	MoveNumber int       `json:"move_number" db:"move_number"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

type Game struct {
	ID          string     `json:"id" db:"id"`
	BoardSize   int        `json:"board_size" db:"board_size"`
	Status      GameStatus `json:"status" db:"status"`
	Mode        GameMode   `json:"mode" db:"mode"`
	Winner      *Symbol    `json:"winner" db:"winner"`
	PlayerXID   string     `json:"player_x_id" db:"player_x_id"`
	PlayerOID   *string    `json:"player_o_id" db:"player_o_id"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
	CompletedAt *time.Time `json:"completed_at,omitempty" db:"completed_at"`
}

type GameState struct {
	ID        string     `json:"id"`
	BoardSize int        `json:"board_size"`
	Status    GameStatus `json:"status"`
	Mode      GameMode   `json:"mode"`

	PlayerXID   string  `json:"player_x_id"`
	PlayerOID   *string `json:"player_o_id"`
	PlayerXName string  `json:"player_x_name,omitempty"`
	PlayerOName string  `json:"player_o_name,omitempty"`

	// Derived from moves(computed on-demand)
	Board       []Symbol `json:"board"`
	CurrentTurn Symbol   `json:"current_turn"`
	Winner      *Symbol  `json:"winner"`
	IsDraw      bool     `json:"is_draw"`

	Moves []Move `json:"moves"` // source of truth
}

type PlayerStats struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Wins     int    `json:"wins"`
	Losses   int    `json:"losses"`
	Draws    int    `josn:"draws"`
	Total    int    `json:"total"`
}

type CreateGameRequest struct {
	PlayerID  string   `json:"player_id"`
	BoardSize int      `json:"board_size"`
	Mode      GameMode `json:"mode"`
}

type JoinGameRequest struct {
	GameID   string `json:"game_id"`
	PlayerID string `json:"player_id"`
}

type MakeMoveRequest struct {
	GameID   string `json:"game_id"`
	PlayerID string `json:"player_id"`
	Position int    `json:"position"`
}

type CreateUserRequest struct {
	Username string `json:"username"`
}

type UserResponse struct {
	User *User `json:"user"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

// Websocket message types
type WSMessageType string

const (
	WSTypeGameState    WSMessageType = "GAME_STATE"
	WSTypeMoveMade     WSMessageType = "MOVE_MADE"
	WSTypePlayerJoined WSMessageType = "PLAYER_JOINED"
	WSTypePlayerLeft   WSMessageType = "PLAYER_LEFT"
	WSTypeGameOver     WSMessageType = "GAME_OVER"
	WSTypeError        WSMessageType = "ERROR"
	WSTypePing         WSMessageType = "PING"
	WSTypePong         WSMessageType = "PONG"
)

type WSMessage struct {
	Type    WSMessageType `json:"type"`
	Payload any           `json:"payload,omitempty"`
}

type WSMovePayload struct {
	Position int    `json:"position"`
	PlayerID string `json:"player_id"`
}
