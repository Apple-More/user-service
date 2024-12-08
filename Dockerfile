# Stage 1: Build the application
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies including devDependencies for building
RUN npm install

# Copy the source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the TypeScript application
RUN npm run build

# Stage 2: Create a lightweight image for production
FROM node:20-alpine AS release

# Set the working directory
WORKDIR /app

# Copy the required files from the builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Install only production dependencies
RUN npm install --omit=dev

# Generate Prisma client
RUN npx prisma generate

# Accept build arguments for PORT and DATABASE_URL
ARG PORT
ARG DATABASE_URL
ARG API_GATEWAY_URL
ARG JWT_SECRET
ARG JWT_REFRESH_SECRET
ARG JWT_EXPIRES_IN
ARG JWT_REFRESH_EXPIRES_IN

# Set environment variables
ENV PORT=${PORT}
ENV DATABASE_URL=${DATABASE_URL}
ENV API_GATEWAY_URL=${API_GATEWAY_URL}
ENV JWT_SECRET=${JWT_SECRET}
ENV JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
ENV JWT_EXPIRES_IN=${JWT_EXPIRES_IN}
ENV JWT_REFRESH_EXPIRES_IN=${JWT_REFRESH_EXPIRES_IN}

# Expose the application port
EXPOSE ${PORT}

# Start the application
CMD ["node", "dist/server.js"]
