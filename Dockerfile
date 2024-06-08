FROM ubuntu:latest

# Update environment
RUN apt-get -y update && apt-get -y upgrade

# Install curl and other utilities
RUN apt-get -y install curl wget gnupg

# Add Google's official GPG key
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -

# Add Google Chrome repository
RUN sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'

# Update and install Chrome
RUN apt-get -y update && apt-get -y install google-chrome-stable

# Install npm and node.js
RUN apt-get -y install npm
WORKDIR /app

# Install Node.js
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get -y install nodejs
RUN node --version
RUN npm --version

# Copy application code
COPY . .

# Install dependencies
RUN npm install
RUN chmod +x stock_sync_prod.js

# Chrome options
ENV CHROME_BIN=/usr/bin/google-chrome
ENV CHROME_PATH=/usr/bin/google-chrome

# Set Chrome to run without sandbox (necessary for some environments)
RUN google-chrome-stable --version

# Entry point
CMD ["node", "./stock_sync_prod.js"]