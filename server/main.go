package main

import (
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/dre4success/tic-tac-toe/server-go/src/database"
	"github.com/dre4success/tic-tac-toe/server-go/src/handlers"
	"github.com/dre4success/tic-tac-toe/server-go/src/wsinternal"
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

	// Serve static files (frontend)
	staticDir := "./static"
	if _, err := os.Stat(staticDir); err == nil {
		fs := http.FileServer(http.Dir(staticDir))

		mux.Handle("/assets/", fs)
		// serve index.html for non-API routes
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			// Skip API and WebSocket routes
			if strings.HasPrefix(r.URL.Path, "/api") || strings.HasPrefix(r.URL.Path, "/ws") {
				http.NotFound(w, r)
				return
			}

			// Check if file exists
			path := staticDir + r.URL.Path
			if _, err := os.Stat(path); err == nil && r.URL.Path != "/" {
				fs.ServeHTTP(w, r)
				return
			}

			http.ServeFile(w, r, staticDir+"/index.html")
		})
		log.Println("✅ Serving static files from ./static")
	} else {
		log.Println("⚠️ No static directory found, running API only")
	}

	// Health check
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	log.Printf("🚀 Server starting on http://localhost:%s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
