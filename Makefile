.PHONY: build frontend backend clean dev-frontend dev-backend

# Build everything
build: frontend backend

# Build frontend and copy to static
frontend:
	cd frontend && npm ci && npm run build
	rm -rf server/static
	cp -r frontend/dist server/static

# Build backend
backend:
	cd server && go build -o ../bin/server cmd/server/main.go

# Clean build artifacts
clean:
	rm -rf server/static bin

# Development - run frontend with hot reload
dev-frontend:
	cd frontend && npm run dev

# Development - run backend
dev-backend:
	cd server && air

# Run both in development
dev:
	@make -j2 dev-backend dev-frontend