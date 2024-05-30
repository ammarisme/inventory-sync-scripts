const { getCollectionBy, upsertDocument, insertDocument } = require('./mongo_functions.js');
const { loginStoreMate, donwloadStock, getChromeDriver } = require('./selenium_functions.js');
const { log, generateRandomNumberString, getCurrentTime } = require('./common/utils.js')
const {  OrderStatuses } = require('./statuses.js'); 
const {until, Key } = require('selenium-webdriver');

//UPLOADED_ORDER_NEW, UPLOADED_ORDER_REPROCESS_SCHEDULED
const nodeSchedule = require('node-schedule');
const { getOrdersByStatus, updateInternalOrderStatus, addTrackingMessage, fetchOrdersByOrderStatusFromDBs, updateTrackingData } = require('./api.js');

class RevenueStatus {
    static Default = "pending";
    static pending = "pending";
    static paid = "paid";
    static refunded = "refunded";
    static realized = "realized";
    static unknown = 'unknown';
    static reverse = "reverse";
  }
  


async function entry_function() {
    try {
        // get all pending tracking orders.
        // const orders = (await fetchOrdersByOrderStatusFromDBs("order_confirmed"))??[];
        const shipped_orders = (await fetchOrdersByOrderStatusFromDBs("shipped"))??[];
        const delivered_orders = (await fetchOrdersByOrderStatusFromDBs("delivered"))??[];
        const invoice_generated_orders = (await fetchOrdersByOrderStatusFromDBs("invoice_generated"))??[];
        const invoice_pending_orders = (await fetchOrdersByOrderStatusFromDBs("invoice_pending"))??[];
        const orders = invoice_pending_orders.concat(invoice_generated_orders).concat(shipped_orders).concat(delivered_orders);


        const dex_orders = orders.filter(order => order.courier_id === "lk-dex" & order.tracking_number != undefined && order.tracking_number != '');
        dex_orders.reverse();

        const driver = getChromeDriver(true); // go headless chrome
        await driver.get("https://logistics.dex.lk/");

        const searchBar = await driver.findElement(By.className('searchBar'));
        const searchBtn = await driver.findElement(By.className('searchBtn'));
        
        for(const order of dex_orders){
            await clearInputField(searchBar);
            await searchBar.sendKeys(order.tracking_number); // Simulate file upload
            await searchBtn.click();

            await driver.sleep(3000)

            
            const elements = await driver.findElements(By.className('errorMessage'));
            if (elements.length > 0) {
                const revenue_status = getRevenueStatus(order, [])
                console.log( order.order_id + " - " + "Dex - No tracking - "+order.status +" - "+order.selected_payment_method.method+" - " + revenue_status)

                const alertText = await elements[0].getText();
                console.log(alertText);
                continue;
            }

            const trackin_data = await getTrackingDetails(driver);
            if(trackin_data.length == 0){
                console.log( order.order_id + " - " + "Dex - Tracking failed  - "+order.status +" - "+order.selected_payment_method.method)
                continue;
            }

            const status = getTrackingStatus(order, trackin_data)
            const revenue_status = getRevenueStatus(order, trackin_data)
            console.log( order.order_id + " - " + "Dex - "+trackin_data[0].status + "- "+order.status +" - "+order.selected_payment_method.method+" - " + revenue_status)

            await updateTrackingData(order.order_id, status, revenue_status, trackin_data);

            //clear the search bar
        }
        await driver.quit();

        console.log("completed dex")
        // const slpost_orders = orders.filter(order => order.courier_id === "sl-post");
        // for(const order of slpost_orders){            
        //     const revenue_status = getRevenueStatus(order, [])
        //     console.log( order.order_id + " - " + "SL Post - "+order.status +" - "+order.selected_payment_method.method+" - " + revenue_status)
        //     //await updateTrackingData(order.order_id, status, revenue_status, trackin_data);
        //     //clear the search bar
        // }
        // console.log("completed SL Post")
        // const prompt_orders = orders.filter(order => order.courier_id === "prompt-xpress");
        // for(const order of prompt_orders){            
        //     const revenue_status = getRevenueStatus(order, [])
        //     console.log(order.order_id + " - " +  "Prompt - "+order.status +" - "+order.selected_payment_method.method+" - " + revenue_status)
        //     await updateTrackingData(order.order_id, order.status, revenue_status, []);
        //     //clear the search bar
        // }
        // console.log("completed slpost")

        // const other_orders = orders.filter(order => !["lk-dex", "sl-post","prompt-xpress"].includes(order.courier_id));
        // for(const order of other_orders){            
        //     const revenue_status = getRevenueStatus(order, [])
        //     console.log( order.order_id + " - " + "Other - "+order.status +" - "+order.selected_payment_method.method+" - " + revenue_status)
        //     await updateTrackingData(order.order_id, order.status, revenue_status, []);
        //     //clear the search bar
        // }
        // console.log("completed prompt")

        // Close the driver after all tracking status operations are completed
    } catch (error) {
        log(error);
    }
}

async function clearInputField(inputElement) {
    // Get the current value of the input field
    let value = await inputElement.getAttribute('value');
    
    // Send backspace keystrokes until the field is empty
    while (value.length > 0) {
        await inputElement.sendKeys(Key.BACK_SPACE);
        value = await inputElement.getAttribute('value');
    }
}

const { Builder, By } = require('selenium-webdriver');

async function getTrackingDetails(driver) {
  try {

    // Wait for the timeline container to load
    await driver.wait(
      async () => (await driver.findElements(By.css('.timeline .row-item'))).length > 0,
      10000,
      'Timeline container not found'
    );

    // Find all timeline items
    const timelineItems = await driver.findElements(By.css('.timeline .row-item'));

    // Iterate through each timeline item
    const timelineData = [];
    for (const item of timelineItems) {
      // Extract status, time, and description
      const status = await item.findElement(By.css('.col-item-status.title')).getText();
      const time = await item.findElement(By.css('.col-item .date')).getText() + ' ' + await item.findElement(By.css('.col-item .minute')).getText();
      const description = await item.findElement(By.css('.col-item .subTitle')).getText();

      // Create object and push to array
      timelineData.push({ status, time, description });
    }

    return timelineData;
  }catch(er){
    console.log(er)
    return [];
  }
}

async function getTrackingStatusPromptXpress(driver2, order) {
    try {
        const trackingInput = await driver2.findElement(By.id('ContentPlaceHolder1_txtTrackingNo'));
        await trackingInput.clear();
        await trackingInput.sendKeys(order.tracking_number);
        await driver2.findElement(By.id('ContentPlaceHolder1_btnSearch')).click();

        // Wait for the element to be present on the page
        await driver2.wait(until.elementLocated(By.id('ContentPlaceHolder1_lblStatus')), 10000);

        const courier_status = await driver2.findElement(By.id("ContentPlaceHolder1_lblStatus")).getText();
        if (courier_status == "Status : Delivered") {
            updateInternalOrderStatus(order.order_id, OrderStatuses.delivered);
            addTrackingMessage(order.order_id, courier_status);
        } else {
            addTrackingMessage(order.order_id, courier_status);
        }
    } catch (error) {
        console.log(error);
    }
}

function getTrackingStatus(order,tracking_data ){
    if(tracking_data.length == 0){
        return undefined;
    }
    const dex_status = tracking_data[0].status
    if(["order_confirmed1","invoice_generated", "invoice_pending"].includes(order.status)){
        // if the order is in delivered status, mark it as delivered. return
        if(["Successful Delivery!"].includes(dex_status)){
            return "delivered";
        }
        // if the order is in returned status, mark it as returned. return
        if(["Package Successfully Returned"].includes(dex_status)){
            return "ndr";
        }
        // if the order is in any of the shipped statuses, mark it as shipped. return
        if(["Delivery Failed", "Redelivery Unsuccessful", "Out for Delivery", "Package Departed from Delivery Station",
        "Package Arrived at Delivery Station", "Delivery Unsuccessful", "Package Arriving Soon!", "Out for Delivery",
        "Package Departed from Delivery Station", "Package Arrived at Delivery Station", "Package Departed from Sorting Center",
        "Package Arrived at Sorting Center", "Package Accepted"].includes(dex_status)){
            return "shipped";
        }
        
    }
    
    if (order.status == "shipped") {
        // if the order is in delivered status, mark it as delivered. return
        if (["Successful Delivery!"].includes(dex_status)) {
            return "delivered";
        }
        // if the order is in returned status, mark it as returned. return
        if (["Package Successfully Returned"].includes(dex_status)) {
            return "ndr";
        }

        if (["Delivery Failed", "Redelivery Unsuccessful", "Out for Delivery", "Package Departed from Delivery Station",
            "Package Arrived at Delivery Station", "Delivery Unsuccessful", "Package Arriving Soon!", "Out for Delivery",
            "Package Departed from Delivery Station", "Package Arrived at Delivery Station", "Package Departed from Sorting Center",
            "Package Arrived at Sorting Center", "Package Accepted"].includes(dex_status)) {
            return "shipped";
        }
    }

    if (order.status == "delivered") {
        return "delivered"
    }

    
}


function getRevenueStatus(order,tracking_data ){
    //lk dex revenue status is based on the tracking status
    if(order.courier_id == "lk-dex"){
        const dex_status = getTrackingStatus(order, tracking_data);
        if(dex_status == "delivered"){
            return RevenueStatus.paid;
        }else if(dex_status == "shipped"){
            return RevenueStatus.pending;
        }
        if(!dex_status){
            if(["order_confirmed1","shipped","invoice_pending", "invoice_generated", "order_confirmed"].includes(order.status)){
                return RevenueStatus.pending;
            }else if(order.status == "delivered"){
                return RevenueStatus.paid;
            }else{
                return RevenueStatus.unknown
            }
        }
    }

    //sl-post revenue status is based on the tracking status
    if(["sl-post", "prompt-xpress"].includes(order.courier_id)){
        if(["cancelled", "ndr"].includes(order.status)){
            return RevenueStatus.reverse;
        }
        if(order.selected_payment_method.method == "bacs"){
            return RevenueStatus.realized;
        }else if((order.selected_payment_method.method == "cod" && order.status == "delivered")){
            return RevenueStatus.paid;
        }else if((order.selected_payment_method.method == "cod" && ["shipped","invoice_pending", "invoice_generated", "order_confirmed"].includes(order.status))){
                return RevenueStatus.pending;
        }else if((order.selected_payment_method.method == "webxpay")){
            return RevenueStatus.paid;
        }else{
            return RevenueStatus.unknown;
        }
    }
    
    //all other couriers and non-registered couriers
    if(["cancelled", "ndr"].includes(order.status)){
        return RevenueStatus.reverse;
    }
    if(order.selected_payment_method.method == "bacs"){
        return RevenueStatus.realized;
    }else if((order.selected_payment_method.method == "cod" && order.status == "delivered")){
        return RevenueStatus.paid;
    }else if((order.selected_payment_method.method == "cod" && ["shipped","invoice_pending", "invoice_generated", "order_confirmed"].includes(order.status))){
        return RevenueStatus.pending;
    }else if((order.selected_payment_method.method == "cheque" && order.status == "delivered")){
        return RevenueStatus.paid;
    }else if((order.selected_payment_method.method == "cheque" && ["shipped","invoice_pending", "invoice_generated", "order_confirmed"].includes(order.status))){
        return RevenueStatus.pending;        
    }else if((order.selected_payment_method.method == "webxpay")){
        return RevenueStatus.paid;
    }else{
        return RevenueStatus.unknown;
    }
}




//Production
async function runJob() {
    try{
    const schedule = '*/12 * * * *'
    console.log(`start : run schedule ${schedule}`)
    getCurrentTime()
    await entry_function();
    nodeSchedule.scheduleJob(schedule, async function () {
        try {
            getCurrentTime()
            await entry_function();
        } catch (error) {
            log(error)
            log("---------------------------------------------------------------")
        }
    })
}catch(error){}
}

runJob();