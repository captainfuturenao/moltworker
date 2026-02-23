# Base image
FROM node:22-slim

# Force rebuild trigger v144
ENV REBUILD_DATE=2026-02-13

# Install dependencies, OpenClaw, and cleanup build tools in a single layer to save space
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git \
    python3 \
    make \
    g++ \
    && npm install -g openclaw@latest \
    && npm cache clean --force \
    && apt-get remove -y python3 make g++ \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

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
