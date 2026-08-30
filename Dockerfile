# Production stage only - frontend is pre-built in CI
FROM node:20-alpine AS runner

WORKDIR /app

# The inherited lockfile is not currently in sync with package.json, so use the
# same install mode as CI until the lockfile is repaired in a dedicated change.
COPY package*.json ./
RUN npm install --omit=dev

# Copy pre-built frontend from CI and server code
COPY dist ./dist
COPY server.ts ./server.ts
COPY server ./server
COPY public ./public

# Install tsx to run TypeScript server directly
RUN npm install tsx --save-dev

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["npx", "tsx", "server.ts"]
