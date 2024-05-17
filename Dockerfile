FROM ubuntu:latest

#update environment
RUN apt-get -y upgrade
RUN apt-get -y update
RUN apt-get -y --with-new-pkgs upgrade
RUN apt-get -y autoremove

#install curl
RUN apt-get -y install curl wget

#install chrome
RUN apt-get -y install lsb-release libappindicator3-1
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN dpkg -i google-chrome-stable_current_amd64.deb || true
RUN apt-get -fy install

RUN apt-get -y install npm
WORKDIR /app

#install node
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get -fy install nodejs
RUN node --version
RUN npm --version

COPY . .


RUN npm install
RUN chmod +x woocommerce-order-sync.js
RUN chmod +x orders-sync-from-db.js
CMD ["node", "./woocommerce-order-sync.js"]
