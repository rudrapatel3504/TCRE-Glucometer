# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Copy root workspace package config
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
COPY shared/types.ts ./shared/

# Install dependencies (only for frontend workspace)
RUN npm ci --workspace=frontend

# Copy source files
COPY frontend/ ./frontend/

# Build frontend
RUN npm run build --workspace=frontend

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

# Copy root package config
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/

# Install only production dependencies
RUN npm ci --only=production --workspace=frontend

# Copy built code and assets
COPY --from=builder /app/frontend/.next ./frontend/.next
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder /app/frontend/next.config.ts ./frontend/next.config.ts
COPY --from=builder /app/shared ./shared

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace=frontend"]
