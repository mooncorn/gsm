# Stage 1: Build frontend
FROM node:23.6.0-alpine AS frontend

WORKDIR /app

COPY app/package.json .
COPY app/package-lock.json .
RUN npm install

COPY app/ .

RUN npm i -g serve

RUN npm run build

# Stage 2: Build backend
FROM golang:1.22.10-bullseye AS backend

WORKDIR /api

RUN apt-get update && apt-get install -y gcc g++ libc6-dev
ENV CGO_ENABLED=1 GOOS=linux GOARCH=amd64

COPY api/go.mod api/go.sum ./
RUN go mod download

# Copy remaining source files
COPY api/ .

RUN go build -o api .

# Stage 3: Runtime
FROM debian:bullseye-slim

WORKDIR /app

# Install dependencies
RUN apt-get update && \
    apt-get install -y ca-certificates curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g serve && \
    update-ca-certificates

# Copy built artifacts
COPY --from=frontend /app/dist ./frontend
COPY --from=backend /api/api .
COPY docker-entrypoint.sh .
COPY api/.env .

EXPOSE 8181 8282

RUN chmod +x /app/api && \
    chmod +x /app/docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]