FROM node:20.16.0-alpine as base
WORKDIR /app

COPY package.json package-lock.json ./
COPY ./patches ./patches

RUN apk add --no-cache g++ make py3-pip

FROM base AS prod-deps
RUN npm install --omit=dev 


FROM base AS build-deps
RUN npm install

FROM build-deps AS build
COPY . .
RUN npm run build

FROM base AS runtime
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

VOLUME [ "/torrents", "/downloads" ]

ENV TORRENTS_DIR="/torrents"
ENV DOWNLOADS_DIR="/downloads"

EXPOSE 3000
CMD node dist/index.js
