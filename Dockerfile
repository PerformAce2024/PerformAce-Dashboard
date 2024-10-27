FROM node:20.8.1

# Set the working directory
WORKDIR /Backend

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Copy .env file
COPY .env ./

# Expose the port
EXPOSE 8000

# Start the application
CMD ["npm", "start"]
