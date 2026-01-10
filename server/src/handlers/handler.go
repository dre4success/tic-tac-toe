package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/dre4success/tic-tac-toe/server-go/src/database"
	"github.com/dre4success/tic-tac-toe/server-go/src/models"
	ws "github.com/dre4success/tic-tac-toe/server-go/src/wsinternal"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Handler struct {
	db  *database.Database
	hub *ws.Hub
}

func NewHandler(db *database.Database, hub *ws.Hub) *Handler {
	return &Handler{db: db, hub: hub}
}

func respondJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, models.ErrorResponse{Error: message})
}
