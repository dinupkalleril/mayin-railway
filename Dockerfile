# ---------- Stage 1: Build Frontend ----------
    FROM node:20-alpine AS frontend-builder

    WORKDIR /frontend
    
    COPY aio-frontend/package*.json ./
    RUN npm install
    
    COPY aio-frontend .
    RUN npm run build && npm run export
    
    
    # ---------- Stage 2: Build Backend ----------
    FROM node:20-alpine
    
    WORKDIR /app
    
    # Install backend dependencies
    COPY aio-backend/package*.json ./
    RUN npm install --production
    
    # Copy backend source
    COPY aio-backend .
    
    # Copy built frontend static files into backend public folder
    COPY --from=frontend-builder /frontend/out ./public
    
    ENV PORT=3000
    EXPOSE 3000
    
    CMD ["npm", "run", "start"]
    