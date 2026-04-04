FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install && npm ci --omit=dev

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]