# Docker & File Management System

A self-hosted web interface for managing Docker containers and files with role-based access control (RBAC).

## Features

- **Container Management**

  - Create/stop containers
  - Image management
  - Real-time log streaming
  - Real-time container status updates

- **File Operations**

  - Web-based file browser
  - Secure path sanitization
  - Text file editing
  - Upload/download capabilities

- **Security**

  - Google OAuth2 authentication
  - JWT-based sessions
  - Role-based access control

- **Monitoring**
  - Real-time system metrics

## Tech Stack

| Component      | Technologies                |
| -------------- | --------------------------- |
| **Backend**    | Go, Gin, GORM, Docker SDK   |
| **Database**   | SQLite                      |
| **Auth**       | JWT, Google OAuth2          |
| **Frontend**   | TypeScript, React, Tailwind |
| **Deployment** | Docker, Docker Compose      |

## Quick Start

(coming soon)

## Deployment

1. **Requirements**

   - Docker Engine
   - Google OAuth credentials
   - SSL certificates (production)
   - Reverse proxy (production)

2. **Docker Compose**

```yaml
# Example docker-compose.yml for development (local)
services:
  gsm:
    image: dasior/gsm
    ports:
      - "8181:8181"
      - "8282:8282"
    environment:
      - HOST_HOME=/home/<username>
      - GOOGLE_CLIENT_ID=...
      - GOOGLE_CLIENT_SECRET=...
      - GOOGLE_REDIRECT_URL=...
      - ADMIN_EMAIL=...
    volumes:
      - /home/<username>/gsm-data:/gsm-data
      - /var/run/docker.sock:/var/run/docker.sock

# Example docker-compose.yml for production (remote)
services:
  gsm:
    image: dasior/gsm
    ports:
      - "8181:8181"
      - "8282:8282"
    environment:
      - APP_ENV=production
      - HOST_HOME=/home/<username>
      - GOOGLE_CLIENT_ID=...
      - GOOGLE_CLIENT_SECRET=...
      - GOOGLE_REDIRECT_URL=...
      - ADMIN_EMAIL=...
      - SSL_CERT_FILE=/etc/letsencrypt/live/<domain>/fullchain.pem
      - SSL_KEY_FILE=/etc/letsencrypt/live/<domain>/privkey.pem
      - COOKIE_DOMAIN=...
      - ALLOW_ORIGIN=...
      - JWT_SECRET=...
    volumes:
      - /home/<username>/gsm-data:/gsm-data
      - /var/run/docker.sock:/var/run/docker.sock
      - /etc/letsencrypt:/etc/letsencrypt
```

> **Security Note**: Always run behind a reverse proxy with SSL in production environments (guide coming soon)
