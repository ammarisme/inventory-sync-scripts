const nodeSchedule = require('node-schedule');
const fs = require('fs');
const { OrderStatuses } = require('./statuses.js');
const { log, getCurrentTime } = require('./common/utils.js');
const { updateOrderStatus } = require('./services/woocommerce_functions.js');
const { fetchOldInvoice, createOrder } = require('./api.js');

async function sync() {
  try {
 const order_ids = ["DRZ214524106009345","DRZ214522500649583","DRZ214522426020360","DRZ214518911383927","DRZ214516982566556","DRZ214513699564098","DRZ214513047076902","DRZ214512908623428","DRZ214508082909238","DRZ214506616414595","DRZ214502955760888","DRZ214501529504561","DRZ214501527890889","DRZ214500080903194","DRZ214504401893567","DRZ214502605449467","DRZ214496806838054","DRZ214496740260598","DRZ214492372253853","DRZ214492332637750","DRZ214488707909253","DRZ214487253456271","DRZ214483093978410","DRZ214482096033123","DRZ214480626890233","DRZ214476280518841","DRZ214449103812240","DRZ214447603988273","DRZ214441000141283","DRZ214439811324928","DRZ214439624268951","DRZ214438308035184","DRZ214434058320133","DRZ214431301501449","DRZ214431278628469","DRZ214431107368081","DRZ214430214399826","DRZ214429726925853","DRZ214427000212395","DRZ214425258652116","DRZ214424805503454","DRZ214424008610746","DRZ214423649965817","DRZ214421988304028","DRZ214421515790999","DRZ214421300558608","DRZ214421186913271","DRZ214421145390604","DRZ214419754259585","DRZ214419655048060","DRZ214418809092775","DRZ214414411404179","DRZ214414031692801","DRZ214408272672993","DRZ214408065327931","CAT26050","CAT26049","DRZ214396103476503","DRZ214389490664272","DRZ214386249210746","DRZ214385285385351","DRZ214383886683520","DRZ214383483175749","DRZ214382751316726","DRZ214381673000392","DRZ214380258218708","CAT25999","CAT25992","CAT25985"];

 for(const id of order_ids){
  if(!id.startsWith("DRZ")){
    return;
  }
  const order = await fetchOldInvoice(id);
  let total = 0;
  order.invoice_data.line_items.forEach((item) => {
      total += parseFloat(item["Unit Price"]);
  });
  let line_items = order.invoice_data.line_items.map((item) => {
      return {    
          product_name: item["Item Name"],
          sku: item["Seller SKU"],
          quantity: 1,
          unit_price: item["Unit Price"]
      };
  });    
  // Create order object
  let createOrderDto = {
      order_id: order.invoice_number.slice(3),
      invoice_number: order.invoice_number,
      status: OrderStatuses.order_confirmed,
      status_history: [{ status: OrderStatuses.order_confirmed, status_remark: "" }],
      line_items: line_items,
      order_total: total,
      shipping_fee: 0,
      selected_payment_method: { method: "daraz" },
      customer: {
          first_name: order.invoice_data.line_items[0]["Billing Name"],
          last_name: "",
          phone: order.invoice_data.line_items[0]["Billing Phone Number"],
          email: "",
          address1: order.invoice_data.line_items[0]["Billing Address"],
          address2: "",
          state: order.invoice_data.line_items[0]["Shipping Address3"],
          city: order.invoice_data.line_items[0]["Shipping City"]
      },

  };

  console.log(createOrderDto)
  createOrder(createOrderDto)
 }

  } catch (error) {
    log(error);
  }
}

sync();