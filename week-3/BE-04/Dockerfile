FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src/ src/
COPY init.sql .
EXPOSE 3000
CMD ["node_modules/.bin/tsx", "src/index.ts"]
