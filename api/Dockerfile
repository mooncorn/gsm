# Stage 1: Build
FROM golang:1.22.10-bullseye as builder

WORKDIR /app
COPY . .

# Install GCC and libc6-dev for CGO
RUN apt-get update && apt-get install -y gcc g++ libc6-dev

# Set architecture to ARM64 for M1/M2 and AMD64 for Intel/AMD
ENV CGO_ENABLED=1 GOOS=linux GOARCH=amd64
RUN go mod tidy
RUN go build -o app .

# Stage 2: Runtime
FROM debian:bullseye-slim

WORKDIR /app
COPY --from=builder /app/app .
COPY .env .

# Install CA certificates in the runtime container
RUN apt-get update && apt-get install -y ca-certificates
RUN update-ca-certificates

RUN chmod +x ./app

EXPOSE 8080
CMD ["./app"]
