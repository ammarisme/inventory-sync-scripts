const { By } = require('selenium-webdriver');
const { getCollectionBy, upsertDocument, insertDocument } = require('./mongo_functions.js');
const { loginStoreMate, donwloadStock, getChromeDriver } = require('./selenium_functions.js');
const { getProcessingOrders, getScheduledWoocommerceOrders, getInvoiceGenerateOrders, getTestOrders } = require('./services/woocommerce_functions.js')
const { log, generateRandomNumberString, getCurrentTime } = require('./common/utils.js')
const { readCSV, convertToCSV, convertDarazToCSV } = require('./services/files.js')
const { processFiles } = require('./services/order_processing.js');
const {  OrderStatuses } = require('./statuses.js'); 

//UPLOADED_ORDER_NEW, UPLOADED_ORDER_REPROCESS_SCHEDULED
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


async function main(run_id, processing_orders, invoice_prefix) {
    const driver2 = getChromeDriver(true) // go headless chrom
    // Replace these with your specific values
    const directoryPath = 'C:\\Users\\Ammar Ameerdeen\\Desktop\\github\\store-sync-production\\invoices';
    const url = 'https://app.storematepro.lk/import-sales';
    const uploadElementLocator = By.xpath('/html/body/div[3]/div[1]/section[2]/div[1]/div/div/div/form/div[1]/div/div[1]/div/input'); // Replace with actual locator
    const buttonLocator = By.xpath('/html/body/div[3]/div[1]/section[2]/div[1]/div/div/div/form/div[1]/div/div[2]/button'); // Replace with actual locator
    const finalSubmit = By.xpath('//*[@id="import_sale_form"]/div[3]/div/button'); // Replace with actual locator
    await loginStoreMate(driver2)
    await processFiles(driver2, directoryPath, url, uploadElementLocator, buttonLocator, finalSubmit, processing_orders, invoice_prefix);
    await insertDocument("runs", {
        "run_id": run_id,
    }, {
        "run_id": run_id ,
        "source" : "catlitter.lk"}
    )
    driver2.quit()
}


async function entry_function(type) {
    try {
        let run_id = ""
        if (process.argv[3]) {
            run_id = process.argv[3]
        } else {
            run_id = generateRandomNumberString()
        }
        let invoice_prefix;
        let processing_orders;
        log(`start processing: ${type}`)
        switch (type) {
            case "scheduled_wooorders":
                processing_orders = await getScheduledWoocommerceOrders()
                if (processing_orders.length == 0) {
                    log("no orders to process")
                    return
                }
                convertToCSV(processing_orders, "CAT")
                invoice_prefix="CAT"
                break
            case "new_wooorders":
                processing_orders = await getProcessingOrders()
                if (processing_orders.length == 0) {
                    log("no orders to process")
                    return
                }
                convertToCSV(processing_orders, "CAT")
                invoice_prefix="CAT"
                break
            case "test":
                processing_orders = await getTestOrders()
                if (processing_orders.length == 0) {
                    log("no orders to process")
                    return
                }
                convertToCSV(processing_orders, "CAT")
                invoice_prefix="CAT"
                break
            case "invoice_generate":
                processing_orders = await getInvoiceGenerateOrders()
                if (processing_orders.length == 0) {
                    log("no orders to process")
                    return
                }
                convertToCSV(processing_orders, "CAT")
                invoice_prefix="CAT"
                break
            case "new_darazorders":
                processing_orders = await getCollectionBy("invoices", {
                    invoice_number: { $regex: "^DRZ" },
                    status: OrderStatuses.order_confirmed, 
                })
                if (processing_orders.length == 0) {
                    log("no orders to process")
                    return
                }
                convertDarazToCSV(processing_orders)
                invoice_prefix="DRZ"
                break
            default:
                break;
        }

        if (processing_orders) {
            await main(run_id, processing_orders, invoice_prefix);
        }



    } catch (error) {
        log(error)
    }
}

//Production
async function runJob() {
    try{
    const schedule = '*/15 * * * *'
    const daraz_schedule = '*/5 * * * *'
    console.log(`start : run schedule ${schedule}`)


    getCurrentTime()
    await entry_function("new_darazorders");
    await entry_function("new_wooorders")
    await entry_function("invoice_generate")
    await entry_function("scheduled_wooorders")
    nodeSchedule.scheduleJob(schedule, async function () {
        try {
            getCurrentTime()
            await entry_function("new_darazorders");
            await entry_function("new_wooorders")
            await entry_function("invoice_generate")
            await entry_function("scheduled_wooorders")
        } catch (error) {
            log(error)
            log("---------------------------------------------------------------")
        }
    })
    nodeSchedule.scheduleJob(daraz_schedule, async function () {
        try {
            getCurrentTime()
            // await entry_function("new_darazorders");
            await entry_function("new_darazorders");
        } catch (error) {
            log(error)
            log("---------------------------------------------------------------")
        }
    })
}catch(error){
    log(error)
}
}

runJob()

// async function testJob() {
//     const schedule = '30 */2 * * *'
//     console.log(`start : run schedule ${schedule}`)
//     getCurrentTime()
//     await entry_function("test")
// }
// testJob()


