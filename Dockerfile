# Use official Node.js image as the base
FROM node:18-alpine

# Set the working directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies (including global dependencies)
RUN npm install
RUN npm install -g typescript ts-node

# Copy the rest of the application files
COPY . .

# Compile TypeScript
RUN tsc  # This will compile the TypeScript files to the 'dist/' directory

# Expose the application port (adjust if necessary)
EXPOSE 8080

# Define the command to run the app
CMD ["node", "dist/index.js"]  # Adjust 'dist/index.js' if your entry file is different
