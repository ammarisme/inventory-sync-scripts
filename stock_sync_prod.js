const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { Select } = require('selenium-webdriver');
const fs = require('fs');
const axios = require('axios');
const { url } = require('inspector');
const nodeSchedule = require('node-schedule');
const {insertDocument, updateDocument, getCollectionBy, upsertDocument} = require('./mongo_functions.js');

async function main() {
  let run_id =  generateRandomNumberString();
  console.log(`run id ${run_id}`)

  // Initiate storemate in selenium
  const chromeOptions = new chrome.Options();
  // chromeOptions.addArguments('--headless');
  // chromeOptions.addArguments("--window-size=1920,1080")
  // chromeOptions.addArguments("--start-maximized")
  // chromeOptions.addArguments('--download-directory="C:\\Users\\Ammar Ameerdeen\\Downloads"');


  const driver = new Builder()
    .forBrowser('chrome')
    .setChromeOptions(chromeOptions)
    .build();

 // Login to storemate
  log("initiating storemate automation")
  await login(driver)

  //download the stock report for catlitter.lk
  await donwloadStock(driver, run_id)
  await driver.quit();

  available_stock = readCSV(`C:\\Users\\Ammar Ameerdeen\\Downloads\\${run_id}.csv`)  

  let total_products = 0
  let total_updated_products = 0
  //download the product stock from woocommerce
  let products = await fetchProductsFromWoocommerce();
  for(key in products){
    const  product = products[key];
    const sku_in_stock = '"'+product["sku"]+'"';
    const logfilename = `stock_update_log_${run_id}.csv`;

    const website_stock = !product["stock_quantity"] ?0 : product["stock_quantity"];
    const catlitter_stock = !available_stock[sku_in_stock]?0:available_stock[sku_in_stock]["Catlitter"]
    const wh_stock = !available_stock[sku_in_stock]?0:available_stock[sku_in_stock]["Warehouse"]

    let latest_stock = Number(catlitter_stock) + Number(wh_stock);
    if((product.type == "simple" || product.type == "variation") &&  available_stock[sku_in_stock] && product["sku"] > 0 
      && (website_stock != latest_stock)){
      switch (product.type) {
        case "variation":
          await UpdateStockOfProductVariation(product.parent_id, product.id, latest_stock)

          fs.appendFileSync(logfilename, generateLogMessage(
            "Updated", product.type, product.id, product.name, available_stock[sku_in_stock]["Product Name"], product.parent_id, website_stock, latest_stock, product["sku"]
          ), (err) => {
            if (err) throw err;
            console.log('Stock update operation logged successfully!');
          });
          total_updated_products++
          continue
        case "simple":
          await UpdateStockOfProduct(product.id, latest_stock)

          fs.appendFileSync(logfilename, generateLogMessage(
            "Updated", product.type, product.id, product.name, available_stock[sku_in_stock]["Product Name"], product.parent_id, website_stock, latest_stock, product["sku"]
          ), (err) => {
            if (err) throw err;
            console.log('Stock update operation logged successfully!');
          });
          total_updated_products++
          continue
        default:
          fs.appendFileSync(logfilename, generateLogMessage(
            "No Update", product.type, product.id, product.name, available_stock[sku_in_stock]["Product Name"], product.parent_id, website_stock, latest_stock, product["sku"]
          ), (err) => {
            if (err) throw err;
            console.log('No update!');
          });
          continue
      }
    } else if(product.type == "variable"){
      const variable_stock = getVariableStock(product, products,available_stock)
      if (variable_stock != website_stock){
        await UpdateStockOfProduct(product.id, variable_stock)
        fs.appendFileSync(logfilename,  generateLogMessage(
          "Updated", product.type, product.id, product.name , "" , product.parent_id, website_stock, variable_stock , product["sku"]
        ), (err) => {
          if (err) throw err;
          console.log('Stock update operation logged successfully!');
        });
        total_updated_products++
        continue
      }else{
        fs.appendFileSync(logfilename, generateLogMessage(
          "Stock in Sync", product.type, product.id, product.name , available_stock[sku_in_stock]["Product Name"] , product.parent_id, website_stock, latest_stock, product["sku"]
        ), (err) => {
          if (err) throw err;
          console.log('No update!');
        });
        continue
      }
    }
    else if(!product["sku"] ||  !isNumber(product["sku"])){
      fs.appendFileSync(logfilename, generateLogMessage(
        "No SKU", product.type, product.id, product.name , "" , product.parent_id, website_stock, latest_stock , ""
      ), (err) => {
        if (err) throw err;
        console.log('No update!');
      });
      continue
    }
    else if(!available_stock[sku_in_stock]){
      fs.appendFileSync(logfilename, generateLogMessage(
        "Error :available_stock", product.type, product.id, product.name , "" , product.parent_id, website_stock, latest_stock, product["sku"]
      ), (err) => {
        if (err) throw err;
        console.log('No update!');
      });
      continue;
    }
    else if((website_stock == latest_stock)){
      fs.appendFileSync(logfilename, generateLogMessage(
        "Stock in Sync", product.type, product.id, product.name , available_stock[sku_in_stock]["Product Name"] , product.parent_id, website_stock, latest_stock, product["sku"]
      ), (err) => {
        if (err) throw err;
        console.log('No update!');
      });
      continue
    }else{
      fs.appendFileSync(logfilename, generateLogMessage(
        "Other", product.type, product.id, product.name , "" , product.parent_id, website_stock, latest_stock, ""
      ), (err) => {
        if (err) throw err;
        console.log('No update!');
      });
      continue;
    }
  }

  insertDocument("stock_sync",{
    run_id : run_id,
    updated_products : total_updated_products,
    total_products : total_products
  });
  log("completed")
}
function isNumber(string) {
  const numberRegex = /^\d+$/;
  return numberRegex.test(string);
}

function getVariableStock(varproduct, products, available_stock){
  let stock = 0
  for (i=0;i<varproduct.variations.length;i++){
    let variation = products.find(product => product.id=== varproduct.variations[i])

    const sku_in_stock = '"'+variation["sku"]+'"';

    const website_stock = !variation["stock_quantity"] ?0 : variation["stock_quantity"];
    const catlitter_stock = !available_stock[sku_in_stock]?0:available_stock[sku_in_stock]["Catlitter"]
    const wh_stock = !available_stock[sku_in_stock]?0:available_stock[sku_in_stock]["Warehouse"]

    stock += (Number(catlitter_stock)+Number(wh_stock))

  }
}

function generateLogMessage(row_type, type, id, name, storemate_name, parent_id, website_stock, latest_stock, sku){
  const updateOperation = `${row_type}, ${type} ,${sku}, ${id},${name}, ${storemate_name} , ${parent_id}, ${website_stock}, ${latest_stock}\n`;
  return updateOperation;
}

function generateRandomNumberString(length = 5) {
  // Create an array of digits (0-9)
  const digits = '0123456789';

  // Use a loop to build the random string
  let result = '';
  for (let i = 0; i < length; i++) {
    result += digits[Math.floor(Math.random() * digits.length)];
  }

  return result;
}

// Run the automation function
function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  // Adjust format as desired (e.g., 24-hour, AM/PM)
  const formattedTime = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  console.log("Current time:", formattedTime);
}


async function UpdateStockOfProduct(id, stockQuantity) {
  // Call the PUT API to update the stock quantity
  const apiUrl = `https://catlitter.lk/wp-json/wc/v3/products/${id}`;
  const putData = {
    stock_quantity: stockQuantity
  };
  while(true){

  try {
    const putResponse = await axios.put(apiUrl, putData, {
      headers: {
        Authorization: 'Basic Y2tfNDdjMzk3ZjNkYzY2OGMyY2UyZThlMzU4YjdkOWJlYjZkNmEzMTgwMjpjc19kZjk0MDdkOWZiZDVjYzE0NTdmMDEwNTY3ODdkMjFlMTAyZmUwMTJm',  // Replace 'asd' with your actual authorization code
        'Content-Type': 'application/json'
      }
    });

    console.log(`Stock quantity updated successfully for ID: ${id}`);
    return
  } catch (error) {
    console.error(`Failed to update stock quantity for ID: ${id}`, error);
  }
}
}

function log(str){
console.log('log: ' + str)
}
async function UpdateStockOfProductVariation(parent_id, product_id, stockQuantity) {
  // Call the PUT API to update the stock quantity
  const apiUrl = `https://catlitter.lk/wp-json/wc/v3/products/${parent_id}/variations/${product_id}`;
  log(apiUrl)
  const putData = {
    stock_quantity: stockQuantity
  };
  while(true){
  try {
    const putResponse = await axios.put(apiUrl, putData, {
      headers: {
        Authorization: 'Basic Y2tfNDdjMzk3ZjNkYzY2OGMyY2UyZThlMzU4YjdkOWJlYjZkNmEzMTgwMjpjc19kZjk0MDdkOWZiZDVjYzE0NTdmMDEwNTY3ODdkMjFlMTAyZmUwMTJm',  // Replace 'asd' with your actual authorization code
        'Content-Type': 'application/json'
      }
    });

    console.log(`Stock quantity updated successfully for SKU: ${parent_id}`);
    return;
  } catch (error) {
    console.error(`Failed to update stock quantity for SKU: ${parent_id}`, error);
  }
}
}

async function callApi(page) {
  while(true){
  try {
    const url = 'https://catlitter.lk/wp-json/wc/v3/products?per_page=100&page=' + page;
    log(url)
    const headers = {
      Authorization: 'Basic Y2tfNDdjMzk3ZjNkYzY2OGMyY2UyZThlMzU4YjdkOWJlYjZkNmEzMTgwMjpjc19kZjk0MDdkOWZiZDVjYzE0NTdmMDEwNTY3ODdkMjFlMTAyZmUwMTJm',
    };

    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
console.log(error)
}
}
}

async function getProduct(id) {
  while(true){
  try {
    const url = 'https://catlitter.lk/wp-json/wc/v3/products/' + id;
    log(url)
    const headers = {
      Authorization: 'Basic Y2tfNDdjMzk3ZjNkYzY2OGMyY2UyZThlMzU4YjdkOWJlYjZkNmEzMTgwMjpjc19kZjk0MDdkOWZiZDVjYzE0NTdmMDEwNTY3ODdkMjFlMTAyZmUwMTJm',
    };

    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    console.log(error)
  }
}
}

async function fetchProductsFromWoocommerce() {
  
  let products = [];

  try {
    for (let i = 1; i < 1000; i++) {
      // Your loop body goes here
      const apiData = await callApi(i);
      if (apiData == null || apiData.length === 0) {
        break;
      } else {
        products = products.concat(apiData); // Assign the result back to 'products'
      }
    }

    log("fetching variations");
    // let k = 0;
    for (let rowIndex = 0; rowIndex < products.length; rowIndex++) {
      let product = products[rowIndex];
      let stock = 0;
      if (product.variations && product.variations != null && product.variations.length > 0) {
        for (let var_row = 0; var_row < product.variations.length; var_row++) {
          const var_product = await getProduct(product.variations[var_row]);
          products = products.concat([var_product]);
          stock+=Number(var_product.stock_quantity)
          // k++
        }
      }
      // products[rowIndex].stock_quantity = stock;
      // if (k > 20){
      //   break
      // }
    }
  } catch (error) {
    console.log(error)
  }
  return products;
}

async function login(driver) {
  await driver.get('https://app.storematepro.lk/login');

  // Step 2: Fill in the username field
  await driver.findElement(By.id('username')).sendKeys('NASEEF');

  // Step 3: Fill in the password field
  await driver.findElement(By.id('password')).sendKeys('80906');

  // Step 4: Click the login button
  await driver.findElement(By.className('btn btn-lg btn-primary btn-block rounded-pill')).click();

  // Step 5: Wait until redirected to the home page
  await driver.wait(until.urlIs('https://app.storematepro.lk/home'), 10000);
}

async function donwloadStock(driver, run_id) {
  try {

    // Step 6: Go to the stock report page
    await driver.get('https://app.storematepro.lk/reports/location-wise-stock-reports');

    await driver.sleep(5000);

    const pageLengthDropdown = await driver.findElement(By.name('location_stock_table_length'));
    const pageLengthSelect = new Select(pageLengthDropdown);
    await pageLengthSelect.selectByValue('-1');

    
    // Find the parent div with class "dt-buttons btn-group"
    const parentDiv = await driver.findElement(By.className('dt-buttons btn-group'));

    // Find all child elements of the parent div
    const childElements = await parentDiv.findElements(By.xpath('./*'));
    await driver.sleep(5000);
    // Click the first child element
    if (childElements.length > 0) {      
      while(true){
        try{
          childElements[0].click();
          await driver.sleep(1000);
          fs.renameSync("C:\\Users\\Ammar Ameerdeen\\Downloads\\Location Wise Stock Report - PET  CO.csv", `C:\\Users\\Ammar Ameerdeen\\Downloads\\${run_id}.csv`)
          log("downloaded :  location_wise_stock" )
          break;
        }catch(error){
          console.log(error)
        }
        
      }
      
    }
  } catch (error) {
    console.log(error)
  }finally{
  }
}

function readCSV(filePath){
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const rows = fileContent.trim().split('\n');
  const header = rows[0].split(',');
  const data = rows.slice(1).map(row => row.split(','));

  const groupedData = {};

  data.forEach(row => {
      const key = row[2];

      const rowData = {};
      header.forEach((col, index) => {
        rowData[col.trim().replace(/"/g, '')] = row[index].trim().replace(/"/g, '');  
      });
      groupedData[key] = rowData;
  });

  // fs.unlink(filePath);
  // console.log(`File ${filePath} deleted successfully!`);
  
  return groupedData;
}




// function runJob() {
//   console.log("start : runs every 21:00");
//   nodeSchedule.scheduleJob('* 8 * * *', function () { 
//     getCurrentTime()
//     main()
//   });
// }


function runJob() {
  const schedule = '30 */2 * * *'
  console.log(`start : run schedule ${schedule}`)
  nodeSchedule.scheduleJob(schedule, function () { 
    try{
    getCurrentTime()
    main()
    }catch(error){
      log(error)
      log("---------------------------------------------------------------")
    }
  })
}

main()
runJob()
