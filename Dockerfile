FROM node:22-alpine3.23 AS node-base
WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc pnpm-workspace.yaml ./
COPY ./patches ./patches
COPY ./server/package.json ./server/package.json
COPY ./client/package.json ./client/package.json


FROM node-base AS build-base
RUN npm install -g pnpm

FROM build-base AS prod-deps
RUN pnpm --config.inject-workspace-packages=true deploy --filter server --prod server/deps

FROM build-base AS build-deps
RUN pnpm install

FROM build-deps AS build
COPY . .
RUN pnpm run build

FROM node-base AS runtime
COPY --from=prod-deps /app/server/deps/node_modules ./node_modules

COPY --from=build /app/client/dist ./client/dist
COPY --from=build /app/server/dist ./server/dist

ENV NODE_ENV="production"
ENV ADDON_DIR="/addon"
EXPOSE 3000 3443

CMD ["node", "./server/dist/index.js"]
