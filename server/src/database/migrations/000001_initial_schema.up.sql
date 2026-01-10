PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    board_size INTEGER NOT NULL CHECK(
        board_size >= 3
        AND board_size <= 15
    ),
    status TEXT NOT NULL DEFAULT 'WAITING' CHECK(
        status IN ('WAITING', 'ACTIVE', 'COMPLETED', 'ABANDONED')
    ),
    mode TEXT NOT NULL DEFAULT 'LOCAL' CHECK(mode IN ('LOCAL', 'ONLINE')),
    winner TEXT CHECK(
        winner IN ('X', 'O')
        OR winner is NULL
    ),
    player_x_id TEXT NOT NULL,
    player_o_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_x_id) REFERENCES users(id),
    FOREIGN KEY (player_o_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS moves (
    id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    position INTEGER NOT NULL,
    symbol TEXT NOT NULL CHECK(symbol IN ('X', 'O')),
    move_number INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES users(id),
    UNIQUE(game_id, position)
);

CREATE INDEX idx_games_status ON games(status);

CREATE INDEX idx_games_player_x ON games(player_x_id);

CREATE INDEX idx_games_player_o ON games(player_o_id);

CREATE INDEX idx_moves_game_id ON moves(game_id, move_number);

CREATE INDEX idx_users_username ON users(username);