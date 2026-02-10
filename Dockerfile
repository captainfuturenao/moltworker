# Base image
FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install OpenClaw globally
RUN npm install -g openclaw@latest

# Set working directory
WORKDIR /root/clawd

# Copy startup script
COPY start-openclaw.sh /root/clawd/start-openclaw.sh
RUN chmod +x /root/clawd/start-openclaw.sh

# Copy custom skills
COPY skills/ /root/clawd/skills/

# Build cache bust: 2026-02-10-v77-fix-agent-crash
# This ensures a fresh build and container restart
RUN echo "Cache bust v77"

# Copy configuration generator script
COPY configure.js /root/clawd/configure.js

# Expose port
EXPOSE 18789

# Entrypoint
CMD ["/root/clawd/start-openclaw.sh"]
