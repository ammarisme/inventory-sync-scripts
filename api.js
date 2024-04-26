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


async function fetchConfirmedOrders() {
  try {
    
    const response = await fetch(API_BASE_URL+'/orders/by-status/order_confirmed');
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    const orders = await response.json();
    console.log('Confirmed Orders:', orders);
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
    createOrder, fetchConfirmedOrders, updateOrderStatusAPI
}