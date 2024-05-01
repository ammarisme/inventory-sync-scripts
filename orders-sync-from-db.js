const nodeSchedule = require('node-schedule');
const fs = require('fs');
const {Select, Builder, By, Key, until } = require('selenium-webdriver');

const { loginStoreMate, getChromeDriver } = require('./selenium_functions.js');
const { OrderStatuses } = require('./statuses.js');
const { fetchConfirmedOrders, updateOrderStatusAPI } = require('./api.js');
const { log, getCurrentTime } = require('./common/utils.js');
const { updateOrderStatus } = require('./services/woocommerce_functions.js');

async function sync() {
  try {
    processing_orders = await fetchConfirmedOrders();
    if (processing_orders == 0) {
      log("no orders to process");
      return;
    }

    if (processing_orders) {
      const driver = getChromeDriver(true); // Headless Chrome
      const directoryPath = 'C:\\Users\\Ammar Ameerdeen\\Desktop\\github\\store-sync\\test-invoices';
      const url = 'https://app.storematepro.lk/import-sales';
      const uploadElementLocator = By.xpath('/html/body/div[3]/div[1]/section[2]/div[1]/div/div/div/form/div[1]/div/div[1]/div/input');
      const buttonLocator = By.xpath('/html/body/div[3]/div[1]/section[2]/div[1]/div/div/div/form/div[1]/div/div[2]/button');
      const finalSubmit = By.xpath('//*[@id="import_sale_form"]/div[3]/div/button');

      await loginStoreMate(driver);
      await processOrders(driver, url, uploadElementLocator, buttonLocator, finalSubmit, processing_orders, directoryPath)
      driver.quit();
    }

  } catch (error) {
    log(error);
  }
}


async function processOrders(driver, url, uploadElementLocator, buttonLocator, finalSubmit, orders,directoryPath) {
  for (const order of orders) {
    if(!order.status_history.filter(s => s.status === "invoice_generated").length == 0){
      console.log("Invoice already generated once.!")
      continue;
    }
    try {
      console.log(`Processing order: ${order.order_id}`);

      generateCSVForOrder(order)
      const fileName = `${order.invoice_number}.csv`;
      const filePath = `${directoryPath}\\${fileName}`;


      // Proceed with processing
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
          const alertText = await elements[0].getText();
          console.log('Alert element exists');
          //call api and update order status as invoice-pending
          await updateOrderStatusAPI(order.order_id, OrderStatuses.invoice_pending, alertText);
          if (order.invoice_number.startsWith("CAT")) {
            await updateOrderStatus(order.order_id, "invoice-pending")
          }
          
        } else {
          //call api and update order status as invoiced
          await updateOrderStatusAPI(order.order_id, OrderStatuses.invoice_generated, "");
          if (order.invoice_number.startsWith("CAT")) {
            await updateOrderStatus(order.order_id, "invoiced");
          }
        }

      // Delete the CSV file after processing
      await fs.unlinkSync(filePath);
    } catch (error) {
      console.log(error);
    }
  }
}

function generateCSVForOrder(order) {
  // Add header row
  const header = "Invoice No.,Firstname,Middlename,Lastname,Customer Phone number,Customer Email,Address Line1,Address Line 2,City,State,Product name,Product SKU,Quantity,Product Unit of measurement,Unit Price,Item Tax,Item Discount,Shipping Charges"

  // Loop through each order
    if(!order.line_items || order.id == ""){
      return
    }
    // Add main header
    const csvContent = [];
    csvContent.push(header);
    // Loop through each line item
    order.line_items.forEach(item => {
      csvContent.push(`"${order.invoice_number}","${order.customer.first_name}","","${order.customer.last_name}","${order.customer.phone}","${order.customer.email}","${order.customer.address1}","${order.customer.address2}","","${order.customer.state}","${item.product_name}","${item.sku}",${item.quantity},"pieces","${item.unit_price}","","",""`);
    });
    const csvString = csvContent.join('\n');

    // Write CSV to file
    fs.writeFileSync(`.\\test-invoices\\${order.invoice_number}.csv`, csvString);
    console.log(`${order.invoice_number}.csv file created successfully!`);
}

async function runJob() {
  try {
    const schedule = '*/6 * * * *';
    console.log(`start : run schedule ${schedule}`);
    getCurrentTime();
    await sync();
    nodeSchedule.scheduleJob(schedule, async function () {
      try {
        getCurrentTime();
        await sync();
      } catch (error) {
        log(error);
        log("---------------------------------------------------------------");
      }
    });
  } catch (error) {
    log(error);
  }
}

runJob();