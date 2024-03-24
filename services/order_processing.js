const {By} = require('selenium-webdriver');
const { Select } = require('selenium-webdriver');
const fs = require('fs');
const {createOrderNote, updateOrderStatus} = require('./woocommerce_functions.js')
const {upsertDocument} = require('../mongo_functions.js');


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
            if(invoice_number.indexOf("CAT")== 0){
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
            if(invoice_number.indexOf("CAT")==   0){
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

  module.exports= {
    processFiles
  }
