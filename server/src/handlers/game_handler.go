package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/dre4success/tic-tac-toe/server-go/src/game"
	"github.com/dre4success/tic-tac-toe/server-go/src/models"
	"github.com/google/uuid"
)

func deref(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

// creates a new game
func (h *Handler) CreateGame(w http.ResponseWriter, r *http.Request) {
	var req models.CreateGameRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.BoardSize < 3 || req.BoardSize > 15 {
		req.BoardSize = 3
	}

	if req.Mode != models.ModeLocal && req.Mode != models.ModeOnline {
		req.Mode = models.ModeOnline
	}

	var playerExists bool
	err := h.db.DB.QueryRow("SELECT 1 FROM users WHERE id = ?", req.PlayerID).Scan(&playerExists)
	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Player not found")
		return
	}

	now := time.Now()
	gameID := uuid.NewString()
	status := models.StatusWaiting
	if req.Mode == models.ModeLocal {
		status = models.StatusActive
	}

	_, err = h.db.DB.Exec(`
		INSERT INTO games (id, board_size, status, mode, player_x_id, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`, gameID, req.BoardSize, status, req.Mode, req.PlayerID, now, now)

	if err != nil {
		log.Printf("Error creating game: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to create game")
		return
	}

	gameState, err := game.BuildGameState(h.db.DB, gameID)
	if err != nil {
		log.Printf("Error building game state: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to build game state")
		return
	}

	respondJSON(w, http.StatusCreated, gameState)
}

// JoinGame allows a player to join an existing game
func (h *Handler) JoinGame(w http.ResponseWriter, r *http.Request) {
	var req models.JoinGameRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	var playerExists bool
	err := h.db.DB.QueryRow("SELECT 1 FROM users WHERE id = ?", req.PlayerID).Scan(&playerExists)
	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Player not found")
		return
	}

	gameState, err := game.BuildGameState(h.db.DB, req.GameID)
	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Game not found")
		return
	}
	if err != nil {
		log.Printf("Error fetching game: %v", err)
		respondError(w, http.StatusInternalServerError, "Database error")
		return
	}

	if gameState.PlayerOID != nil {
		respondError(w, http.StatusBadRequest, "Game already has two players")
		return
	}

	if gameState.PlayerXID == req.PlayerID {
		respondError(w, http.StatusBadRequest, "You are already in this game")
		return
	}

	now := time.Now()
	_, err = h.db.DB.Exec(`
		UPDATE games SET player_o_id = ?, status = ?, updated_at = ?
		WHERE id = ?
	`, req.PlayerID, models.StatusActive, now, req.GameID)

	if err != nil {
		log.Printf("Error joining game: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to join game")
		return
	}

	gameState, err = game.BuildGameState(h.db.DB, req.GameID)
	if err != nil {
		log.Printf("Error building game state: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to build game state")
		return
	}

	h.hub.BroadcastToGame(req.GameID, &models.WSMessage{
		Type:    models.WSTypePlayerJoined,
		Payload: gameState,
	})

	respondJSON(w, http.StatusOK, gameState)
}

// GetGame returns the current state of a game
func (h *Handler) GetGame(w http.ResponseWriter, r *http.Request) {
	gameID := r.URL.Query().Get("id")
	if gameID == "" {
		respondError(w, http.StatusBadRequest, "Game ID is required")
		return
	}

	gameState, err := game.BuildGameState(h.db.DB, gameID)
	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Game not found")
		return
	}
	if err != nil {
		log.Printf("Error fetching game: %v", err)
		respondError(w, http.StatusInternalServerError, "Database error")
		return
	}
	respondJSON(w, http.StatusOK, gameState)
}

// ListGames returns available games to join
func (h *Handler) ListGames(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.DB.Query(`
		SELECT g.id, g.board_size, g.status, g.mode, g.player_x_id, u.username, g.created_at
		FROM games g
		JOIN users u ON g.player_x_id = u.id
		WHERE g.status = 'WAITING' AND g.mode = 'ONLINE'
		ORDER BY g.created_at DESC
		LIMIT 50
	`)
	if err != nil {
		log.Printf("Error listing games: %v", err)
		respondError(w, http.StatusInternalServerError, "Database error")
		return
	}
	defer rows.Close()

	type GameListItem struct {
		ID          string    `json:"id"`
		BoardSize   int       `json:"board_size"`
		Status      string    `json:"status"`
		Mode        string    `json:"mode"`
		PlayerXID   string    `json:"player_x_id"`
		PlayerXName string    `json:"player_x_name"`
		CreatedAt   time.Time `json:"created_at"`
	}

	var games []GameListItem
	for rows.Next() {
		var g GameListItem
		if err := rows.Scan(&g.ID, &g.BoardSize, &g.Status, &g.Mode, &g.PlayerXID, &g.PlayerXName, &g.CreatedAt); err != nil {
			log.Printf("Error scanning game: %v", err)
			continue
		}
		games = append(games, g)
	}

	if games == nil {
		games = []GameListItem{}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{"games": games})
}

// MakeMove handles a player making a move
func (h *Handler) MakeMove(w http.ResponseWriter, r *http.Request) {
	var req models.MakeMoveRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	gameState, err := game.BuildGameState(h.db.DB, req.GameID)
	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Game not found")
		return
	}

	if err != nil {
		log.Printf("Error fetching game: %v", err)
		respondError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	if err := game.ValidateMove(gameState, req.PlayerID, req.Position); err != nil {
		if gameErr, ok := err.(game.GameError); ok {
			respondError(w, http.StatusBadRequest, gameErr.Message)
		} else {
			respondError(w, http.StatusBadRequest, err.Error())
		}
		return
	}

	var symbol models.Symbol
	if req.PlayerID == gameState.PlayerXID {
		symbol = models.SymbolX
	} else {
		symbol = models.SymbolO
	}

	tx, err := h.db.DB.Begin()
	if err != nil {
		log.Printf("Could not start trx %v", err)
		respondError(w, http.StatusInternalServerError, "Internal server error")
		return
	}
	defer tx.Rollback()

	move := models.Move{
		ID:         uuid.NewString(),
		GameID:     req.GameID,
		PlayerID:   req.PlayerID,
		Position:   req.Position,
		Symbol:     symbol,
		MoveNumber: len(gameState.Moves) + 1,
		CreatedAt:  time.Now(),
	}

	_, err = tx.Exec(`
	INSERT INTO moves (id, game_id, player_id, position, symbol, move_number, created_at)
	VALUES (?, ?, ?, ?, ?, ?, ?)
	`, move.ID, move.GameID, move.PlayerID, move.Position, move.Symbol, move.MoveNumber, move.CreatedAt)

	if err != nil {
		log.Printf("Error inserting move: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to save move")
		return
	}

	// rebuild state to check winner
	newState, err := game.BuildGameState(tx, req.GameID)
	if err != nil {
		log.Printf("Error rebuilding state: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to rebuild state")
		return
	}
	if newState.Winner != nil || newState.IsDraw {
		now := time.Now()
		_, err := tx.Exec(`
			UPDATE games SET status = ?, winner = ?, completed_at = ?, updated_at = ?
			WHERE id = ?
		`, models.StatusCompleted, newState.Winner, now, now, req.GameID)

		if err != nil {
			log.Printf("Error updating game: %v", err)
			respondError(w, http.StatusInternalServerError, "Failed to update game")
			return
		}
		newState.Status = models.StatusCompleted
	}

	if err := tx.Commit(); err != nil {
		log.Printf("Error committing transaction: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to save move")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(newState)

	// Broadcast to other players
	msgType := models.WSTypeMoveMade
	if newState.Winner != nil || newState.IsDraw {
		msgType = models.WSTypeGameOver
	}
	h.hub.BroadcastToGame(req.GameID, &models.WSMessage{
		Type:    msgType,
		Payload: newState,
	})

	respondJSON(w, http.StatusOK, newState)
}
