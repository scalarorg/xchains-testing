# Step 1: Build the application
FROM node:20-alpine3.19 AS builder

# Install necessary build tools
RUN apk add python3 make gcc g++

# Copy xchains-bitcoin-ts
WORKDIR /app
COPY xchains-bitcoin-ts ./xchains-bitcoin-ts

WORKDIR /app/xchains-bitcoin-ts
# Use npm instead of yarn for consistency
RUN npm install

# Copy package files and install dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile
# COPY package.json ./
# RUN npm install

# Create dir .bitcoin/accounts; .bitcoin/scheduled in working dir
RUN mkdir -p .bitcoin/accounts .bitcoin/scheduled

# Copy the rest of the application code
COPY prisma ./prisma
COPY src ./src
COPY next.config.mjs .
COPY postcss.config.mjs .
COPY tsconfig.json .
COPY tailwind.config.ts .
COPY .eslintrc.json .
COPY .env.build ./.env
COPY tsconfig.server.json .

# Add this step before running the build
RUN npx prisma generate

# Then run the build
RUN npm run build

# Copy tsconfig.server.json

# Step 2: Create the production image
FROM node:20-alpine3.19 AS runner

# Install necessary runtime dependencies and curl
RUN apk add --no-cache jq curl

WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/next.config.mjs ./
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist

# Copy the xchains-bitcoin-ts directory and its node_modules
COPY --from=builder --chown=nextjs:nodejs /app/xchains-bitcoin-ts ./xchains-bitcoin-ts

# Install production dependencies and generate Prisma client
RUN npm ci --only=production && \
    npx prisma generate

# Ensure nextjs user owns the app directory
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Expose the port the app runs on
EXPOSE 3002
