# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
COPY . .

FROM base AS build
RUN npm ci
RUN npm run build

FROM base AS prod-deps
RUN npm ci --omit=dev

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/.output ./.output
COPY --from=build /app/server/db ./server/db
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/package.json ./package.json
COPY docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
