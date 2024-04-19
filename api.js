const axios = require('axios');
const { API_BASE_URL } = require('./statuses');

async function createOrder(order){
    axios.post(API_BASE_URL+'/orders', order)
    .then(response => {
      console.log('Response:', response.data);
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

async function updateInternalOrderStatus(id, status){
    axios.put(API_BASE_URL+'/orders/update-status', {
        order_id : id,
        status : status
    })
    .then(response => {
      console.log('Response:', response.data);
    })
    .catch(error => {
      console.error('Error:', error);
    });
}


module.exports = {
    createOrder, updateInternalOrderStatus
}