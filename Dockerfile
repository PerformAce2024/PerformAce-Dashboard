FROM node:20.8.1

# Set the working directory
WORKDIR /app/Backend

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .


# Expose the port
EXPOSE 8000

# Start the application
CMD ["node", "index.js"]