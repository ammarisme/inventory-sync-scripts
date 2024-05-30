const nodeSchedule = require('node-schedule');
const fs = require('fs');
const {Select, Builder, By, Key, until } = require('selenium-webdriver');

const { loginStoreMate, getChromeDriver } = require('./selenium_functions.js');
const { OrderStatuses } = require('./statuses.js');
const { updateOrderStatusAPI, fetchOrdersByOrderStatusFromDBs } = require('./api.js');
const { log, getCurrentTime } = require('./common/utils.js');
const { updateOrderStatus, getOrdersByStatus } = require('./services/woocommerce_functions.js');
const getDarazOrders = require('./read_daraz_file.js');

async function sync() {
  try {

    // const woocommerce_orders = await getOrdersByStatus("invoiced", 1)
    

    // const db_orders = await fetchOrdersByOrderStatusFromDBs("invoice_pending");
    // if (db_orders == 0) {
    //   log("no orders to process");
    //   return;
    // }

    // for(const order of db_orders){
    //   const woo_order = woocommerce_orders.find(o => o.id == order.order_id)
    //     if(woo_order && woo_order.id == order.order_id && woo_order.status == "invoiced"){
    //         await updateOrderStatusAPI(order.order_id, OrderStatuses.invoice_generated,"bulk changed");    
    //     }
    // }
    // Update based on daraz files.
    // const daraz_orders = getDarazOrders()
    // for(const order of invoiced_orders){
    //     if(daraz_orders[order.order_id]){
    //         await updateOrderStatusAPI(order.order_id, OrderStatuses.shipped,"bulk changed");    
    //     }
    // }

    const regenerate = await fetchOrdersByOrderStatusFromDBs("regenerate");


    for(const order of regenerate){
      await updateOrderStatusAPI(order.order_id, OrderStatuses.order_confirmed,"bulk changed for regeneration");
    }
    

  } catch (error) {
    log(error);
  }
}

sync()