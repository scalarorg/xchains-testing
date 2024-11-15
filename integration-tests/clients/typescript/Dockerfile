FROM oven/bun:1

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src

RUN bun install
RUN bun run build

EXPOSE 3000

CMD ["bun", "start"]