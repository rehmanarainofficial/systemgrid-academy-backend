FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

FROM node:24-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN addgroup -S nodeapp && adduser -S nodeapp -G nodeapp
RUN mkdir -p /app/uploads && chown -R nodeapp:nodeapp /app

USER nodeapp

EXPOSE 5000

CMD ["node", "dist/main.js"]
