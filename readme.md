# Tic Tac Toe - Online Multiplayer

A real-time multiplayer Tic Tac Toe game with WebSocket support, built with Go backend and React frontend.

🎮 **Play now:** [tictactoe.dre4success.com](https://tictactoe.dre4success.com)

## Features

- **Local Play**: Two players on the same device
- **Online Multiplayer**: Real-time games via WebSocket
- **Variable Board Sizes**: 3×3 up to 10×10
- **User Accounts**: Simple username-based authentication
- **Leaderboard**: Track wins, losses, and draws
- **Game Lobby**: Create games or join existing ones

## Tech Stack

**Backend:**
- Go 1.22+
- SQLite with migrations
- Gorilla WebSocket
- Standard library HTTP router

**Frontend:**
- React 18 + TypeScript
- Vite
- Custom CSS (no framework)

## Local Development

### Prerequisites

- Go 1.22+
- Node.js 18+
- npm

### 1. Clone the repository
```bash
git clone https://github.com/dre4success/tic-tac-toe.git
cd tic-tac-toe
```

### 2. Run the backend
```bash
cd server
go mod download
go run cmd/server/main.go
```

Server starts at `http://localhost:4000`

### 3. Run the frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend starts at `http://localhost:5173`

### 4. Open the app

Visit `http://localhost:5173` in your browser.

## API Endpoints

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users` | Create user |
| GET | `/api/users?id=` | Get user by ID |
| GET | `/api/users/by-username?username=` | Get user by username |

### Games
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/games` | Create game |
| POST | `/api/games/join` | Join game |
| GET | `/api/games?id=` | Get game state |
| GET | `/api/games/list` | List available games |
| POST | `/api/games/move` | Make a move |

### Stats
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Get leaderboard |

### WebSocket
| Endpoint | Description |
|----------|-------------|
| `GET /ws?game_id=&player_id=` | Connect to game |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | Server port |
| `DATABASE_URL` | `./tictactoe.db` | SQLite database path |

**Frontend (build time):**
| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:4000/api` | Backend API URL |
| `VITE_WS_URL` | `ws://localhost:4000/ws` | WebSocket URL |

## Database

SQLite is used for simplicity. The database file (`tictactoe.db`) is created automatically on first run.

**To reset the database:**
```bash
rm tictactoe.db
# Restart server - migrations will recreate tables
```

## WebSocket Events

**Server → Client:**
| Type | Description |
|------|-------------|
| `GAME_STATE` | Initial state on connection |
| `MOVE_MADE` | A move was made |
| `PLAYER_JOINED` | Opponent joined |
| `GAME_OVER` | Game completed |
| `ERROR` | Error message |
| `PONG` | Heartbeat response |

**Client → Server:**
| Type | Description |
|------|-------------|
| `PING` | Heartbeat |

## License

MIT