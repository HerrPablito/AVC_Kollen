# JWT Authentication System

Complete JWT-based authentication system using Node.js, Express, PostgreSQL, and Docker.

## Features

- ✅ **Bcrypt password hashing** (10 rounds)
- ✅ **Dual-token strategy**:
  - Access token (15 min expiry) via `Authorization: Bearer`
  - Refresh token (30 days expiry) via HttpOnly cookie
- ✅ **PostgreSQL database** with users and refresh tokens tables
- ✅ **Docker Compose** setup for easy deployment
- ✅ **Production-ready** with health checks and graceful shutdown

## Quick Start

### Prerequisites

- Docker & Docker Compose installed
- Port 3000 and 5432 available

### Run the Application

```bash
# Clone or navigate to the project directory
cd auth-system

# Start all services
docker compose up --build

# The API will be available at http://localhost:3000
```

That's it! The database will be automatically initialized with the schema.

## API Endpoints

### 1. Register a New User

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "createdAt": "2024-01-27T08:00:00.000Z"
  }
}
```

### 2. Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }' \
  -c cookies.txt
```

**Response:**
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

**Note:** The refresh token is automatically set as an HttpOnly cookie.

### 3. Access Protected Route

```bash
curl http://localhost:3000/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "createdAt": "2024-01-27T08:00:00.000Z"
  }
}
```

### 4. Refresh Access Token

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -b cookies.txt
```

**Response:**
```json
{
  "message": "Token refreshed successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 5. Logout

```bash
curl -X POST http://localhost:3000/auth/logout \
  -b cookies.txt
```

**Response:**
```json
{
  "message": "Logout successful"
}
```

## Project Structure

```
auth-system/
├── config/
│   └── database.js          # PostgreSQL connection pool
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── routes/
│   ├── auth.js              # Authentication endpoints
│   └── user.js              # Protected user endpoints
├── utils/
│   └── jwt.js               # JWT generation/verification
├── docker-compose.yml       # Docker services configuration
├── Dockerfile               # Backend container image
├── init.sql                 # Database schema
├── package.json             # Node.js dependencies
├── server.js                # Express application
└── .env.example             # Environment variables template
```

## Environment Variables

Copy `.env.example` to `.env` and customize:

```env
NODE_ENV=production
PORT=3000
DB_HOST=postgres
DB_PORT=5432
DB_USER=authuser
DB_PASSWORD=authpass
DB_NAME=authdb
JWT_ACCESS_SECRET=your-super-secret-access-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d
```

**⚠️ Important:** Change the JWT secrets in production!

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Refresh Tokens Table
```sql
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Security Features

- **Password Hashing:** bcrypt with 10 salt rounds
- **HttpOnly Cookies:** Refresh tokens stored in HttpOnly cookies (not accessible via JavaScript)
- **Token Expiry:** Short-lived access tokens (15 min), long-lived refresh tokens (30 days)
- **Token Type Validation:** Tokens include type field to prevent misuse
- **Database Token Storage:** Refresh tokens stored in database for revocation capability
- **Secure Cookies:** `secure` flag enabled in production, `sameSite: strict`

## Development

### Run Locally Without Docker

```bash
# Install dependencies
npm install

# Start PostgreSQL (ensure it's running)
# Update .env with local database credentials

# Run in development mode
npm run dev
```

### Stop Services

```bash
docker compose down

# Remove volumes (deletes database data)
docker compose down -v
```

## Testing the Complete Flow

```bash
# 1. Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' | jq

# 2. Login (save cookies)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' \
  -c cookies.txt | jq

# Extract access token from response and save it
ACCESS_TOKEN="<paste_token_here>"

# 3. Access protected route
curl http://localhost:3000/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

# 4. Refresh token
curl -X POST http://localhost:3000/auth/refresh \
  -b cookies.txt | jq

# 5. Logout
curl -X POST http://localhost:3000/auth/logout \
  -b cookies.txt | jq
```

## Troubleshooting

### Port Already in Use
```bash
# Check what's using port 3000 or 5432
lsof -i :3000
lsof -i :5432

# Kill the process or change ports in docker-compose.yml
```

### Database Connection Issues
```bash
# Check if PostgreSQL container is running
docker ps

# View PostgreSQL logs
docker logs jwt-auth-db

# Connect to PostgreSQL directly
docker exec -it jwt-auth-db psql -U authuser -d authdb
```

### View Backend Logs
```bash
docker logs jwt-auth-backend -f
```

## License

MIT
