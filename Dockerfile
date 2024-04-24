# Use an official Node.js runtime as a parent image
FROM node:latest

# Install Firefox and GeckoDriver for Selenium
RUN apt-get update && \
    apt-get install -y firefox-esr && \
    apt-get clean

# Download the latest version of GeckoDriver and install it to /usr/local/bin
RUN apt-get install -y curl && \
    curl -sSL https://github.com/mozilla/geckodriver/releases/download/v0.30.0/geckodriver-v0.30.0-linux64.tar.gz | tar -xz -C /usr/local/bin

# Set the working directory in the container to /app
WORKDIR /app

# Copy the current directory contents into the container at /app

COPY . /app
# Install any needed dependencies specified in package.json
RUN npm install

# Expose the port the app runs on
EXPOSE 3001

# Run the node server
CMD ["node", "orders-sync-from-db.js"]