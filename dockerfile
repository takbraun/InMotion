FROM node:20-slim
WORKDIR /app

# install any native deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ && rm -rf /var/lib/apt/lists/*

# dependencies
COPY package*.json ./
RUN npm ci

# copy source & build
COPY . .
RUN npm run build

# >>> schema push happens here, while we still have network <<<
RUN npx drizzle-kit push

# expose port chosen by Render
EXPOSE $PORT

# start the compiled server
CMD ["npm", "start"]