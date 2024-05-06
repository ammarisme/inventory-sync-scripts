FROM ubuntu:18.04

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
COPY . .
RUN npm install

CMD  ["woocommerce-order-sync.js"]



#install node
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt-get -y install nodejs
RUN node --version
RUN npm --version