package handlers

import (
	"log"
	"net/http"

	"github.com/dre4success/tic-tac-toe/server-go/src/models"
)

func (h *Handler) GetStats(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.DB.Query(`
		WITH player_stats AS (
			SELECT
				u.id,
				u.username,
				COUNT(CASE WHEN g.winner = 'X' AND g.player_x_id = u.id THEN 1
						WHEN g.winner = 'O' AND g.player_o_id = u.id THEN 1 END) as wins,
				COUNT(CASE WHEN g.winner = 'X' AND g.player_o_id = u.id THEN 1
						WHEN g.winner = 'O' AND g.player_x_id = u.id THEN 1 END) as losses,
				COUNT(CASE WHEN g.status = 'COMPLETED' AND g.winner IS NULL
						AND (g.player_x_id = u.id OR g.player_o_id = u.id) THEN 1 END) as draws,
				COUNT(CASE WHEN g.status = 'COMPLETED'
						AND (g.player_x_id = u.id OR g.player_o_id = u.id) THEN 1 END) as total
			FROM users u
			LEFT JOIN games g ON g.player_x_id = u.id OR g.player_o_id = u.id
			GROUP BY u.id, u.username
			HAVING total > 0
		)
		SELECT id, username, wins, losses, draws, total
		FROM player_stats
		ORDER BY wins DESC, total DESC
		LIMIT 50
	`)
	if err != nil {
		log.Printf("Error fetching stats: %v", err)
		respondError(w, http.StatusInternalServerError, "Internal server error")
		return
	}
	defer rows.Close()

	var stats []models.PlayerStats
	for rows.Next() {
		var s models.PlayerStats
		if err := rows.Scan(&s.UserID, &s.Username, &s.Losses, &s.Draws, &s.Total); err != nil {
			log.Printf("Error scanning stats: %v", err)
			continue
		}
		stats = append(stats, s)
	}
	if stats == nil {
		stats = []models.PlayerStats{}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{"stats": stats})
}
