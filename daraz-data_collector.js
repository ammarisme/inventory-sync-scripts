const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { Select } = require('selenium-webdriver');
const fs = require('fs');
const axios = require('axios');
const getDarazOrders = require('./read_daraz_file.js');

async function main(){
  const chromeOptions = new chrome.Options();
  const driver = new Builder()
  .forBrowser('chrome')
  .setChromeOptions(chromeOptions)
  .build();

  await driver.get('https://www.daraz.lk/cats-supplies/?page=1');

  driver.quit()

}
try{
  main();
}catch(error){
console.log(error)
}
