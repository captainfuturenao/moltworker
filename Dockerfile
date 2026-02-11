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
# Ensure Unix line endings (Fix for Windows-edited files)
RUN sed -i 's/\r$//' /root/clawd/start-openclaw.sh
RUN chmod +x /root/clawd/start-openclaw.sh

# Copy custom skills
COPY skills/ /root/clawd/skills/

# Build cache bust: 2026-02-11-v82-comprehensive-fix
# This ensures a fresh build and container restart
RUN echo "Cache bust v82"

# Copy configuration generator script
COPY configure.js /root/clawd/configure.js

# Expose port
EXPOSE 3000

# Entrypoint
CMD ["/root/clawd/start-openclaw.sh"]
