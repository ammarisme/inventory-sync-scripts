const nodeSchedule = require('node-schedule');
const fs = require('fs');
const { Select, Builder, By, Key, until } = require('selenium-webdriver');

const { loginStoreMate, getChromeDriver } = require('./selenium_functions.js');
const { OrderStatuses } = require('./statuses.js');
const { fetchConfirmedOrders, updateOrderStatusAPI, fetchUnInvoicedOrders } = require('./api.js');
const { log, getCurrentTime } = require('./common/utils.js');
const { updateOrderStatus } = require('./services/woocommerce_functions.js');

async function sync() {
  try {
    let uninvoicd_orders = await fetchUnInvoicedOrders();
    if (uninvoicd_orders.length === 0) {
      log("No orders to process");
      return;
    }

    uninvoicd_orders = uninvoicd_orders.filter(a => a.status !== "invoice_pending");
    console.log('Invoice Orders:', uninvoicd_orders);

    if (uninvoicd_orders.length > 0) {
      const driver = getChromeDriver(true); // Headless Chrome
      const directoryPath = '/app/test-invoices';
      const url = 'https://app.storematepro.lk/import-sales';
      const uploadElementLocator = By.xpath('/html/body/div[3]/div[1]/section[2]/div[1]/div/div/div/form/div[1]/div/div[1]/div/input');
      const buttonLocator = By.xpath('/html/body/div[3]/div[1]/section[2]/div[1]/div/div/div/form/div[1]/div/div[2]/button');
      const finalSubmit = By.xpath('//*[@id="import_sale_form"]/div[3]/div/button');

      await loginStoreMate(driver);
      await processOrders(driver, url, uploadElementLocator, buttonLocator, finalSubmit, uninvoicd_orders, directoryPath);
      driver.quit();
    } else {
      console.log("No invoicable orders");
    }
  } catch (error) {
    log(error);
  }
}

async function processOrders(driver, url, uploadElementLocator, buttonLocator, finalSubmit, orders, directoryPath) {
  for (const order of orders) {
    if (order.status_history.some(s => s.status === "invoice_generated")) {
      console.log("Invoice already generated once.!");
      continue;
    }
    try {
      console.log(`Processing order: ${order.order_id}`);

      generateCSVForOrder(order);
      const fileName = `${order.invoice_number}.csv`;
      const filePath = `${directoryPath}/${fileName}`;

      await driver.get(url);

      await uploadFile(driver, uploadElementLocator, filePath);
      await clickElement(driver, buttonLocator);
      await driver.sleep(3000);

      await selectDropdownOption(driver, By.id('group_by'), '0');
      await selectDropdownOption(driver, By.id('location_id'), '330');

      await clickElement(driver, finalSubmit);

      const elements = await driver.findElements(By.className('alert alert-danger alert-dismissible'));

      if (elements.length > 0) {
        const alertText = await elements[0].getText();
        console.log('Alert element exists');
        await updateOrderStatusAPI(order.order_id, OrderStatuses.invoice_pending, alertText);
        if (order.invoice_number.startsWith("CAT")) {
          await updateOrderStatus(order.order_id, "invoice-pending");
        }
      } else {
        await updateOrderStatusAPI(order.order_id, OrderStatuses.invoice_generated, "");
        if (order.invoice_number.startsWith("CAT")) {
          await updateOrderStatus(order.order_id, "invoiced");
        }
      }

      // Delete the CSV file after processing
      fs.unlinkSync(filePath);
    } catch (error) {
      console.log(error);
    }
  }
}

async function uploadFile(driver, locator, filePath) {
  let attempts = 0;
  while (attempts < 3) {
    try {
      const uploadElement = await driver.wait(until.elementLocated(locator), 20000);
      await uploadElement.sendKeys(filePath);
      return;
    } catch (error) {
      if (error.name === 'StaleElementReferenceError') {
        attempts++;
        console.log('StaleElementReferenceError encountered. Retrying...');
      } else {
        throw error;
      }
    }
  }
  throw new Error('Failed to upload file after multiple attempts');
}

async function clickElement(driver, locator) {
  let attempts = 0;
  while (attempts < 3) {
    try {
      const buttonElement = await driver.wait(until.elementLocated(locator), 10000);
      await buttonElement.click();
      return;
    } catch (error) {
      if (error.name === 'StaleElementReferenceError') {
        attempts++;
        console.log('StaleElementReferenceError encountered. Retrying...');
      } else {
        throw error;
      }
    }
  }
  throw new Error('Failed to click element after multiple attempts');
}

async function selectDropdownOption(driver, locator, value) {
  let attempts = 0;
  while (attempts < 3) {
    try {
      const dropdownElement = await driver.wait(until.elementLocated(locator), 10000);
      const select = new Select(dropdownElement);
      await select.selectByValue(value);
      return;
    } catch (error) {
      if (error.name === 'StaleElementReferenceError') {
        attempts++;
        console.log('StaleElementReferenceError encountered. Retrying...');
      } else {
        throw error;
      }
    }
  }
  throw new Error('Failed to select dropdown option after multiple attempts');
}

function generateCSVForOrder(order) {
  // Add header row
  const header = "Invoice No.,Firstname,Middlename,Lastname,Customer Phone number,Customer Email,Address Line1,Address Line 2,City,State,Product name,Product SKU,Quantity,Product Unit of measurement,Unit Price,Item Tax,Item Discount,Shipping Charges";

  // Loop through each order
  if (!order.line_items || order.id === "") {
    return;
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
  fs.writeFileSync(`./test-invoices/${order.invoice_number}.csv`, csvString);
  console.log(`${order.invoice_number}.csv file created successfully!`);
}

async function runJob() {
  try {
    const schedule = '*/6 * * * *';
    console.log(`Start: run schedule ${schedule}`);
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
