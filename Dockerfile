# Base image
FROM node:20-slim

# Install minimal system dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install OpenClaw globally
RUN npm install -g openclaw@latest && \
    npm cache clean --force

# Set working directory
WORKDIR /root/clawd

# Copy necessary files
COPY start-openclaw.sh /root/clawd/start-openclaw.sh
COPY configure.js /root/clawd/configure.js
RUN chmod +x /root/clawd/start-openclaw.sh

# Expose port
EXPOSE 3000

# v124: Strong Entrypoint
ENTRYPOINT ["/bin/sh", "/root/clawd/start-openclaw.sh"]
