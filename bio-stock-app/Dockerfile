# Runs the Expo web build for a fully browser-runnable demo.
# Native iOS/Android still run on the host (see README) — Metro can't reach a
# device/emulator from inside a container.
FROM node:20-slim

WORKDIR /app

# Install dependencies first for layer caching.
COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# API the browser should call. Overridden by docker-compose.
ENV EXPO_PUBLIC_API_URL=http://localhost:8000
ENV CI=1

# Metro (8081) + Expo web (19006).
EXPOSE 8081 19006

CMD ["npx", "expo", "start", "--web", "--port", "19006"]
