const { By } = require('selenium-webdriver');
const { Select } = require('selenium-webdriver');
const fs = require('fs');
const { createOrderNote, updateOrderStatus } = require('./woocommerce_functions.js')
const { upsertDocument, updateCollectionStatus } = require('../mongo_functions.js');
const { OrderStatuses } = require('../statuses.js');
const { createOrder, updateInternalOrderStatus, updateOrderStatusAPI } = require('../api.js');

function extractOrderId(fileName) {
  // Split the filename by underscores, ensuring at least 2 parts (including extension)
  const parts = fileName.split("_");
  if (parts.length < 2) {
    return "Invalid format"; // Handle invalid filenames
  }
  // Extract the desired part (starting from the 3rd character)
  const orderId = parts[1].slice(2);

  // Return the extracted order ID
  return orderId;
};

// generate invoices on storemate.
// update status on woocommerce
async function processFiles(driver, directoryPath, url, uploadElementLocator, buttonLocator, finalSubmit, orders) {
  const files = fs.readdirSync(directoryPath);
for (const fileName of files) {
    try {
      if (fileName == "DRZ.csv") {
        fs.unlinkSync(`${directoryPath}\\${fileName}`)
        continue
      }

      console.log("processing : " + fileName)
      const order_id = fileName.split("_")[0].slice(3).replace(".csv", "");
      const invoice_number = invoice_prefix+order_id
      const filePath = `${directoryPath}\\${fileName}`;

      let order = orders.find(o => o.order_id == order_id)

      
    } catch (error) {
      console.log(error)
    }
  }

  return run;
}

module.exports = {
  processFiles, processOrders
}
