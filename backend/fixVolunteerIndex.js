const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const fixIndex = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('volunteers');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);

    // Drop the old index
    try {
      await collection.dropIndex('email_1');
      console.log('Dropped old email_1 index');
    } catch (err) {
      console.log('No index to drop or error:', err.message);
    }

    // Create new sparse unique index
    await collection.createIndex({ email: 1 }, { unique: true, sparse: true });
    console.log('Created new sparse unique index on email');

     // Clean up any empty string emails (convert to undefined)
    const result = await collection.updateMany(
      { email: '' },
      { $unset: { email: '' } }
    );
    console.log(`Cleaned up ${result.modifiedCount} documents with empty email strings`);

    // Clean up any 'N/A' emails
    const result2 = await collection.updateMany(
      { email: 'N/A' },
      { $unset: { email: '' } }
    );
    console.log(`Cleaned up ${result2.modifiedCount} documents with 'N/A' emails`);
    console.log('\nEmail index fixed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixIndex();