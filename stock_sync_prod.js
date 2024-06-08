const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { Select } = require('selenium-webdriver');
const fs = require('fs');
const axios = require('axios');
const { url } = require('inspector');
const nodeSchedule = require('node-schedule');
const {insertDocument, updateDocument, getCollectionBy, upsertDocument} = require('./mongo_functions.js');
const { availableParallelism } = require('os');
const { loginStoreMate, getChromeDriver } = require('./selenium_functions.js');

async function main() {
  let run_id =  generateRandomNumberString();
  log(`run id ${run_id}`)

  const driver = getChromeDriver(true); // Headless Chrome
 // Login to storemate
  log("initiating storemate automation")
  await loginStoreMate(driver)

  //download the stock report for catlitter.lk
  const file_path =  `./location_wise_stock.csv`
  await downloadStock(driver,file_path)
  // await driver.quit();

  //return
  available_stock = readCSV(file_path)  
  await fs.unlinkSync(file_path);

  let total_products = 0
  let total_updated_products = 0
  //download the product stock from woocommerce
  log("fetching products : "+ available_stock.length)
  let products = await fetchProductsFromWoocommerce();
  log("updating products : "+ products.length)
  for (key in products) {
    const product = products[key];
    const sku_in_stock = `"${product["sku"]}"`;
  
    const website_stock = product["stock_quantity"] || 0;
    const catlitter_stock = available_stock[sku_in_stock]?.["Catlitter"] || 0;
    const wh_stock = available_stock[sku_in_stock]?.["Warehouse"] || 0;
  
    let latest_stock = Number(catlitter_stock) + Number(wh_stock) - 3;
    latest_stock = latest_stock > 0 ? latest_stock : 0;

  
    if (!product["sku"] || !isNumber(product["sku"])) {
      continue;
    }
  
    if (product.type === "simple" || product.type === "variation") {
      if (product["sku"] > 0 && website_stock != latest_stock) {
        if (product.type === "variation") {
          await UpdateStockOfProductVariation(product.parent_id, product.id, latest_stock);
        } else {
          await UpdateStockOfProduct(product.id, latest_stock);
        }
        total_updated_products++;
      }
    } else if (product.type === "variable") {
      const variable_stock = getVariableStock(product, products, available_stock);
      if (variable_stock != website_stock) {
        await UpdateStockOfProduct(product.id, variable_stock);
        total_updated_products++;
      }
    }
  }
  log("update done")

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

    let variation_stock = (Number(catlitter_stock)+Number(wh_stock)) - 3
    stock +=  (variation_stock > 0 ? variation_stock : 0);

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
  log("Current time:", formattedTime);
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

    // log(`Stock quantity updated successfully for ID: ${id}`);
    return
  } catch (error) {
    console.error(`Failed to update stock quantity for ID: ${id}`, error);
  }
}
}

function log(str){
console.log(str)
}
async function UpdateStockOfProductVariation(parent_id, product_id, stockQuantity) {
  // Call the PUT API to update the stock quantity
  const apiUrl = `https://catlitter.lk/wp-json/wc/v3/products/${parent_id}/variations/${product_id}`;
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

    // log(`Stock quantity updated successfully for SKU: ${parent_id}`);
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
    const headers = {
      Authorization: 'Basic Y2tfNDdjMzk3ZjNkYzY2OGMyY2UyZThlMzU4YjdkOWJlYjZkNmEzMTgwMjpjc19kZjk0MDdkOWZiZDVjYzE0NTdmMDEwNTY3ODdkMjFlMTAyZmUwMTJm',
    };

    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
log(error)
}
}
}

async function getProduct(id) {
  while(true){
  try {
    const url = 'https://catlitter.lk/wp-json/wc/v3/products/' + id;
    const headers = {
      Authorization: 'Basic Y2tfNDdjMzk3ZjNkYzY2OGMyY2UyZThlMzU4YjdkOWJlYjZkNmEzMTgwMjpjc19kZjk0MDdkOWZiZDVjYzE0NTdmMDEwNTY3ODdkMjFlMTAyZmUwMTJm',
    };

    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    log(error)
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
    log(error)
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

async function downloadStock(driver, file_path) {
  try {
    // Step 1: Go to the stock report page
    await driver.get('https://app.storematepro.lk/reports/location-wise-stock-reports');
    await driver.sleep(5000);

    // Step 2: Set the table length to display all rows
    const pageLengthDropdown = await driver.findElement(By.name('location_stock_table_length'));
    const pageLengthSelect = new Select(pageLengthDropdown);
    await pageLengthSelect.selectByValue('-1');
    await driver.sleep(5000);

    // Step 3: Extract the table header
    const headers = await driver.findElements(By.css('#location_stock_table thead th'));
    const headerTexts = [];
    for (const header of headers) {
      headerTexts.push(await header.getText());
    }

    // Step 4: Extract the table rows
    const rows = await driver.findElements(By.css('#location_stock_table tbody tr'));
    const rowData = [];
    for (const row of rows) {
      const cells = await row.findElements(By.css('td'));
      const cellTexts = [];
      for (const cell of cells) {
        cellTexts.push(await cell.getText());
      }
      rowData.push(cellTexts);
    }

    // Step 5: Convert data to CSV format
    const csvData = [headerTexts.join(',')];
    rowData.forEach(row => {
      csvData.push(row.join(','));
    });
    const csvContent = csvData.join('\n');

    // Step 6: Save CSV to file
    fs.writeFileSync(file_path, csvContent);
    console.log('Downloaded and saved the stock report as CSV.' + file_path);
  } catch (error) {
    console.error('Error downloading the stock report:', error);
  } finally {
    await driver.quit();
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
        if(col=='"SKU"'){
          rowData[col.trim().replace(/"/g, '')] = row[index].trim();  
        }else{
        rowData[col.trim().replace(/"/g, '')] = row[index].trim().replace(/"/g, '');  
        }
      });
      groupedData[key] = rowData;
  });

  return groupedData;
}


function runJob() {
  // Schedule the job to run every 30 minutes from 6 AM to 10 PM
  const schedule = '0 6-22 * * *';  // Cron expression for every 30 minutes from 6 AM to 10 PM
  log(`start : run schedule ${schedule}`);
  
  nodeSchedule.scheduleJob(schedule, function () {
    try {
      getCurrentTime();
      main();
    } catch (error) {
      log(error);
      log("---------------------------------------------------------------");
    }
  });
}


main()
runJob()
