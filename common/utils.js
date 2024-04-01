

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

  function getCurrentTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
  
    // Adjust format as desired (e.g., 24-hour, AM/PM)
    const formattedTime = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    console.log("Current time:", formattedTime);
  }
  

  module.exports =  {
    log, generateRandomNumberString,sleep,getCurrentTime
  }