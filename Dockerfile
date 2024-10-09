FROM node:20.16.0-bookworm-slim AS base
WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml .npmrc pnpm-workspace.yaml ./
COPY ./patches ./patches
COPY ./server/package.json ./server/package.json
COPY ./client/package.json ./client/package.json


FROM base AS prod-deps
RUN pnpm install --prod


FROM base AS build-deps
RUN pnpm install

FROM build-deps AS build
COPY . .
RUN pnpm run build

FROM base AS runtime
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

VOLUME [ "/torrents", "/downloads" ]

ENV NODE_ENV="production"
ENV TORRENTS_DIR="/torrents"
ENV DOWNLOADS_DIR="/downloads"

EXPOSE 3000
CMD ["node", "dist/server/index.js"]
