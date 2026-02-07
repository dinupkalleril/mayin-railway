## =========================
## 1) Build stage
## =========================
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

## =========================
## 2) Runtime stage
## =========================
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# App listens on process.env.PORT
EXPOSE 3000

# Healthcheck using runtime PORT
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "const port=process.env.PORT||3000;require('http').get(`http://localhost:${port}/health`,r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

# Start standalone Next.js server
CMD ["node", "server.js"]
