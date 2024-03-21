const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { Select } = require('selenium-webdriver');
const fs = require('fs');
const axios = require('axios');
const { url } = require('inspector');

async function UpdateSKU(id, sku) {
  // Call the PUT API to update the stock quantity
  const apiUrl = `https://catlitter.lk/wp-json/wc/v3/products/${id}`;
  const putData = {
    sku: sku
  };

  try {
    const putResponse = await axios.put(apiUrl, putData, {
      headers: {
        Authorization: 'Basic Y2tfNDdjMzk3ZjNkYzY2OGMyY2UyZThlMzU4YjdkOWJlYjZkNmEzMTgwMjpjc19kZjk0MDdkOWZiZDVjYzE0NTdmMDEwNTY3ODdkMjFlMTAyZmUwMTJm',  // Replace 'asd' with your actual authorization code
        'Content-Type': 'application/json'
      }
    });

    console.log(`Stock quantity updated successfully for ID: ${id}`);
  } catch (error) {
    console.error(`Failed to update stock quantity for ID: ${id}`, error);
  }
}

function log(str){
console.log('log: ' + str)
}

async function UpdateVariationSKU(parent_id, product_id, sku) {
  // Call the PUT API to update the stock quantity
  const apiUrl = `https://catlitter.lk/wp-json/wc/v3/products/${parent_id}/variations/${product_id}`;
  log(apiUrl)
  const putData = {
    sku: sku
  };

  try {
    const putResponse = await axios.put(apiUrl, putData, {
      headers: {
        Authorization: 'Basic Y2tfNDdjMzk3ZjNkYzY2OGMyY2UyZThlMzU4YjdkOWJlYjZkNmEzMTgwMjpjc19kZjk0MDdkOWZiZDVjYzE0NTdmMDEwNTY3ODdkMjFlMTAyZmUwMTJm',  // Replace 'asd' with your actual authorization code
        'Content-Type': 'application/json'
      }
    });

    console.log(`Stock quantity updated successfully for SKU: ${parent_id}`);
  } catch (error) {
    console.error(`Failed to update stock quantity for SKU: ${parent_id}`, error);
  }
}

async function callApi(page) {
  try {
    const url = 'https://catlitter.lk/wp-json/wc/v3/products?per_page=100&page=' + page;
    log(url)
    const headers = {
      Authorization: 'Basic Y2tfNDdjMzk3ZjNkYzY2OGMyY2UyZThlMzU4YjdkOWJlYjZkNmEzMTgwMjpjc19kZjk0MDdkOWZiZDVjYzE0NTdmMDEwNTY3ODdkMjFlMTAyZmUwMTJm',
    };

    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to call API: ${error.message}`);
  }
}

async function getProduct(id) {
  try {
    const url = 'https://catlitter.lk/wp-json/wc/v3/products/' + id;
    log(url)
    const headers = {
      Authorization: 'Basic Y2tfNDdjMzk3ZjNkYzY2OGMyY2UyZThlMzU4YjdkOWJlYjZkNmEzMTgwMjpjc19kZjk0MDdkOWZiZDVjYzE0NTdmMDEwNTY3ODdkMjFlMTAyZmUwMTJm',
    };

    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to call API: ${error.message}`);
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
    for (let rowIndex = 0; rowIndex < products.length; rowIndex++) {
      const product = products[rowIndex];
      if (product.variations && product.variations != null && product.variations.length > 0) {

        for (let var_row = 0; var_row < product.variations.length; var_row++) {
          const var_product = await getProduct(product.variations[var_row]);
          products = products.concat([var_product]);
        }
      }
    }
  } catch (error) {
    console.log(error)
  }
  return products;
}


function readCSV(filePath){
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const rows = fileContent.trim().split('\n');
  const header = rows[0].split(',');
  const data = rows.slice(1).map(row => row.split(','));

  const groupedData = {};

  data.forEach(row => {
      const key = row[0];

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




async function main() {
  const run_id =  generateRandomNumberString();
  // Initiate storemate in selenium
  const logfilename = `sku_update_log_${run_id}.csv`;

  skus = readCSV("C:\\Users\\Ammar Ameerdeen\\Downloads\\product_skus.csv")  

  //download the product stock from woocommerce
  const products = await fetchProductsFromWoocommerce();
  for(productId in skus){
    const matchingProduct = products.find(product => product.id == productId);

    if(!matchingProduct){
      continue
    }

    if(matchingProduct.sku == skus[productId]["Storemate Code"]){
      fs.appendFileSync(logfilename,   generateLogMessage(
        "SKU exists", matchingProduct.type, matchingProduct.id,0,  matchingProduct.name , matchingProduct.sku
      ), (err) => {
        if (err) throw err;
        console.log('Stock update operation logged successfully!');
      });
      continue;
    }

    if(productId && skus[productId]){
      const sku = skus[productId]["Storemate Code"]
      console.log(sku)

      if (matchingProduct.type == "variation") {
        await UpdateVariationSKU(matchingProduct.parent_id, matchingProduct.id, sku)

        fs.appendFileSync(logfilename,  generateLogMessage(
          "Updated", matchingProduct.type, matchingProduct.id, matchingProduct.parent_id,  matchingProduct.name , sku
        ), (err) => {
          if (err) throw err;
          console.log('Stock update operation logged successfully!');
        });
        continue;
      } else if(matchingProduct.type == "simple"){
        await UpdateSKU(matchingProduct.id, sku)

        fs.appendFileSync(logfilename,   generateLogMessage(
          "Updated", matchingProduct.type, matchingProduct.id,0,  matchingProduct.name , sku
        ), (err) => {
          if (err) throw err;
          console.log('Stock update operation logged successfully!');
        });
        continue;
      }
      fs.appendFileSync(logfilename, generateLogMessage(
        "No update", matchingProduct.type, matchingProduct.id, matchingProduct.parent_id,  matchingProduct.name , sku
      ), (err) => {
        if (err) throw err;
        console.log('No update!');
      });
  
    }
  }
   
  log("completed")

}

function isNumber(string) {
  const numberRegex = /^\d+$/;
  return numberRegex.test(string);
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
// Function to perform the automation steps
async function updateWoocommerceStock() {
  try {

    // Loop through the rows
    for (let rowIndex = 1; rowIndex < catlitterRows.length; rowIndex++) {
      const catlitterRow = catlitterRows[rowIndex];

      // Split the row content into columns
      const columns = catlitterRow.split(',');

      // Assuming the SKU is in the first column (modify the index if different)
      const skuFromRow = columns[0].trim().replace(/"/g, '');
      const stockQuantity = columns[3].trim().replace(/"/g, '').replace(' Pc(s)', '');

      // Find the product in the 'products' array based on SKU
      const matchingProduct = products.find(product => product.sku === skuFromRow);

      // Check if a matching product is found
      if (matchingProduct) {
        // Print the product ID and SKU
        console.log(`Product ID: ${matchingProduct.id}, SKU: ${skuFromRow}`);
        
      } else {
        // console.log(`Product not found for SKU: ${skuFromRow}`);
      }
    }
    
  // You can add additional steps or actions here if needed

  console.log('updateWoocommerceStock completed successfully!');
} catch (error) {
  console.error('An error occurred:', error);
} finally {
  // Quit the WebDriver
  await driver.quit();
}
}

// Run the automation function
main();

///
// async function donwloadStock(driver, location_id) {
//   try {

//     // Step 6: Go to the stock report page
//     await driver.get('https://app.storematepro.lk/reports/stock-report');

//     await driver.sleep(5000);

//     const pageLengthDropdown = await driver.findElement(By.name('stock_report_table_length'));
//     const pageLengthSelect = new Select(pageLengthDropdown);
//     await pageLengthSelect.selectByValue('-1');

//     // Step 8: Select the option in the location_id dropdown
//     const locationDropdown = await driver.findElement(By.id('location_id'));
//     const locationSelect = new Select(locationDropdown);
//     await locationSelect.selectByValue(location_id);

//     await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");


//     // Find the parent div with class "dt-buttons btn-group"
//     const parentDiv = await driver.findElement(By.className('dt-buttons btn-group'));

//     // Find all child elements of the parent div
//     const childElements = await parentDiv.findElements(By.xpath('./*'));

//     // Click the first child element
//     if (childElements.length > 0) {
//       await driver.sleep(10000);
//       while(true){
//         try{
//           await childElements[0].click();
//           await driver.sleep(1000);
//           fs.renameSync("C:\\Users\\Ammar Ameerdeen\\Downloads\\Stock Report - PET  CO.csv", "C:\\Users\\Ammar Ameerdeen\\Downloads\\"+location_id+".csv")
//           log("downloaded :  " + location_id)
//           break;
//         }catch(error){
//           console.log(error)
//         }
        
//       }
      
//     }
//   } catch (error) {
//     console.log(error)
//   }finally{
//   }
// }