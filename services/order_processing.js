const { By } = require('selenium-webdriver');
const { Select } = require('selenium-webdriver');
const fs = require('fs');
const { createOrderNote, updateOrderStatus } = require('./woocommerce_functions.js')
const { upsertDocument, updateCollectionStatus } = require('../mongo_functions.js');
const { OrderStatuses } = require('../statuses.js');
const { createOrder, updateInternalOrderStatus } = require('../api.js');

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
async function processFiles(driver, directoryPath, url, uploadElementLocator, buttonLocator, finalSubmit, orders, invoice_prefix) {
  const files = fs.readdirSync(directoryPath);
  const run = {}
  run['transfers'] = []
  run['orders'] = []

  const total_order_qtys = {}

  for (const fileName of files) {
    try {
      console.log("processing : " + fileName)
      const order_id = fileName.split("_")[0].slice(3);
      const invoice_number = invoice_prefix+order_id
      const filePath = `${directoryPath}\\${fileName}`;

      let order = orders.find(o => o.id == order_id)
      if (!order) {
        fs.unlinkSync(filePath)
        continue
      }

      // Check if it's a file (not a directory)
      if (fs.statSync(filePath).isFile()) {
        await driver.get(url);

        const uploadElement = await driver.findElement(uploadElementLocator);
        await uploadElement.sendKeys(filePath); // Simulate file upload

        const buttonElement = await driver.findElement(buttonLocator);
        await buttonElement.click();

        await driver.sleep(3000)

        const groupByDD = await driver.findElement(By.id('group_by'))
        const groupBySS = new Select(groupByDD)
        await groupBySS.selectByValue('0')


        const locationDD = await driver.findElement(By.id('location_id'))
        const locationSS = new Select(locationDD)
        await locationSS.selectByValue('330')

        const finalSubmitBtnEl = await driver.findElement(finalSubmit);
        await finalSubmitBtnEl.click()

        const elements = await driver.findElements(By.className('alert alert-danger alert-dismissible'));

        if (elements.length > 0) {
          console.log('Alert element exists');
          //record error in mongo
          if (invoice_number.indexOf("CAT") == 0) {
            await createOrderNote(order_id, `Unable to auto generate invoice.`)
            await updateOrderStatus(order_id, "invoice-pending")
          }
          run['orders'].push({
            order_id: order_id,
            status: 2,
            invoice_data: order
          })
          await updateCollectionStatus("invoices",{
            '$and': [{ "invoice_number": invoice_number }]
          },{
            status :OrderStatuses.invoice_failed,
            order_id: order_id,
            invoice_data: order
          })
          updateInternalOrderStatus(order_id, OrderStatuses.invoice_pending)
        } else {
          //record success in mongo
          await updateCollectionStatus("invoices",{
            '$and': [{ "invoice_number": invoice_number }]
          },{
            status :OrderStatuses.invoice_generated,
            order_id: order_id,
            invoice_data: order
          })
          updateInternalOrderStatus(order_id, OrderStatuses.invoice_generated)
          if (invoice_number.indexOf("CAT") == 0) {
            await createOrderNote(order_id, `Invoice generated - ${invoice_number}`)
            await updateOrderStatus(order_id, "invoiced")
          }
        }

        //Reduce the reserved order qty.
        for (key in order.line_items) {
          const line_item = order.line_items[key]
          total_order_qtys[line_item.sku] = total_order_qtys[line_item.sku] ? total_order_qtys[line_item.sku] + line_item.quantity : line_item.quantity
        }
      }

      await fs.unlinkSync(filePath)

    } catch (error) {
      console.log(error)
    }
  }

  return run;
}



module.exports = {
  processFiles
}
