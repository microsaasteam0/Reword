FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code (excluding .env.local files)
COPY . .
RUN rm -f .env.local .env*.local

# Set build-time environment variables for production
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=http://snippetstream-api.eastus.azurecontainer.io

# Build the application with environment variables
RUN npm run build

# Expose port
EXPOSE 80

# Set runtime environment variables
ENV PORT=80
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["npm", "start"]