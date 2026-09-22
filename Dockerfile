# ==========================================
# Multi-stage Dockerfile for ERP Цемент
# ==========================================

# STAGE 1: Frontend Build
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# STAGE 2: Production Server
FROM node:20-alpine
WORKDIR /app

# Install native dependencies required by better-sqlite3 compilation
RUN apk add --no-cache python3 make g++

# Install backend dependencies
COPY package*.json ./
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copy backend source code
COPY backend/ ./backend/

# Copy built frontend assets to serve via Express
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose ERP application port
EXPOSE 5001

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=5001

# Start ERP server
CMD ["node", "backend/src/server.js"]
