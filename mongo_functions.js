const { sleep } = require('./common/utils');
const { mydb, mongo_url } = require('./config');

const MongoClient = require('mongodb').MongoClient;


async function  getCollection(collection_name) {
    try {
      const client = await MongoClient.connect(mongo_url);
      const db = client.db(mydb); // Assign connection to db after successful connection

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
      const db = client.db(mydb);

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
      const db = client.db(mydb);

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
      const db = client.db(mydb);

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

  async function insertMultipleDocuments(collection_name, documents) {
    try {
      const client = await MongoClient.connect(mongo_url);
      const db = client.db(mydb);
  
      const currentDate = new Date();
  
      // Add current date and time to each document
      documents.forEach(doc => {
        doc.createdAt = currentDate;
        doc.updatedAt = currentDate;
      });
  
      const result = await db.collection(collection_name).insertMany(documents);
  
      console.log(`${result.insertedCount} documents inserted with IDs: ${result.insertedIds}`);
  
      client.close();
    } catch (err) {
      console.error(err);
      // Handle insertion error with appropriate response (e.g., res.status(500).send('Error inserting documents'))
    }
  }

  async function updateCollectionStatus(collection_name, filter, update) {
    try {
      const client = await MongoClient.connect(mongo_url);
      const db = client.db(mydb);
      const updateResult = await db.collection(collection_name).updateMany(filter, {
        $set: update}, // Set the status to 4
      );
  
      console.log(`Updated ${updateResult.modifiedCount} documents.`);
      await client.close();
    } catch (err) {
      console.error("Error updating collection:", err);
    }
  }

  async function upsertDocument(collection_name, filter, document) {
    let client;
    while(true){
    try {
      client = await MongoClient.connect(mongo_url);
      const db = client.db(mydb);

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
      const db = client.db(mydb); // Assign connection to db after successful connection
  
      const docs = await db.collection(collection_name).find(filter).toArray();
      client.close(); // Close the connection after use
      return docs
    } catch (err) {
      console.error(err);
    }
  }
  
  async function updateCollectionStatus(collection_name, filter, update) {
    try {
      const client = await MongoClient.connect(mongo_url);
      const db = client.db(mydb);
      const updateResult = await db.collection(collection_name).updateMany(filter, {
        $set: update}, // Set the status to 4
      );
  
      console.log(`Updated ${updateResult.modifiedCount} documents.`);
      await client.close();
    } catch (err) {
      console.error("Error updating collection:", err);
    }
  }
// Export all functions using named exports
module.exports = {
  getCollection,
  deleteDocument,
  updateDocument,
  insertDocument,
  getCollectionBy,
  upsertDocument,
  updateCollectionStatus,
  insertMultipleDocuments
};
