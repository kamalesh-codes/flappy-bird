FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY src/package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy the rest of the application code
COPY src .

# Expose the port the server runs on
EXPOSE 3000

# Start the application
CMD ["node", "server/server.js"]
