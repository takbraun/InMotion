# Node 20 slim image Render loves
FROM node:20-slim

# 1. install build tools for any native deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. install dependencies
COPY package*.json ./
RUN npm ci

# 3. copy source + build frontend & backend
COPY . .
RUN npm run build

# 4. push Drizzle schema to DB (runs at container-start)
#    Render gives us DATABASE_URL automatically
RUN npx drizzle-kit push

# 5. expose port (Render sets PORT env var)
EXPOSE $PORT

# 6. start the compiled server
CMD ["npm", "start"]