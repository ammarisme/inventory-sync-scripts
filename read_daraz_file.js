const fs = require('fs');

function readCSV(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const rows = fileContent.trim().split('\n');
  const header = rows[0].split(',');
  const data = rows.slice(1).map(row => row.split(','));

  const groupedData = {};

  data.forEach(row => {
      const key = row[8];
      if (!groupedData[key]) {
          groupedData[key] = [];
      }
      const rowData = {};
      header.forEach((col, index) => {
          rowData[col] = row[index];
      });
      groupedData[key].push(rowData);
  });

  return groupedData;
}

function getDarazOrders(){
const filePath = "C:\\Users\\Ammar Ameerdeen\\Downloads\\daraz_orders.csv";
const groupedData = readCSV(filePath);

return groupedData
}

module.exports = getDarazOrders;
