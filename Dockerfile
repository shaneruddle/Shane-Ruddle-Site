# Production stage only - frontend is pre-built in CI
FROM node:20-alpine AS runner

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy pre-built frontend from CI and server code
COPY dist ./dist
COPY server.ts ./server.ts
COPY public ./public

# Install tsx to run TypeScript server directly
RUN npm install tsx --save-dev

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["npx", "tsx", "server.ts"]
