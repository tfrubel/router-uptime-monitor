FROM node:22-trixie AS deps

RUN apt-get update && apt-get install -y \
  bash \
  python3 \
  make \
  g++ \
  sqlite3 \
  iputils-ping \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install


FROM deps AS builder

COPY . .
RUN NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS="--max-old-space-size=4096" npm run build


FROM node:22-trixie AS runner

RUN apt-get update && apt-get install -y \
  bash \
  python3 \
  make \
  g++ \
  sqlite3 \
  iputils-ping \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "run", "start"]
