# Use the official Node.js image as the base image
FROM node:bullseye

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json files to the working directory
COPY package*.json ./

# Install the application dependencies
RUN npm install -g npm@9.6.4 && \
    npm install -g pm2 &&\
    npm install

# Copy the application source code to the working directory
COPY . .

# Start the application
CMD ["pm2-runtime", "index.js"]