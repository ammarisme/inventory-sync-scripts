const fs = require('fs');
function readCSV(filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const rows = fileContent.trim().split('\n')
    const header = rows[0].split(',')
    const data = rows.slice(1).map(row => row.split(','))
  
    const groupedData = {}
  
    data.forEach(row => {
      const key = row[2]
  
      const rowData = {}
      header.forEach((col, index) => {
        rowData[col.trim().replace(/"/g, '')] = row[index].trim().replace(/"/g, '')
      })
      groupedData[key] = rowData
    })
  
    // fs.unlink(filePath)
    // console.log(`File ${filePath} deleted successfully!`)
  
    return groupedData
  }
  
  function convertToCSV(processingOrders, prefix) {
    // Add header row
    const header = "Invoice No.,Firstname,Middlename,Lastname,Customer Phone number,Customer Email,Address Line1,Address Line 2,City,State,Product name,Product SKU,Quantity,Product Unit of measurement,Unit Price,Item Tax,Item Discount,Shipping Charges"
  
    // Loop through each order
    processingOrders.forEach(order => {
      // Add main header
      const csvContent = [];
      csvContent.push(header);
      // Loop through each line item
      const nosku = order.line_items.find(i => i.sku == '')
      if (nosku) {
        console.log(`No SKU / Order id : ${order.id},  Product : ${nosku.id},${nosku.name} `)
        return
      }
      first_line = true
      order.line_items.forEach(item => {
        // No need to extract data, just create empty cells
        csvContent.push(`${prefix}${order.number},${order.billing.first_name},,${order.billing.last_name}, ${order.billing.first_name},${order.billing.phone},${order.billing.email},"${order.billing.address_1}","${order.billing.address_2}","${order.billing.state}","${item.name}",${item.sku},${item.quantity},pieces,${item.price},,,${first_line ? order.shipping_total: 0}`);
        first_line = false
      });
      const csvString = csvContent.join('\n');
  
      // Write CSV to file
      fs.writeFileSync(`.\\invoices\\${prefix}${order.number}_invoice.csv`, csvString);
      console.log(`${prefix}${order.number}_invoice.csv file created successfully!`);
    });
  
    return;
  }

  
  
  function convertDarazToCSV(processingOrders) {
    // Add header row
    const header = "Invoice No.,Firstname,Middlename,Lastname,Customer Phone number,Customer Email,Address Line1,Address Line 2,City,State,Product name,Product SKU,Quantity,Product Unit of measurement,Unit Price,Item Tax,Item Discount,Shipping Charges"
  
    // Loop through each order
    processingOrders.forEach(order => {
      if(!order.invoice_data.line_items){
return
      }
      // Add main header
      const csvContent = [];
      csvContent.push(header);
      // Loop through each line item
      order.invoice_data.line_items.forEach(item => {
        // No need to extract data, just create empty cells
        const first_name = item["Customer Name"].split(" ")[0]
        const last_name = item["Customer Name"].split(" ")[1]?item["Customer Name"].split(" ")[1] : ""
        const phone_number = item["Billing Phone Number"]
        const email = item["Customer Email"]
        const address1 = `${item["Billing Address"]},${item["Billing Address2"]}`
        const address2 = `${item["Billing Address5"]},${item["Billing Address4"]}`
        const state = item["Billing Address3"]
        const item_name = item["Item Name"]
        const sku = item["Seller SKU"]
        const price = item["Unit Price"]
        const shipping_total = 0
        const quantity = 1
  
        csvContent.push(`"${order.invoice_number}","${first_name}","","${last_name}","${phone_number}","${email}","${address1}","${address2}","","${state}","${item_name}","${sku}",${quantity},"pieces","${price}","","",""`);
      });
      const csvString = csvContent.join('\n');
  
      // Write CSV to file
      fs.writeFileSync(`.\\invoices\\${order.invoice_number}.csv`, csvString);
      console.log(`${order.invoice_number}.csv file created successfully!`);
    });
  
    return;
  }

  module.exports ={
    readCSV, convertDarazToCSV, convertToCSV
    
  }