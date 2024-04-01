const { sleep } = require('./common/utils');

const MongoClient = require('mongodb').MongoClient;

var mongo_url = 'mongodb://abameerdeen:sajahafeel2216@erp.thesellerstack.com:27017'

async function  getCollection(collection_name) {
    try {
      const client = await MongoClient.connect(mongo_url);
      const db = client.db('catlitter'); // Assign connection to db after successful connection

      const docs = await db.collection(collection_name).find({}).toArray();
      console.log(docs)

      client.close(); // Close the connection after use
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteDocument(collection_name, filter) {
    try {
      const client = await MongoClient.connect(mongo_url);
      const db = client.db('catlitter');

      const result = await db.collection(collection_name).deleteOne(filter);
      console.log(`Documents deleted: ${result.deletedCount}`);

      client.close();
    } catch (err) {
      console.error(err);
      // Handle deletion error with appropriate response (e.g., res.status(500).send('Error deleting document'))
    }
  }

  async function updateDocument(collection_name, filter, update) {
    try {
      const client = await MongoClient.connect(mongo_url);
      const db = client.db('catlitter');

      const result = await db.collection(collection_name).updateOne(filter, update);
      console.log(`Documents modified: ${result.modifiedCount}`);

      client.close();
    } catch (err) {
      console.error(err);
      // Handle update error with appropriate response (e.g., res.status(500).send('Error updating document'))
    }
  }
  async function insertDocument(collection_name, document) {
    try {
      const client = await MongoClient.connect(mongo_url);
      const db = client.db('catlitter');

      const currentDate = new Date();

    // Add the current date and time to the document
      document.createdAt = currentDate;
      document.updatedAt = currentDate;

      const result = await db.collection(collection_name).insertOne(document);
      console.log(`Document inserted with ID: ${result.insertedId}`);

      client.close();
    } catch (err) {
      console.error(err);
      // Handle insertion error with appropriate response (e.g., res.status(500).send('Error inserting document'))
    }
  }
  
  async function upsertDocument(collection_name, filter, document) {
    let client;
    while(true){
    try {
      client = await MongoClient.connect(mongo_url);
      const db = client.db('catlitter');

      const currentDate = new Date();

      // Add the current date and time to the document
      document.updatedAt = currentDate;

      const updateOptions = { upsert: true }; // Set upsert option
      const update = { $set: document }; // Update document fields using $set
  
      const result = await db.collection(collection_name).updateOne(filter, update, updateOptions);
  
      if (result.upsertedCount > 0) {
        console.log(`Document inserted with ID: ${result.upsertedId}`);
      } else {
        console.log(`Document updated with modified count: ${result.modifiedCount}`);
      }
  
      client.close();
      break
    } catch (err) {
      console.error(err);
      await sleep(2)
      // Handle upsert error with appropriate response
    }
  }
  }

  async function getCollectionBy(collection_name,filter) {
    try {
      const client = await MongoClient.connect(mongo_url);
      const db = client.db('catlitter'); // Assign connection to db after successful connection
  
      const docs = await db.collection(collection_name).find(filter).toArray();
      client.close(); // Close the connection after use
      return docs
    } catch (err) {
      console.error(err);
    }
  }
  
// Export all functions using named exports
module.exports = {
  getCollection,
  deleteDocument,
  updateDocument,
  insertDocument,
  getCollectionBy,
  upsertDocument
};
