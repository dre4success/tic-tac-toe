# Build frontend
FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend ./
RUN npm run build

# Build backend
FROM golang:1.25-alpine AS backend
RUN apk add build-base
WORKDIR /app
COPY server/go.mod server/go.sum ./
RUN go mod download
COPY server ./
RUN CGO_ENABLED=1 GOOS=linux go build -o server main.go

# Final image
FROM alpine:latest
RUN apk add --no-cache libc6-compat sqlite
WORKDIR /app

COPY --from=backend /app/server .
COPY --from=backend /app/src/database/migrations ./src/database/migrations
COPY --from=frontend /app/frontend/dist ./static

EXPOSE 4000
CMD [ "./server" ]