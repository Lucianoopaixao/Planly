# Multi-stage: build com Vite, sirva com vite preview (suficiente pra dev/demo)
FROM node:20-alpine
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
