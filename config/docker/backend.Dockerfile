# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Copy root workspace package config
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY shared/types.ts ./shared/

# Install dependencies (only for backend workspace)
RUN npm ci --workspace=backend

# Copy source files
COPY backend/ ./backend/

# Build backend
RUN npm run build --workspace=backend

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

# Copy root package config
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/

# Install only production dependencies
RUN npm ci --only=production --workspace=backend

# Copy built code
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/shared ./shared

# Environment variables
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["npm", "run", "start", "--workspace=backend"]
