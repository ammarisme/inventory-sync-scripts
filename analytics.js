const { By } = require('selenium-webdriver');
const { getCollectionBy, upsertDocument, insertDocument, insertMultipleDocuments } = require('./mongo_functions.js');
const { loginStoreMate, donwloadStock, getChromeDriver } = require('./selenium_functions.js');
const { getProcessingOrders, getScheduledWoocommerceOrders, getInvoiceGenerateOrders, getTestOrders, getCompletedOrders, getOrdersByStatus } = require('./services/woocommerce_functions.js')
const { log, generateRandomNumberString, getCurrentTime } = require('./common/utils.js')
const { readCSV, convertToCSV, convertDarazToCSV } = require('./services/files.js')
const { processFiles } = require('./services/order_processing.js');
const { UPLOADED_ORDER_NEW, UPLOADED_ORDER_REPROCESS_SCHEDULED } = require('./statuses.js');
const nodeSchedule = require('node-schedule');

class Sale {
    customer_mobile
    sell_note
    sku
    pay_method
    delivery_address
    first_name
    last_name
}

async function entry_function() {
    try {
        let run_id = ""
        if (process.argv[3]) {
            run_id = process.argv[3]
        } else {
            run_id = generateRandomNumberString()
        }

        statuses = {
            "completed" : ["completed"],
            "in_progress" : [ "shipped", "invoice-pending", "invoiced"]
        }


        for (const status of statuses["completed"]) {
            let i = 1;
            while (true) {
              const orders = await getOrdersByStatus(status, i);
              if (orders.length === 0) {
                break;
              }
              await uploadOrdersInChunks("orders", orders)
              i++;
            }
          }

        for (const status of statuses["in_progress"]) {
            let i = 1;
            while (true) {
              const orders = await getOrdersByStatus(status, i);
              if (orders.length === 0) {
                break;
              }
              await uploadOrdersInChunks("orders", orders)
              i++;
            }
          }


        //await uploadOrdersInChunks("orders", all_orders)

    } catch (error) {
        log(error)
    }
}

const CHUNK_SIZE = 1000; // Adjust as needed

async function uploadOrdersInChunks(collection_name,all_orders) {
  let i = 0;
  while (i < all_orders.length) {
    const chunk = all_orders.slice(i, i + CHUNK_SIZE);

    try {
      await insertMultipleDocuments(collection_name, chunk);
    } catch (error) {
      console.error("Error uploading chunk:", error);
      // Handle errors appropriately, e.g., retrying or logging
    }

    i += CHUNK_SIZE;
  }
}

entry_function()

//Test
// async function testJob() {
//     const schedule = '30 */2 * * *'
//     console.log(`start : run schedule ${schedule}`)
//     getCurrentTime()
//     await entry_function("test")
// }
// testJob()


