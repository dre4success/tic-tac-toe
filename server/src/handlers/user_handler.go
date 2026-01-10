package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/dre4success/tic-tac-toe/server-go/src/models"
	"github.com/google/uuid"
)

func (h *Handler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req models.CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Username == "" {
		respondError(w, http.StatusBadRequest, "Username is required")
		return
	}

	var existingID string
	err := h.db.DB.QueryRow("SELECT id FROM users WHERE username = ?", req.Username).Scan(&existingID)
	if err == nil {
		respondError(w, http.StatusConflict, "Username already taken")
		return
	}

	user := &models.User{
		ID:        uuid.NewString(),
		Username:  req.Username,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	_, err = h.db.DB.Exec(`
		INSERT INTO users (id, username, created_at, updated_at)
		VALUES (?, ?, ?, ?)
	`, user.ID, user.Username, user.CreatedAt, user.UpdatedAt)

	if err != nil {
		log.Printf("Error creating user: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to create user")
		return
	}

	respondJSON(w, http.StatusCreated, models.UserResponse{User: user})
}

func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("id")
	if userID == "" {
		respondError(w, http.StatusBadRequest, "User ID is required")
		return
	}

	var user models.User
	err := h.db.DB.QueryRow(`
		SELECT id, username, created_at, updated_at FROM users WHERE id = ?
	`, userID).Scan(&user.ID, &user.Username, &user.CreatedAt, &user.UpdatedAt)

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "User not found")
		return
	}
	if err != nil {
		log.Printf("Error fetching user: %v", err)
		respondError(w, http.StatusInternalServerError, "Database error")
		return
	}

	respondJSON(w, http.StatusOK, models.UserResponse{User: &user})
}

func (h *Handler) GetUserByUsername(w http.ResponseWriter, r *http.Request) {
	username := r.URL.Query().Get("username")
	if username == "" {
		respondError(w, http.StatusBadRequest, "Username is required")
		return
	}

	var user models.User
	err := h.db.DB.QueryRow(`
		SELECT id, username, created_at, updated_at FROM users WHERE username = ?
	`, username).Scan(&user.ID, &user.Username, &user.CreatedAt, &user.UpdatedAt)

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "User not found")
		return
	}
	if err != nil {
		log.Printf("Error fetching user: %v", err)
		respondError(w, http.StatusInternalServerError, "Database error")
		return
	}
	respondJSON(w, http.StatusOK, models.UserResponse{User: &user})
}
