const { API_BASE_URL } = require('./statuses');
const axios = require('./common.modules');

async function createOrder(order){
    axios.post(API_BASE_URL+'/orders', order)
    .then(response => {
      console.log('Response:', response.data);
    })
    .catch(error => {
      console.error('Error:', error);
    });
}


async function fetchUnInvoicedOrders() {
  try {
    
    const response = await fetch(API_BASE_URL+'/orders/uninvoiced');
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    const orders = await response.json();
    return orders;
  } catch (error) {
    console.error('Error fetching confirmed orders:', error.message);
    return null;
  }
}

async function updateTrackingData(order_id, status, revenue_status, tracking_data) {
  try {
    const payload = {
      order_id: order_id,
      status: status,
      revenue_status: revenue_status,
      tracking_data: tracking_data
    };

    console.log(payload)
    const response = await fetch(API_BASE_URL + '/orders/update-tracking-data', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Failed to update tracking data');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error updating tracking data:', error.message);
    return null;
  }
}


async function fetchOrdersByOrderStatusFromDBs(status) {
  try {
    
    const response = await fetch(API_BASE_URL+'/orders/by-status/'+status);
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    const orders = await response.json();
    return orders;
  } catch (error) {
    console.error('Error fetching confirmed orders:', error.message);
    return null;
  }
}

async function fetchOldInvoice(invoice_number) {
  try {
    const response = await fetch(API_BASE_URL+'/invoice/by-invoice_number/'+invoice_number);
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    const orders = await response.json();
    return orders;
  } catch (error) {
    console.error('Error fetching confirmed orders:', error.message);
    return null;
  }
}

async function updateOrderStatusAPI(orderId, newStatus, status_remark) {
  try {
    const response = await fetch(API_BASE_URL+'/orders/update-status-with-remark', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: orderId,
        status: newStatus,
        status_remark : status_remark
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to update order status');
    }
    const updatedOrder = await response.json();
    console.log('Updated Order:', updatedOrder);
    return updatedOrder;
  } catch (error) {
    console.error('Error updating order status:', error.message);
    return null;
  }
}

module.exports = {
    createOrder, fetchUnInvoicedOrders, updateOrderStatusAPI,fetchOldInvoice, fetchOrdersByOrderStatusFromDBs, updateTrackingData
}