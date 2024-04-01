
const axios = require('axios');
const { getCollectionBy, insertDocument, upsertDocument, updateDocument } = require('../mongo_functions');
const { WOOCOMMERCE_ORDER_REPROCESS_SCHEDULED } = require('../statuses');


async function getProcessingOrders() {
    while (true) {
      try {
        const url = 'https://catlitter.lk/wp-json/wc/v3/orders?status=processing&page=1&per_page=100';
        const headers = {
          Authorization: 'Basic Y2tfYjdlNTVlMTdjY2U4ZDEzYjA1MGM4MmU3Yjg1ZmRlZjg5MzVhM2FjNzpjc185NGZjZDg0MTliZTgzZmUzYWZjMGNlZTJmOGRjNjEwZWUwYTUzNWYy',
        };
  
        const response = await axios.get(url,  {headers});
        return response.data;
      } catch (error) {
        throw new Error(`Failed to call API: ${error.message}`);
      }
    }
  }

  async function getTestOrders() {
    while (true) {
      try {
        const url = 'https://catlitter.lk/wp-json/wc/v3/orders?status=init-test&page=1&per_page=100';
        const headers = {
          Authorization: 'Basic Y2tfYjdlNTVlMTdjY2U4ZDEzYjA1MGM4MmU3Yjg1ZmRlZjg5MzVhM2FjNzpjc185NGZjZDg0MTliZTgzZmUzYWZjMGNlZTJmOGRjNjEwZWUwYTUzNWYy',
        };
  
        const response = await axios.get(url,  {headers});
        return response.data;
      } catch (error) {
        throw new Error(`Failed to call API: ${error.message}`);
      }
    }
  }


  async function getInvoiceGenerateOrders() {
    while (true) {
      try {
        const url = 'https://catlitter.lk/wp-json/wc/v3/orders?status=invoice-generate&page=1&per_page=100';
        const headers = {
          Authorization: 'Basic Y2tfYjdlNTVlMTdjY2U4ZDEzYjA1MGM4MmU3Yjg1ZmRlZjg5MzVhM2FjNzpjc185NGZjZDg0MTliZTgzZmUzYWZjMGNlZTJmOGRjNjEwZWUwYTUzNWYy',
        };
  
        const response = await axios.get(url, { headers });
        return response.data;
      } catch (error) {
        throw new Error(`Failed to call API: ${error.message}`);
      }
    }
  }
  
  async function createOrderNote(order_id, note) {
    // Call the PUT API to update the stock quantity
    const apiUrl = `https://catlitter.lk/wp-json/wc/v3/orders/${order_id}/notes`;
    const data = {
      note: note,
      author: "system",
      customer_note: false
    }
  
    try {
      const postResponse = await axios.post(apiUrl, data, {
        headers: {
          Authorization: 'Basic Y2tfNDdjMzk3ZjNkYzY2OGMyY2UyZThlMzU4YjdkOWJlYjZkNmEzMTgwMjpjc19kZjk0MDdkOWZiZDVjYzE0NTdmMDEwNTY3ODdkMjFlMTAyZmUwMTJm',  // Replace 'asd' with your actual authorization code
          'Content-Type': 'application/json'
        }
      });
  
    } catch (error) {
      console.error(`Failed to create note: ${order_id}`, error);
    }
  }
  
  async function updateOrderStatus(order_id, status) {
    // Call the PUT API to update the stock quantity
    const apiUrl = `https://catlitter.lk/wp-json/wc/v3/orders/${order_id}`;
    const data = {
      status: status
    }
  
    try {
      const putReponse = await axios.post(apiUrl, data, {
        headers: {
          Authorization: 'Basic Y2tfNDdjMzk3ZjNkYzY2OGMyY2UyZThlMzU4YjdkOWJlYjZkNmEzMTgwMjpjc19kZjk0MDdkOWZiZDVjYzE0NTdmMDEwNTY3ODdkMjFlMTAyZmUwMTJm',  // Replace 'asd' with your actual authorization code
          'Content-Type': 'application/json'
        }
      });
  
    } catch (error) {
      console.error(`Failed to create note: ${order_id}`, error);
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
  
  
async function getScheduledWoocommerceOrders() {
  let woo_orders = []
  db_invoices = await getCollectionBy("invoices", { status: WOOCOMMERCE_ORDER_REPROCESS_SCHEDULED })
  for (i = 0; i < db_invoices.length; i++) {
      let order = db_invoices[i]
      if (order.invoice_number.indexOf("CAT") == -1) {
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

module.exports = {
    getProcessingOrders, createOrderNote, updateOrderStatus, getProduct, getScheduledWoocommerceOrders,getInvoiceGenerateOrders, getTestOrders  
}