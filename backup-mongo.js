const { MongoClient } = require('mongodb');
const fs = require('fs');
const { log, getCurrentTime } = require('./common/utils');
const nodeSchedule = require('node-schedule');

// Connection URI
let mongo_url = "mongodb://admin:sajahafeel123@erp.thesellerstack.com:27017"

// Database Name
const dbName = 'catlitter';

// Create a new MongoClient
const client = new MongoClient(mongo_url, { useUnifiedTopology: true });

async function downloadCollections(directory) {
    try {
        await fs.mkdir('./backup/'+directory, { recursive: true }, () => {});

        // Connect to the MongoDB server
        await client.connect();
        

        console.log('Connected to the MongoDB server');

        // Access the database
        const db = client.db(dbName);

        // Get list of all collections in the database
        const collections = await db.listCollections().toArray();

        // Loop through each collection and download its data
        for (let collection of collections) {
            const collectionName = collection.name;
            console.log(`Downloading data from collection: ${collectionName}`);

            // Fetch all documents from the collection
            const collectionData = await db.collection(collectionName).find().toArray();

            // Write collection data to a JSON file
            const fileName = `./backup/${directory}/${collectionName}.json`;
            fs.writeFileSync(fileName, JSON.stringify(collectionData, null, 2));
            console.log(`Data downloaded and saved to file: ${fileName}`);
        }

        console.log('All collections downloaded successfully');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        // Close the client connection
        await client.close();
        console.log('Connection closed');
    }
}

// Call the function to download collections



async function runJob() {
    try {
        const schedule = '*/12 * * * *' 
        console.log(`start : run schedule ${schedule}`);
      const time = getCurrentTime();
      await downloadCollections(Date.now());
      nodeSchedule.scheduleJob(schedule, async function () {
        try {
          getCurrentTime();
          await downloadCollections(Date.now());
        } catch (error) {
          log(error);
          log("---------------------------------------------------------------");
        }
      });
    } catch (error) {
      log(error);
    }
  }
  
  runJob();