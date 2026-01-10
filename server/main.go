package main

import (
	"log"
	"net/http"
	"os"

	"github.com/dre4success/tic-tac-toe/server-go/src/database"
	"github.com/dre4success/tic-tac-toe/server-go/src/handlers"
	"github.com/dre4success/tic-tac-toe/server-go/src/wsinternal"
	"github.com/rs/cors"
)

func main() {

	port := os.Getenv("PORT")
	if port == "" {
		port = "4000"
	}

	dbPath := os.Getenv("DATABASE_URL")
	if dbPath == "" {
		dbPath = "./tictactoe.db"
	}

	db, err := database.NewDatabase(dbPath)
	if err != nil {
		log.Fatal("Database error:", err)
	}
	defer db.Close()

	hub := wsinternal.NewHub()
	go hub.Run()

	h := handlers.NewHandler(db, hub)

	mux := http.NewServeMux()

	// User routes
	mux.HandleFunc("POST /api/users", h.CreateUser)
	mux.HandleFunc("GET /api/users", h.GetUser)
	mux.HandleFunc("GET /api/users/by-username", h.GetUserByUsername)

	// Game routes
	mux.HandleFunc("POST /api/games", h.CreateGame)
	mux.HandleFunc("POST /api/games/join", h.JoinGame)
	mux.HandleFunc("GET /api/games", h.GetGame)
	mux.HandleFunc("GET /api/games/list", h.ListGames)
	mux.HandleFunc("POST /api/games/move", h.MakeMove)

	// Stats route
	mux.HandleFunc("GET /api/stats", h.GetStats)

	// WebSocket route
	mux.HandleFunc("GET /ws", h.HandleWebSocket)

	// Health check
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	handler := c.Handler(mux)

	log.Printf("🚀 Server starting on http://localhost:%s", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
