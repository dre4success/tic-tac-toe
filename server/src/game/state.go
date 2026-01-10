package game

import (
	"github.com/dre4success/tic-tac-toe/server-go/src/database"
	"github.com/dre4success/tic-tac-toe/server-go/src/models"
)

func BuildGameState(db database.DBTX, gameID string) (*models.GameState, error) {
	var game models.Game
	var playerXName string
	var playerOName *string

	// Get game metadata (static info)
	err := db.QueryRow(
		`SELECT g.id, g.board_size, g.status, g.mode, g.winner,
				g.player_x_id, g.player_o_id, g.created_at,
				ux.username,
				uo.username
		FROM games g 
		JOIN users ux ON g.player_x_id = ux.id
		LEFT JOIN users uo ON g.player_o_id = uo.id
		WHERE g.id = ?
		`, gameID).Scan(
		&game.ID, &game.BoardSize, &game.Status, &game.Mode, &game.Winner,
		&game.PlayerXID, &game.PlayerOID, &game.CreatedAt, &playerXName, &playerOName,
	)

	if err != nil {
		return nil, err
	}

	// Get all moves (Source of truth)
	rows, err := db.Query(
		`SELECT id, game_id, player_id, position, symbol, move_number, created_at
		FROM moves WHERE game_id = ?
		ORDER BY move_number ASC`, gameID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var moves []models.Move
	for rows.Next() {
		var move models.Move
		err := rows.Scan(
			&move.ID, &move.GameID, &move.PlayerID,
			&move.Position, &move.Symbol, &move.MoveNumber, &move.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		moves = append(moves, move)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	board := make([]models.Symbol, game.BoardSize*game.BoardSize)
	for i := range board {
		board[i] = ""
	}
	for _, move := range moves {
		board[move.Position] = move.Symbol
	}

	// Derive current turn from move count
	currentTurn := models.SymbolX
	if len(moves)%2 == 1 {
		currentTurn = models.SymbolO
	}

	// Derive winner by checking last move
	var winner *models.Symbol
	isDraw := false
	if len(moves) > 0 {
		lastMove := moves[len(moves)-1]
		if checkWin(board, game.BoardSize, lastMove.Position, lastMove.Symbol) {
			winner = &lastMove.Symbol
		} else if len(moves) == game.BoardSize*game.BoardSize {
			isDraw = true
		}
	}

	playerONameStr := ""
	if playerOName != nil {
		playerONameStr = *playerOName
	}

	return &models.GameState{
		ID:          game.ID,
		BoardSize:   game.BoardSize,
		Status:      game.Status,
		Mode:        game.Mode,
		PlayerXID:   game.PlayerXID,
		PlayerOID:   game.PlayerOID,
		PlayerXName: playerXName,
		PlayerOName: playerONameStr,
		Board:       board,
		CurrentTurn: currentTurn,
		Winner:      winner,
		IsDraw:      isDraw,
		Moves:       moves,
	}, nil
}

func checkWin(board []models.Symbol, size int, index int, player models.Symbol) bool {
	row := index / size
	col := index % size

	getCell := func(r, c int) models.Symbol {
		if r < 0 || r >= size || c < 0 || c >= size {
			return ""
		}
		return board[r*size+c]
	}

	scan := func(rowStep, colStep int) bool {
		count := 1
		for i := 1; i < size; i++ {
			if getCell(row+rowStep*i, col+colStep*i) != player {
				break
			}
			count++
		}
		for i := 1; i < size; i++ {
			if getCell(row-rowStep*i, col-colStep*i) != player {
				break
			}
			count++
		}
		return count >= size
	}
	return scan(0, 1) || // horizontal
		scan(1, 0) || // vertical
		scan(1, 1) || // diagonal
		scan(1, -1) // anti-diagonal
}

func ValidateMove(state *models.GameState, playerID string, position int) error {
	if state.Status != models.StatusActive {
		return ErrGameNotActive
	}

	if position < 0 || position >= len(state.Board) {
		return ErrInvalidPosition
	}

	if state.Board[position] != "" {
		return ErrPositionOccupied
	}

	var playerSymbol models.Symbol
	if playerID == state.PlayerXID {
		playerSymbol = models.SymbolX
	} else if state.PlayerOID != nil && playerID == *state.PlayerOID {
		playerSymbol = models.SymbolO
	} else {
		return ErrNotAPlayer
	}

	if state.CurrentTurn != playerSymbol {
		return ErrNotYourTurn
	}

	return nil
}

// Game-related errors
type GameError struct {
	Message string
	Code    string
}

func (e GameError) Error() string {
	return e.Message
}

var (
	ErrGameNotActive    = GameError{Message: "Game is not active", Code: "GAME_NOT_ACTIVE"}
	ErrInvalidPosition  = GameError{Message: "Invalid position", Code: "INVALID_POSITION"}
	ErrPositionOccupied = GameError{Message: "Position is already occupied", Code: "POSITION_OCCUPIED"}
	ErrNotAPlayer       = GameError{Message: "You are not a player in this game", Code: "NOT_A_PLAYER"}
	ErrNotYourTurn      = GameError{Message: "It's not your turn", Code: "NOT_YOUR_TURN"}
	ErrGameFull         = GameError{Message: "Game already has two players", Code: "GAME_FULL"}
	ErrGameNotFound     = GameError{Message: "Game not found", Code: "GAME_NOT_FOUND"}
	ErrUserNotFound     = GameError{Message: "User not found", Code: "USER_NOT_FOUND"}
)
