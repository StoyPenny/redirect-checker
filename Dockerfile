# Use Node.js 22 Alpine for optimal size and performance
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for Vite)
RUN npm ci

# Copy application source code
COPY . .

# Expose the development server port
EXPOSE 11248

# Start the Vite development server
CMD ["npm", "run", "dev"]
