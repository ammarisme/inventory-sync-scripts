const nodeSchedule = require('node-schedule');
const { log, getCurrentTime } = require('./common/utils.js')
const {  OrderStatuses } = require('./statuses.js'); 
const { createOrder, updateOrderStatusAPI } = require('./api.js');
const { getProcessingOrders, getInvoiceGenerateOrders, getOrdersByStatus } = require('./services/woocommerce_functions.js')


async function entry_function() {
    try {
    
    const processing_orders = await getOrdersByStatus("processing", 1)
    if (processing_orders.length == 0) {
        log("no orders to process")
    }else{
        //create new orders
        for(order of processing_orders){
            let total = 0;
            order.line_items.forEach((item) => {
                total += item.quantity * item.price;
            });
            let line_items = order.line_items.map((item) => {
                return {
                    product_name: item.name,
                    sku: item.sku,
                    quantity: item.quantity,
                    unit_price: item.price
                };
            });    
            // Create order object
            let createOrderDto = {
                order_id: order.number,
                invoice_number: "CAT" + order.number,
                status: OrderStatuses.order_confirmed,
                status_history: [{ status: OrderStatuses.order_confirmed, status_remark: "" }],
                line_items: line_items,
                order_total: total,
                shipping_fee: order.shipping_total,
                selected_payment_method: { method: order.payment_method },
                customer: {
                    first_name: order.billing.first_name,
                    last_name: order.billing.last_name,
                    phone: order.billing.phone,
                    email: order.billing.email,
                    address1: order.billing.address_1,
                    address2: order.billing.address_2,
                    state: order.billing.state
                },
            };

            await createOrder(createOrderDto)
        }
    }

    const invoice_generate_orders = await getOrdersByStatus("invoice-generate", 1)
    if (invoice_generate_orders.length == 0) {
        log("no orders to process")
    }else{
        //update order statuses
        for(order of invoice_generate_orders){
            //update order using api
            updateOrderStatusAPI(order.number, OrderStatuses.order_confirmed, "")
        }
    }
    } catch (error) {
        log(error)
    }
}

//Production
async function runJob() {
    try{
    const schedule = '*/5 * * * *'
    console.log(`start : run schedule ${schedule}`)
    getCurrentTime()
    entry_function()
    nodeSchedule.scheduleJob(schedule, async function () {
        try {
            getCurrentTime()
            entry_function()
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


