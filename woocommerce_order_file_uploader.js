const {By} = require('selenium-webdriver');
const { Select } = require('selenium-webdriver');
const fs = require('fs');
const axios = require('axios');
const {insertDocument, updateDocument, getCollectionBy, upsertDocument} = require('./mongo_functions.js');
const {loginStoreMate, donwloadStock, getChromeDriver} = require('./selenium_functions.js');
const {getProcessingOrders, createOrderNote, updateOrderStatus, getProduct} = require('./woocommerce_functions.js')
const {log, generateRandomNumberString} = require('./util_functions.js')

class Sale {
  customer_mobile
  sell_note
  sku
  pay_method
  delivery_address
  first_name
  last_name
}


async function main_darazorders() {
  let run_id = ""
  let available_stock
  if(process.argv[3]){
    run_id = process.argv[3]
  }else{
    run_id = generateRandomNumberString() 
    run_id = generateRandomNumberString()
    const driver = getChromeDriver(false) // go real chrome
    await loginStoreMate(driver)
    await donwloadStock(driver, run_id)
    available_stock = readCSV(`C:\\Users\\Ammar Ameerdeen\\Downloads\\${run_id}.csv`)
    driver.quit();
  }
  log(run_id) 
  //Get orders to be processed
  const processing_orders = await getDarazOrders(4)
  convertDarazToCSV(processing_orders)

  const driver2 = getChromeDriver(true) // go headless chrom
  // Replace these with your specific values
  const directoryPath = 'C:\\Users\\Ammar Ameerdeen\\Desktop\\stock_sync\\DRZ_invoices';
  const url = 'https://app.storematepro.lk/import-sales';
  const uploadElementLocator = By.xpath('/html/body/div[3]/div[1]/section[2]/div[1]/div/div/div/form/div[1]/div/div[1]/div/input'); // Replace with actual locator
  const buttonLocator = By.xpath('/html/body/div[3]/div[1]/section[2]/div[1]/div/div/div/form/div[1]/div/div[2]/button'); // Replace with actual locator
  const finalSubmit = By.xpath('//*[@id="import_sale_form"]/div[3]/div/button'); // Replace with actual locator
  await loginStoreMate(driver2)
  const transfers = await processFiles(driver2, directoryPath, url, uploadElementLocator, buttonLocator, finalSubmit,available_stock, run_id,processing_orders);
  await upsertDocument("runs", {
    "run_id": run_id,
    "status": "0",
    "transfers": transfers,
  }, {"run_id": run_id}
  )
  driver2.quit()
}

async function main_darazscheduledorders() {
  let run_id = ""
  let available_stock
  if(process.argv[3]){
    run_id = process.argv[3]
  }else{
    run_id = generateRandomNumberString() 
    run_id = generateRandomNumberString()
    const driver = getChromeDriver(false) // go real chrome
    await loginStoreMate(driver)
    await donwloadStock(driver, run_id)
    available_stock = readCSV(`C:\\Users\\Ammar Ameerdeen\\Downloads\\${run_id}.csv`)
    driver.quit();
  }
  log(run_id) 
  //Get orders to be processed
  const processing_orders = await getDarazOrders(3)
  convertDarazToCSV(processing_orders)

  const driver2 = getChromeDriver(true) // go headless chrom
  // Replace these with your specific values
  const directoryPath = 'C:\\Users\\Ammar Ameerdeen\\Desktop\\stock_sync\\DRZ_invoices';
  const url = 'https://app.storematepro.lk/import-sales';
  const uploadElementLocator = By.xpath('/html/body/div[3]/div[1]/section[2]/div[1]/div/div/div/form/div[1]/div/div[1]/div/input'); // Replace with actual locator
  const buttonLocator = By.xpath('/html/body/div[3]/div[1]/section[2]/div[1]/div/div/div/form/div[1]/div/div[2]/button'); // Replace with actual locator
  const finalSubmit = By.xpath('//*[@id="import_sale_form"]/div[3]/div/button'); // Replace with actual locator
  await loginStoreMate(driver2)
  const transfers = await processFiles(driver2, directoryPath, url, uploadElementLocator, buttonLocator, finalSubmit,available_stock, run_id,processing_orders);
 await upsertDocument("runs", {
    "run_id": run_id,
    "status": "0",
    "transfers": transfers,
  }, {"run_id": run_id}
  )
  driver2.quit()
}


async function main_processneworders() {
  let run_id = ""
  let available_stock
  if(process.argv[3]){
    run_id = process.argv[3]
  }else{
    run_id = generateRandomNumberString() 
    run_id = generateRandomNumberString()
    const driver = getChromeDriver(false) // go real chrome
    await loginStoreMate(driver)
    await donwloadStock(driver, run_id)
    available_stock = readCSV(`C:\\Users\\Ammar Ameerdeen\\Downloads\\${run_id}.csv`)
    driver.quit();
  }
  
  console.log(`run id ${run_id}`)
  
  var db = null // global variable to hold the connection

  //Get orders to be processed
  const processing_orders = await getProcessingOrders()
  convertToCSV(processing_orders)
  available_stock = readCSV(`C:\\Users\\Ammar Ameerdeen\\Downloads\\${run_id}.csv`)


  const driver2 = getChromeDriver(true) // go headless chrom
  // Replace these with your specific values
  const directoryPath = 'C:\\Users\\Ammar Ameerdeen\\Desktop\\stock_sync\\CAT_invoices';
  const url = 'https://app.storematepro.lk/import-sales';
  const uploadElementLocator = By.xpath('/html/body/div[3]/div[1]/section[2]/div[1]/div/div/div/form/div[1]/div/div[1]/div/input'); // Replace with actual locator
  const buttonLocator = By.xpath('/html/body/div[3]/div[1]/section[2]/div[1]/div/div/div/form/div[1]/div/div[2]/button'); // Replace with actual locator
  const finalSubmit = By.xpath('//*[@id="import_sale_form"]/div[3]/div/button'); // Replace with actual locator
  await loginStoreMate(driver2)
  const transfers = await processFiles(driver2, directoryPath, url, uploadElementLocator, buttonLocator, finalSubmit,available_stock, run_id,processing_orders);
  await upsertDocument("runs", {
    "run_id": run_id,
    "status": "0",
    "transfers": transfers,
  }, {"run_id": run_id}
  )
  driver2.quit()
}

async function main_process_scheduled_orders(){
  let run_id = ""
  let available_stock
  if(process.argv[3]){
    run_id = process.argv[3]
  }else{
    run_id = generateRandomNumberString()
    const driver = getChromeDriver(false) // go real chrome
    await loginStoreMate(driver)
    await donwloadStock(driver, run_id)
    available_stock = readCSV(`C:\\Users\\Ammar Ameerdeen\\Downloads\\${run_id}.csv`)
    driver.quit();
  }
  
  const processing_orders = await getScheduledOrders()
  if(processing_orders.length == 0){
    log("no orders to process")
    return
  }
  
  console.log(`run id ${run_id}`)  
  convertToCSV(processing_orders)

  

  const driver2 = getChromeDriver(true) // go headless chrom
  // Replace these with your specific values
  const directoryPath = 'C:\\Users\\Ammar Ameerdeen\\Desktop\\stock_sync\\CAT_invoices';
  const url = 'https://app.storematepro.lk/import-sales';
  const uploadElementLocator = By.xpath('/html/body/div[3]/div[1]/section[2]/div[1]/div/div/div/form/div[1]/div/div[1]/div/input'); // Replace with actual locator
  const buttonLocator = By.xpath('/html/body/div[3]/div[1]/section[2]/div[1]/div/div/div/form/div[1]/div/div[2]/button'); // Replace with actual locator
  const finalSubmit = By.xpath('//*[@id="import_sale_form"]/div[3]/div/button'); // Replace with actual locator
  await loginStoreMate(driver2)

  
  const transfers = await processFiles(driver2, directoryPath, url, uploadElementLocator, buttonLocator, finalSubmit,available_stock,run_id, processing_orders);
  await upsertDocument("runs", {
    "run_id": run_id,
    "status": "0",
    "transfers": transfers,
  }, {"run_id": run_id}
  )
  driver2.quit()
}


async function getDarazOrders(status){
  db_invoices = await getCollectionBy("invoices", {
    invoice_number: { $regex: "^DRZ" }, // Matches documents where 'a' starts with "x"
    status: status, // Matches documents where 'b' is equal to 3
  })
  return db_invoices
  }

async function getScheduledOrders(){
  let woo_orders = []
  db_invoices = await getCollectionBy("invoices", {status : 3})
  for(i=0;i<db_invoices.length;i++){
    let order = db_invoices[i]
    if(order.invoice_number.indexOf("CAT") == -1 ){
      continue
    }
    while (true) {
      try {
        const url = `https://catlitter.lk/wp-json/wc/v3/orders/${order.source_order_number}`;
        const headers = {
          Authorization: 'Basic Y2tfNDdjMzk3ZjNkYzY2OGMyY2UyZThlMzU4YjdkOWJlYjZkNmEzMTgwMjpjc19kZjk0MDdkOWZiZDVjYzE0NTdmMDEwNTY3ODdkMjFlMTAyZmUwMTJm',
        };
  
        const response = await axios.get(url, { headers });
        woo_orders.push(response.data)
        break
      } catch (error) {
        throw new Error(`Failed to call API: ${error.message}`);
      }
    }
  }

  return woo_orders
}



async function processFiles(driver, directoryPath, url, uploadElementLocator, buttonLocator, finalSubmit,available_stock, run_id, woo_orders) {
  const files = fs.readdirSync(directoryPath);
  const run = {}
  run['transfers'] = []
  run['orders'] = []
  run["source"] = "catlitter.lk"

  const total_order_qtys = {}

    for (const fileName of files) {
      try{
      console.log("processing : " + fileName)
      const order_id = fileName.split("_")[0].replace("CAT", "").replace("DRZ", "").replace(".csv","")
      const invoice_number = fileName.split("_")[0].replace(".csv","")
      const filePath = `${directoryPath}\\${fileName}`;

      let order = woo_orders.find(o => o.id == order_id)
      if(!order){
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
          if(invoice_number.indexOf("CAT")> 0){
          await createOrderNote(order_id, `Unable to auto generate invoice.`)
          await updateOrderStatus(order_id, "invoice-pending")
          }
          run['orders'].push({
            order_id : order_id,
            status : 2,
            invoice_data : order
          })
          await upsertDocument("invoices",
            {
              '$and': [{ "invoice_number": invoice_number }, { run_id: run_id }]
            }, {
            "invoice_number": invoice_number,
            "status": 1,
            run_id: run_id,
            "source_order_number": order_id,
          })
        } else {
          //record success in mongo
          await upsertDocument("invoices",
          {
            '$and': [{ "invoice_number": invoice_number }, { run_id: run_id }]
          }, {
          "invoice_number": invoice_number,
          "status": 2,
          run_id: run_id,
          "source_order_number": order_id,
        }) 
          run['orders'].push({
            order_id : order_id,
            status : 1,
            invoice_data : order
          })
          if(invoice_number.indexOf("CAT")> 0){
        await createOrderNote(order_id, `Invoice generated - ${invoice_number}`)
                  await updateOrderStatus(order_id, "invoiced")

        }
        }

        //Reduce the reserved order qty.
        for(key in order.line_items){
          const line_item = order.line_items[key]
          total_order_qtys[line_item.sku] = total_order_qtys[line_item.sku]?total_order_qtys[line_item.sku]+ line_item.quantity: line_item.quantity
        }
      }

      fs.unlinkSync(filePath)

    }catch(error){
console.log(error)
    }
    }

    for(key in total_order_qtys){
      if(total_order_qtys[key] > Number(available_stock[`"${key}"`]["Catlitter"])){
      run['transfers'].push({
        sku : key,
        product_name : available_stock[`"${key}"`]["Product Name"],
        order_qty : total_order_qtys[key],
        available_qty : Number(available_stock[`"${key}"`]["Catlitter"]),
        required : total_order_qtys[key]- Number(available_stock[`"${key}"`]["Catlitter"])
      })
    }
    }
    return run;
}

function readCSV(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const rows = fileContent.trim().split('\n')
  const header = rows[0].split(',')
  const data = rows.slice(1).map(row => row.split(','))

  const groupedData = {}

  data.forEach(row => {
    const key = row[2]

    const rowData = {}
    header.forEach((col, index) => {
      rowData[col.trim().replace(/"/g, '')] = row[index].trim().replace(/"/g, '')
    })
    groupedData[key] = rowData
  })

  // fs.unlink(filePath)
  // console.log(`File ${filePath} deleted successfully!`)

  return groupedData
}

function convertToCSV(processingOrders) {
  // Add header row
  const header = "Invoice No.,Firstname,Middlename,Lastname,Customer Phone number,Customer Email,Address Line1,Address Line 2,City,State,Product name,Product SKU,Quantity,Product Unit of measurement,Unit Price,Item Tax,Item Discount,Shipping Charges"

  // Loop through each order
  processingOrders.forEach(order => {
    // Add main header
    const csvContent = [];
    csvContent.push(header);
    // Loop through each line item
    const nosku = order.line_items.find(i => i.sku == '')
    if (nosku) {
      return
    }
    order.line_items.forEach(item => {
      // No need to extract data, just create empty cells
      csvContent.push(`CAT${order.number},${order.billing.first_name},,${order.billing.last_name}, ${order.billing.first_name},${order.billing.phone},${order.billing.email},"${order.billing.address_1}","${order.billing.address_2}","${order.billing.state}","${item.name}",${item.sku},${item.quantity},pieces,${item.price},,,${order.shipping_total}`);
    });
    const csvString = csvContent.join('\n');

    // Write CSV to file
    fs.writeFileSync(`.\\CAT_invoices\\CAT${order.number}_catlitter_lk_orders.csv`, csvString);
    console.log(`CAT${order.number}_catlitter_lk_orders.csv file created successfully!`);
  });

  return;
}

function convertDarazToCSV(processingOrders) {
  // Add header row
  const header = "Invoice No.,Firstname,Middlename,Lastname,Customer Phone number,Customer Email,Address Line1,Address Line 2,City,State,Product name,Product SKU,Quantity,Product Unit of measurement,Unit Price,Item Tax,Item Discount,Shipping Charges"

  // Loop through each order
  processingOrders.forEach(order => {
    // Add main header
    const csvContent = [];
    csvContent.push(header);
    // Loop through each line item
    order.invoice_data.line_items.forEach(item => {
      // No need to extract data, just create empty cells
      const first_name = item["Customer Name"].split(" ")[0]
      const last_name = item["Customer Name"].split(" ")[1]?item["Customer Name"].split(" ")[1] : ""
      const phone_number = item["Billing Phone Number"]
      const email = item["Customer Email"]
      const address1 = `${item["Billing Address"]},${item["Billing Address2"]}`
      const address2 = `${item["Billing Address5"]},${item["Billing Address4"]}`
      const state = item["Billing Address3"]
      const item_name = item["Item Name"]
      const sku = item["Seller SKU"]
      const price = item["Unit Price"]
      const shipping_total = 0
      const quantity = 0

      csvContent.push(`"${order.invoice_number}","${first_name}","","${last_name}","${first_name}","${phone_number}","${email}","${address1}","${address2}","${state}","${item_name}",${sku},${quantity}","pieces","${price}","","","${shipping_total}`);
    });
    const csvString = csvContent.join('\n');

    // Write CSV to file
    fs.writeFileSync(`.\\DRZ_invoices\\${order.invoice_number}.csv`, csvString);
    console.log(`${order.invoice_number}.csv file created successfully!`);
  });

  return;
}


try{
  switch(process.argv[2]){
    case "scheduled" :
      main_process_scheduled_orders();
      break
    case "new_orders" :
      main_processneworders();
      break
    case "daraz" :
      main_darazorders();
      break
    case "daraz_scheduled" :
      main_darazscheduledorders();
      break
    default:
      break;
  }
}catch(error){
  log(error)
}
