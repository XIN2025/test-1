FROM node:22.16.0-slim AS base

WORKDIR /app

COPY package*.json ./

RUN npm ci --ignore-scripts

COPY . .

RUN npm run build

CMD ["npm", "run", "start"]