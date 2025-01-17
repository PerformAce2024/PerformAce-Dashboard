FROM node:20.8.1

# Set the working directory

WORKDIR /PerformAce-Dashboard
COPY package*.json ./
RUN npm install

# Copy the entire project directory into the container
COPY . .

# Install dependencies
RUN npm install

# Expose the port
EXPOSE 8000

# Start the application
CMD ["node", "Backend/index.js"]
