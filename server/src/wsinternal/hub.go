package wsinternal

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/dre4success/tic-tac-toe/server-go/src/models"
)

// Hub maintains the set of active clients and broadcast messages
type Hub struct {
	// Registered clients grouped by game ID
	games      map[string]map[*Client]bool
	register   chan *Client
	unregister chan *Client
	broadcast  chan *GameBroadcast
	mu         sync.RWMutex
}

type GameBroadcast struct {
	GameID  string
	Message *models.WSMessage
}

func NewHub() *Hub {
	return &Hub{
		games:      make(map[string]map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan *GameBroadcast),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			if h.games[client.gameID] == nil {
				h.games[client.gameID] = make(map[*Client]bool)
			}
			h.games[client.gameID][client] = true
			h.mu.Unlock()
			log.Printf("Client registered: games=%s player=%s", client.gameID, client.playerID)

		case client := <-h.unregister:
			h.mu.Lock()
			if clients, ok := h.games[client.gameID]; ok {
				if _, ok := clients[client]; ok {
					delete(clients, client)
					close(client.send)
					if len(clients) == 0 {
						delete(h.games, client.gameID)
					}
				}
			}
			h.mu.Unlock()
			log.Printf("Client unregistered: game=%s player=%s", client.gameID, client.playerID)

		case broadcast := <-h.broadcast:
			h.mu.RLock()
			clients := h.games[broadcast.GameID]
			h.mu.RUnlock()

			data, err := json.Marshal(broadcast.Message)
			if err != nil {
				log.Printf("Error marshaling broadcast: %v", err)
				continue
			}

			for client := range clients {
				select {
				case client.send <- data:
				default:
					h.mu.Lock()
					delete(h.games[broadcast.GameID], client)
					close(client.send)
					h.mu.Unlock()
				}
			}
		}
	}
}

// BroadcastToGame sends a message to all clients in a game
func (h *Hub) BroadcastToGame(gameID string, msg *models.WSMessage) {
	h.broadcast <- &GameBroadcast{
		GameID:  gameID,
		Message: msg,
	}
}

// GetClientCount returns the number of clients connected to a game
func (h *Hub) GetClientCount(gameID string) int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.games[gameID])
}

// Register adds a client to the hub
func (h *Hub) Register(client *Client) {
	h.register <- client
}
