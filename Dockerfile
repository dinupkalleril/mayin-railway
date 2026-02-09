FROM node:20-alpine

WORKDIR /app

COPY aio-backend/package*.json ./
RUN npm install --production

COPY aio-backend .

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "run", "start"]
