FROM node:24-alpine AS base
WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc pnpm-workspace.yaml ./
COPY ./patches ./patches

RUN npm install -g pnpm

FROM base AS build

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

RUN pnpm prune --prod

FROM base AS production

COPY --from=build /app/dist .
COPY --from=build /app/node_modules ./node_modules

ENV NODE_ENV="production"
ENV ADDON_DIR="/addon"
EXPOSE 3000 3443 6881

CMD ["node", "./server.js"]
