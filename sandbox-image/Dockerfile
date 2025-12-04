FROM node:18

# Create sandbox directory for user projects
RUN mkdir -p /sandbox
WORKDIR /sandbox

# Install Next.js globally (so users don't need to install it)
RUN npm install -g next

# Copy package.json + package-lock.json into /agent
COPY package*.json /agent/

# Copy agent code into /agent
COPY agent /agent

# Install dependencies for the agent
WORKDIR /agent
RUN npm install

# Expose the agent server port
EXPOSE 3000

# Run the agent server
CMD ["node", "server.js"]
