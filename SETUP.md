# Pandemic Virtual - Setup Guide

## Overview
This guide will help you set up the Pandemic Virtual game using our recommended technology stack:
- **Frontend**: React + TypeScript
- **Backend**: Node.js + Express + Socket.IO
- **Database**: PostgreSQL
- **State Management**: Redux Toolkit

## Prerequisites

### Required Software
1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **PostgreSQL** (v13 or higher) - [Download](https://www.postgresql.org/download/)
3. **Git** - [Download](https://git-scm.com/)
4. **Code Editor** - VS Code recommended with extensions:
   - ES7+ React/Redux/React-Native snippets
   - TypeScript Importer
   - Prettier
   - ESLint

### Verify Installation
```bash
node --version    # Should be v18+
npm --version     # Should be 8+
psql --version    # Should be 13+
git --version     # Any recent version
```

## Quick Setup (Automated)

Run the setup script:
```bash
# Make script executable
chmod +x setup.sh

# Run setup
./setup.sh
```

## Manual Setup Steps

### 1. Project Structure Setup

```bash
# Create main project directory (you're already here)
cd /mnt/c/Users/rohit/OneDrive/Documents/Projects/pandemic-virtual

# Create subdirectories
mkdir client server shared docs

# Create additional directories
mkdir -p client/public/assets
mkdir -p server/src/{routes,controllers,services,models,middleware}
mkdir -p shared/{types,constants,utils}
```

### 2. Client Setup (React + TypeScript)

```bash
cd client

# Create React app with TypeScript
npx create-react-app . --template typescript

# Install additional dependencies
npm install \
  @reduxjs/toolkit \
  react-redux \
  socket.io-client \
  @types/socket.io-client \
  styled-components \
  @types/styled-components

# Install development dependencies
npm install -D \
  @types/react \
  @types/react-dom \
  @testing-library/jest-dom \
  @testing-library/react \
  @testing-library/user-event
```

### 3. Server Setup (Node.js + Express)

```bash
cd ../server

# Initialize Node.js project
npm init -y

# Install production dependencies
npm install \
  express \
  socket.io \
  cors \
  dotenv \
  pg \
  bcryptjs \
  jsonwebtoken \
  helmet \
  express-rate-limit

# Install development dependencies
npm install -D \
  @types/node \
  @types/express \
  @types/cors \
  @types/pg \
  @types/bcryptjs \
  @types/jsonwebtoken \
  nodemon \
  typescript \
  ts-node \
  jest \
  @types/jest \
  supertest \
  @types/supertest
```

### 4. Database Setup (PostgreSQL)

#### Option A: Local PostgreSQL
```bash
# Start PostgreSQL service (Ubuntu/Debian)
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
```

```sql
-- In PostgreSQL shell
CREATE DATABASE pandemic_game;
CREATE USER pandemic_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE pandemic_game TO pandemic_user;
\q
```

#### Option B: Docker PostgreSQL
```bash
# Create and run PostgreSQL container
docker run --name pandemic-postgres \
  -e POSTGRES_DB=pandemic_game \
  -e POSTGRES_USER=pandemic_user \
  -e POSTGRES_PASSWORD=test123 \
  -p 5432:5432 \
  -d postgres:15
```

### 5. Environment Configuration

Create environment files:

#### Server Environment (.env)
```bash
cd server
cat > .env << 'EOF'
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pandemic_game
DB_USER=pandemic_user
DB_PASSWORD=your_secure_password

# Security
JWT_SECRET=your_jwt_secret_key_here
BCRYPT_ROUNDS=12

# CORS
CLIENT_URL=http://localhost:3000
EOF
```

#### Client Environment (.env)
```bash
cd ../client
cat > .env << 'EOF'
# API Configuration
REACT_APP_SERVER_URL=http://localhost:3001
REACT_APP_SOCKET_URL=http://localhost:3001

# Development
GENERATE_SOURCEMAP=true
EOF
```

### 6. TypeScript Configuration

#### Server tsconfig.json
```bash
cd ../server
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "lib": ["es2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF
```

### 7. Package.json Scripts Update

#### Server package.json scripts
```bash
cd server
npm pkg set scripts.dev="nodemon --exec ts-node src/server.ts"
npm pkg set scripts.build="tsc"
npm pkg set scripts.start="node dist/server.js"
npm pkg set scripts.test="jest"
npm pkg set scripts.test:watch="jest --watch"
```

#### Client package.json scripts (already configured by create-react-app)

### 8. Git Setup

```bash
cd ..  # Back to project root

# Initialize git repository
git init

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
*/node_modules/

# Production builds
build/
dist/

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless/

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Database
*.sqlite
*.db
EOF

# Initial commit
git add .
git commit -m "Initial project setup with React, Node.js, and PostgreSQL"
```

## Project Structure After Setup

```
pandemic-virtual/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── package.json
│   └── tsconfig.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
├── shared/                 # Shared types/constants
│   ├── types/
│   ├── constants/
│   └── utils/
├── docs/                  # Documentation
├── setup.sh              # Setup script
├── README.md
└── .gitignore
```

## Verification Steps

### 1. Test Database Connection
```bash
cd server
node -e "
const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'pandemic_game',
  user: 'pandemic_user',
  password: 'your_secure_password'
});
client.connect().then(() => {
  console.log('✅ Database connection successful');
  client.end();
}).catch(err => {
  console.error('❌ Database connection failed:', err.message);
});
"
```

### 2. Test Server Startup
```bash
cd server
npm run dev
# Should see: Server running on port 3001
```

### 3. Test Client Startup
```bash
cd ../client
npm start
# Should open http://localhost:3000 in browser
```

## Next Steps

1. **Review Architecture Document**: Check `docs/ARCHITECTURE.md`
2. **Database Schema Setup**: Run database migrations
3. **Basic Components**: Start with game board component
4. **Socket.IO Integration**: Set up real-time communication

## Troubleshooting

### Common Issues

#### Port Conflicts
- Change ports in `.env` files if 3000/3001 are in use
- Client: `PORT=3002` 
- Server: `PORT=3003`

#### PostgreSQL Connection Issues
- Ensure PostgreSQL service is running
- Verify credentials in `.env`
- Check firewall settings

#### Node Version Issues
- Use Node.js v18+ for best compatibility
- Consider using nvm to manage Node versions

#### Permission Issues (WSL)
```bash
# Fix file permissions if needed
chmod -R 755 /mnt/c/Users/rohit/OneDrive/Documents/Projects/pandemic-virtual
```

## Support

- Check `docs/FAQ.md` for common questions
- Create issues in the project repository
- Review official documentation for React, Node.js, and PostgreSQL
