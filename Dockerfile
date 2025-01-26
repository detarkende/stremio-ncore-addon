FROM node:20.16.0-bookworm-slim AS base
WORKDIR /app

RUN npm install -g pnpm

ARG CERT_FILE
ARG KEY_FILE
ARG SSL_AUTH_FILE

COPY package.json pnpm-lock.yaml .npmrc pnpm-workspace.yaml ./
COPY ./patches ./patches
COPY ./server/package.json ./server/package.json
COPY ./client/package.json ./client/package.json
COPY ${CERT_FILE} ./server/certificate.crt
COPY ${KEY_FILE} ./server/private.key
COPY ${SSL_AUTH_FILE} ./server/ssl_auth.txt


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
ENV ADDON_DIR="/addon"
EXPOSE 3000
CMD ["pnpm", "start"]
