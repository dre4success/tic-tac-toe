package wsinternal

import (
	"encoding/json"
	"log"
	"time"

	"github.com/dre4success/tic-tac-toe/server-go/src/models"
	"github.com/gorilla/websocket"
)

const (
	// Time allowed to write a message to the peer
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer
	pongWait = 60 * time.Second

	// Send pings to peer with this period (must be less than pongWait)
	pingPeriod = (pongWait * 9) / 10

	// Maximum message allowed from peer
	maxMessageSize = 512
)

// Client represents a single websocket connection
type Client struct {
	hub      *Hub
	conn     *websocket.Conn
	send     chan []byte
	gameID   string
	playerID string
}

// NewClient creates a new client and starts its read/write pumps
func NewClient(hub *Hub, conn *websocket.Conn, gameID, playerID string) *Client {
	return &Client{
		hub:      hub,
		conn:     conn,
		send:     make(chan []byte, 256),
		gameID:   gameID,
		playerID: playerID,
	}
}

// ReadPump pumps messages from the websocket connect to the hub
func (c *Client) ReadPump(onMessage func(client *Client, data []byte)) {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(appData string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		if onMessage != nil {
			onMessage(c, message)
		}
	}
}

// WritePump pumps messages from the bug to the websocket connection
func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)
			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// sends a message to this client
func (c *Client) Send(msg *models.WSMessage) error {
	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	c.send <- data
	return nil
}

// GameID returns the client's game ID
func (c *Client) GameID() string {
	return c.gameID
}

// PlayerID returns the client's player ID
func (c *Client) PlayerID() string {
	return c.playerID
}
