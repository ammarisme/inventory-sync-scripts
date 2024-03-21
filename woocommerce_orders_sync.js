const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { Select } = require('selenium-webdriver');
const fs = require('fs');
const axios = require('axios');
const getDarazOrders = require('./read_daraz_file.js');


class Sale {
  customer_mobile
  sell_note
  sku
  pay_method
  delivery_address
  first_name
  last_name
}


async function main(){
  let run_id =  generateRandomNumberString()
  console.log(`run id ${run_id}`)
  
  //Get orders to be processed
  const processing_orders = await getProcessingOrders()

    // Initiate storemate in selenium
    const chromeOptions = new chrome.Options()
    const driver = new Builder()
      .forBrowser('chrome')
      .setChromeOptions(chromeOptions)
      .build()
    await loginStoreMate(driver)

  for(i=0;i<processing_orders.length;i++){
    const order = processing_orders[i]
    await addGeneralSaleInfo(driver, order)

    for(k=0;k<order.line_items.length;k++){
      const line_item = order.line_items[k]
      const result = await addLineItem(driver, line_item.sku )
      
    }

    let result = await verifyLineItems(driver, order)

     // if(!result.status){
    //   console.log('Line item mismatch')
    //   break
    // }

    const discountTypeDD = await driver.findElement(By.id('discount_type'));
    const discountTypeSS = new Select(discountTypeDD);
    await discountTypeSS.selectByValue('fixed');
    await driver.findElement(By.xpath('//*[@id="discount_amount"]')).clear()
    await driver.findElement(By.xpath('//*[@id="discount_amount"]')).sendKeys(result.total_discount)
    await driver.findElement(By.xpath('//*[@id="shipping_charges"]')).clear()
    await driver.findElement(By.xpath('//*[@id="shipping_charges"]')).sendKeys(order.shipping_total)


    //Verify the order
    if(result.status){
      saveOrder(driver)
    }
  }
}


async function verifyLineItems(driver, order){
  const line_totals = await driver.findElements(By.className('display_currency pos_line_total_text'))
  let line_items_length=0
  for(i=0;i< order.line_items.length;i++){
    line_items_length += order.line_items[i].quantity
  }

  const status = line_totals.length == line_items_length

  const full_total_element = await driver.findElement(By.id('final_total_input'))
  let full_total = await full_total_element.getAttribute("value")
  full_total = full_total.trim().replace(',', '')
  full_total = Number(full_total)
  const discount = full_total  - (Number(order.total) - Number(order.shipping_total))
  
  return {
    "status" : status,
    "full_total" : full_total,
    "total_discount" : discount
  }
}

function orderIsCorrect(driver, order, line_item_results){
  return false
}
function generateRandomNumberString(length = 5) {
  // Create an array of digits (0-9)
  const digits = '0123456789'

  // Use a loop to build the random string
  let result = ''
  for (let i = 0 ;i < length; i++) {
    result += digits[Math.floor(Math.random() * digits.length)]
  }

  return result
}

async function getProcessingOrders() {
  while(true){
  try {
    const url = 'https://catlitter.lk/wp-json/wc/v3/orders?status=processing&page=1&per_page=100';
    const headers = {
      Authorization: 'Basic Y2tfNDdjMzk3ZjNkYzY2OGMyY2UyZThlMzU4YjdkOWJlYjZkNmEzMTgwMjpjc19kZjk0MDdkOWZiZDVjYzE0NTdmMDEwNTY3ODdkMjFlMTAyZmUwMTJm',
    };

    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to call API: ${error.message}`);
  }
}
}

async function loginStoreMate(driver) {
  try {

    // Step 1: Go to the login page
    await driver.get('https://app.storematepro.lk/login');

    // Step 2: Fill in the username field
    await driver.findElement(By.id('username')).sendKeys('NASEEF');

    // Step 3: Fill in the password field
    await driver.findElement(By.id('password')).sendKeys('80906');

    // Step 4: Click the login button
    await driver.findElement(By.className('btn btn-lg btn-primary btn-block rounded-pill')).click();

    // Step 5: Wait until redirected to the home page
    await driver.wait(until.urlIs('https://app.storematepro.lk/home'), 1000);

  } catch (error) {
    console.log(error)
  }
}

// Function to perform the automation steps
async function addGeneralSaleInfo(driver, order) {
  try {
    // Step 6: Go to the create sale page
    await driver.get('https://app.storematepro.lk/home');
    await driver.get('https://app.storematepro.lk/sells/create');
   

    const sale = new Sale()
    sale.customer_mobile = order.billing.phone
    sale.sell_note = "website order no :" + order.number
    switch(order.payment_method){
      case "cod":
        sale.pay_method = "cash"
        break
      case 'webxpay':
        sale.pay_method = "card"
        break
      case 'cheque':
        sale.pay_method = "cheque"
        break
      default:
        throw "Payment method not found. Update the switch."
    }
    sale.delivery_address = `${order.shipping.address_1}, ${order.shipping.address_2}, ${order.shipping.city}`
    sale.first_name = order.billing.first_name
    sale.last_name = order.billing.last_name

    //Select the customer
    await driver.findElement(By.xpath('//*[@id="select2-customer_id-container"]')).click();
    await driver.sleep(1000);
    await driver.findElement(By.xpath('/html/body/span/span/span[1]/input')).sendKeys(sale.customer_mobile);
    await driver.sleep(3000);

    let add_new_customer_btn = await driver.findElements(By.className('btn btn-link add_new_customer'));

    if (add_new_customer_btn.length > 0) {
//Add a customer
add_new_customer_btn[0].click()
await driver.sleep(1000);
await driver.findElement(By.xpath('//*[@id="first_name"]')).sendKeys(sale.first_name);
await driver.findElement(By.xpath('//*[@id="last_name"]')).sendKeys(sale.last_name);
await driver.findElement(By.xpath('//*[@id="mobile"]')).sendKeys(sale.customer_mobile);
await driver.findElement(By.xpath('//*[@id="quick_add_contact"]/div[3]/button[1]')).click();


    } else {
      await driver.findElement(By.xpath('/html/body/span/span/span[1]/input')).sendKeys(Key.ENTER);
    }
    

    //Select sale type
    const saleTypeDropdown = await driver.findElement(By.id('sale_type'));
    const saleTypeSelect = new Select(saleTypeDropdown);
    await saleTypeSelect.selectByValue('141');

    //Select pay type
    const payTypeDropdown = await driver.findElement(By.xpath('//*[@id="method_0"]'));
    const payTypeSelect = new Select(payTypeDropdown);
    await payTypeSelect.selectByValue(sale.pay_method);

    //Select pay type
    const saleStatusDD = await driver.findElement(By.xpath('//*[@id="status"]'));
    const saleStatusSelect = new Select(saleStatusDD);
    await saleStatusSelect.selectByValue("draft");
    await driver.findElement(By.xpath('//*[@id="add_sell_form"]/div[1]/div/div[1]/div/div[6]/div/span')).click();
    
    
     //Select pay type
     const shippingStatusDD = await driver.findElement(By.xpath('//*[@id="shipping_status"]'));
     const shippingStatusSS = new Select(shippingStatusDD);
     await shippingStatusSS.selectByValue("ordered");
    //
    await driver.findElement(By.xpath('//*[@id="add_sell_form"]/div[1]/div/div[3]/div/div[17]/div/textarea')).sendKeys(sale.sell_note);
    await driver.findElement(By.xpath('//*[@id="shipping_address"]')).sendKeys(sale.delivery_address);

    //TODO : Click the save button.
    await driver.sleep(3000);

  } catch (error) {
    console.error('An error occurred:', error);
  }
}

async function addLineItem(driver, sku) {
  //Add line item
  await driver.findElement(By.xpath('//*[@id="search_product"]')).clear();
  await driver.findElement(By.xpath('//*[@id="search_product"]')).sendKeys(sku);
  await driver.sleep(3000);
  await driver.findElement(By.xpath('//*[@id="search_product"]')).sendKeys(Key.ENTER);


}

async function saveOrder(driver) {
  //Add line item
  await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
  await driver.sleep(1000);
  await driver.findElement(By.xpath('//*[@id="submit-sell"]')).click();
  await driver.sleep(3000);

}

async function callApi(page) {
  try {
    const url = 'https://catlitter.lk/wp-json/wc/v3/products?per_page=100&page=' + page;
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
    const headers = {
      Authorization: 'Basic Y2tfNDdjMzk3ZjNkYzY2OGMyY2UyZThlMzU4YjdkOWJlYjZkNmEzMTgwMjpjc19kZjk0MDdkOWZiZDVjYzE0NTdmMDEwNTY3ODdkMjFlMTAyZmUwMTJm',
    };

    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to call API: ${error.message}`);
  }
}

main();