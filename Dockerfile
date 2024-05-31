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
RUN chmod +x woocommerce-order-sync.js
RUN chmod +x orders-sync-from-db.js

# Chrome options
ENV CHROME_BIN=/usr/bin/google-chrome
ENV CHROME_PATH=/usr/bin/google-chrome

# Set Chrome to run without sandbox (necessary for some environments)
RUN google-chrome-stable --version

# Entry point
CMD ["node", "./orders-sync-from-db.js"]


# FROM ubuntu:latest

# #update environment
# RUN apt-get -y upgrade
# RUN apt-get -y update
# RUN apt-get -y --with-new-pkgs upgrade
# RUN apt-get -y autoremove

# #install curl
# RUN apt-get -y install curl wget

# #install chrome
# RUN apt-get -y install lsb-release libappindicator3-1
# RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
# RUN dpkg -i google-chrome-stable_current_amd64.deb || true
# RUN apt-get -fy install

# RUN apt-get -y install npm
# WORKDIR /app

# #install node
# RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -
# RUN apt-get -fy install nodejs
# RUN node --version
# RUN npm --version

# COPY . .

# RUN npm install
# RUN chmod +x woocommerce-order-sync.js
# RUN chmod +x orders-sync-from-db.js
# CMD ["node", "./orders-sync-from-db.js"]