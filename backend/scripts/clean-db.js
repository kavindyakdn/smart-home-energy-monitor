/*
 * Delete all documents from every collection in the configured MongoDB database.
 * Uses MONGO_URI from environment. Preserves collections and indexes.
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function cleanDatabase() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error(
      'MONGO_URI is not set. Please configure it in your environment.',
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;

    const collections = await db.collections();
    if (!collections || collections.length === 0) {
      console.log('No collections found. Database is already clean.');
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log(
      `Connected to ${db.databaseName}. Cleaning ${collections.length} collections...`,
    );

    let totalDeleted = 0;
    for (const collection of collections) {
      try {
        const countBefore = await collection.countDocuments();
        if (countBefore > 0) {
          const result = await collection.deleteMany({});
          const deleted = result.deletedCount ?? 0;
          totalDeleted += deleted;
          console.log(
            `- ${collection.collectionName}: deleted ${deleted} documents`,
          );
        } else {
          console.log(`- ${collection.collectionName}: already empty`);
        }
      } catch (err) {
        console.error(
          `Failed cleaning collection ${collection.collectionName}:`,
          err.message,
        );
      }
    }

    console.log(`Done. Total documents deleted: ${totalDeleted}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Database cleanup failed:', err);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  }
}

cleanDatabase();
