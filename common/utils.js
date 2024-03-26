

function log(message) {
console.log("log:"+message)
}


function generateRandomNumberString(length = 5) {
    // Create an array of digits (0-9)
    const digits = '0123456789';
  
    // Use a loop to build the random string
    let result = '';
    for (let i = 0; i < length; i++) {
      result += digits[Math.floor(Math.random() * digits.length)];
    }
  
    return result;
  }

  async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms*1000));
  }

  module.exports =  {
    log, generateRandomNumberString,sleep
  }