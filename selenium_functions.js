const { Builder, By, Key, until } = require('selenium-webdriver');
const firefox  = require('selenium-webdriver/firefox');
const chrome = require('selenium-webdriver/chrome');
const { Select } = require('selenium-webdriver');
const fs = require('fs');
const {log} = require('./common/utils.js')



function getChromeDriver(headeless){
    if(headeless){
      const chromeOptions = new chrome.Options()
      chromeOptions.addArguments('--headless')
      chromeOptions.addArguments('--no-sandbox')
      chromeOptions.addArguments('--disable-dev-shm-usage')
      chromeOptions.addArguments('--disable-gpu')
      chromeOptions.addArguments('--window-size=1280x800')
      chromeOptions.addArguments('--disable-setuid-sandbox')
      // chromeOptions.addArguments('--remote-debugging-port=9222')
      // chromeOptions.addArguments("--window-size=1920,1080")
      chromeOptions.addArguments("--start-maximized")
      chromeOptions.addArguments('--download-directory="C:\\Users\\Ammar Ameerdeen\\Downloads"')
      chromeOptions.addArguments('--disable-logging'); // Disable most ChromeDriver logging
      chromeOptions.addArguments('--log-level=3');     // Set minimum logging level (3: only fatal errors)
      const driver = new Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .build()
      return driver
    }else{
      const chromeOptions = new chrome.Options()
      chromeOptions.addArguments('--disable-logging'); // Disable most ChromeDriver logging
      chromeOptions.addArguments('--log-level=3');     // Set minimum logging level (3: only fatal errors)
      chromeOptions.addArguments("--start-maximized")
      const driver = new Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .build()
      return driver
    }
  }

  function getFirefoxDriver(headless) {
    const firefoxOptions = new firefox.Options();
    if (headless) {
      firefoxOptions.headless();
    }
    firefoxOptions.addArguments("--window-size=1920,1080");
    firefoxOptions.addArguments("--start-maximized");
    firefoxOptions.addArguments('--disable-logging'); // Disable most GeckoDriver logging
    firefoxOptions.addArguments('--log-level=3');     // Set minimum logging level (3: only fatal errors)
    
    const driver = new Builder()
      .forBrowser('firefox')
      .setFirefoxOptions(firefoxOptions)
      .build();
    
    return driver;
  }

  async function donwloadStock(driver, run_id) {
    try {
  
      // Step 6: Go to the stock report page
      await driver.get('https://app.storematepro.lk/reports/location-wise-stock-reports')
  
      await driver.sleep(5000)
  
      const pageLengthDropdown = await driver.findElement(By.name('location_stock_table_length'))
      const pageLengthSelect = new Select(pageLengthDropdown)
      await pageLengthSelect.selectByValue('-1')
  
  
      // Find the parent div with class "dt-buttons btn-group"
      const parentDiv = await driver.findElement(By.className('dt-buttons btn-group'))
  
      // Find all child elements of the parent div
      const childElements = await parentDiv.findElements(By.xpath('./*'))
      await driver.sleep(5000)
      // Click the first child element
      if (childElements.length > 0) {
        while (true) {
          try {
            childElements[0].click()
            await driver.sleep(1000)
            fs.renameSync("C:\\Users\\Ammar Ameerdeen\\Downloads\\Location Wise Stock Report - PET  CO.csv", `C:\\Users\\Ammar Ameerdeen\\Downloads\\${run_id}.csv`)
            log("downloaded :  location_wise_stock")
            break
          } catch (error) {
            console.log(error)
          }
  
        }
  
      }
    } catch (error) {
      console.log(error)
    } finally {
    }
  }
  

  
async function loginStoreMate(driver) {
    try {
      console.log("logging in")
  
      // Step 1: Go to the login page
      await driver.get('https://app.storematepro.lk/login');
  
      // Step 2: Fill in the username field
      await driver.findElement(By.id('username')).sendKeys('NASEEF');
  
      // Step 3: Fill in the password field
      await driver.findElement(By.id('password')).sendKeys('80906');
  
      // Step 4: Click the login button
      await driver.findElement(By.className('btn btn-lg btn-primary btn-block rounded-pill')).click();
  
      // Step 5: Wait until redirected to the home page
      await driver.wait(until.urlIs('https://app.storematepro.lk/home'), 1000);

      const cookies = await driver.manage().getCookies();
      return cookies;
  
    } catch (error) {
      console.log(error)
    }
  }
  function extractCookies(cookies) {
    const cookieMap = {};
    cookies.forEach(cookie => {
      if (cookie.name === 'XSRF-TOKEN' || cookie.name === 'storemate_pro_session') {
        cookieMap[cookie.name] = cookie.value;
      }
    });
    return cookieMap;
  }

  module.exports = {
    getChromeDriver,
    donwloadStock,
    loginStoreMate,
    getFirefoxDriver,
    extractCookies
  }