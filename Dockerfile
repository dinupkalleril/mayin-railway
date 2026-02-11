# ---------- Stage 1: Build Frontend ----------
    FROM node:20-alpine AS frontend-builder

    WORKDIR /frontend
    
    COPY aio-frontend/package*.json ./
    RUN npm install
    
    COPY aio-frontend .
    RUN npm run build
    
    
    # ---------- Stage 2: Build Backend ----------
    FROM node:20-alpine
    
    WORKDIR /app
    
    # Install backend deps
    COPY aio-backend/package*.json ./
    RUN npm install --production
    
    # Copy backend source
    COPY aio-backend .
    
    # Copy Next standalone build
    COPY --from=frontend-builder /frontend/.next/standalone ./frontend
    COPY --from=frontend-builder /frontend/.next/static ./frontend/.next/static
    COPY --from=frontend-builder /frontend/public ./frontend/public
    
    ENV PORT=3000
    EXPOSE 3000
    
    CMD ["node", "server.js"]

    