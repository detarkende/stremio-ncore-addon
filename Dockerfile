# Build stage
FROM node:20.11.1-bookworm AS builder
WORKDIR /app
COPY package*.json ./
COPY ./patches ./patches
RUN npm install
COPY . .
RUN npm run build
RUN apt-get update && apt-get install -y \
    build-essential \
    python3
COPY config.json ./config.json

EXPOSE 3000
CMD ["npm", "run", "start"]
