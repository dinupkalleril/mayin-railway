FROM node:18-alpine

# Production environment
ENV NODE_ENV=production

# App directory
WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# App listens on process.env.PORT (Railway sets this)
EXPOSE 3001

# Healthcheck (uses runtime PORT)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "const port=process.env.PORT||3001;require('http').get(`http://localhost:${port}/health`,r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

# Start backend (NO automatic migrations)
CMD ["npm", "start"]
