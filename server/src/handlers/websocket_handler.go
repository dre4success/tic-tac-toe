package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/dre4success/tic-tac-toe/server-go/src/game"
	"github.com/dre4success/tic-tac-toe/server-go/src/models"
	ws "github.com/dre4success/tic-tac-toe/server-go/src/wsinternal"
)

// HandleWebSocket upgrades HTTP connection to WebSocket
func (h *Handler) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	gameID := r.URL.Query().Get("game_id")
	playerID := r.URL.Query().Get("player_id")

	if gameID == "" || playerID == "" {
		respondError(w, http.StatusBadRequest, "game_id and player_id are required")
		return
	}

	gameState, err := game.BuildGameState(h.db.DB, gameID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Game not found")
		return
	}

	isPlayer := playerID == gameState.PlayerXID ||
		(gameState.PlayerOID != nil && playerID == *gameState.PlayerOID)

	if !isPlayer && gameState.Mode == models.ModeOnline {
		respondError(w, http.StatusForbidden, "You are not a player in this game")
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}

	client := ws.NewClient(h.hub, conn, gameID, playerID)
	h.hub.Register(client)

	// send initial game state
	client.Send(&models.WSMessage{
		Type:    models.WSTypeGameState,
		Payload: gameState,
	})

	// start read/write pumps
	go client.WritePump()
	go client.ReadPump(h.handleWSMessage)
}

// handleWSMessage processes incoming WebSocket messages
// Only handles ping/pong for connection health checks
func (h *Handler) handleWSMessage(client *ws.Client, data []byte) {
	var msg models.WSMessage
	if err := json.Unmarshal(data, &msg); err != nil {
		log.Printf("Error unmarshalling WS message: %v", err)
		return
	}

	switch msg.Type {
	case models.WSTypePing:
		client.Send(&models.WSMessage{Type: models.WSTypePong})
	}
}
