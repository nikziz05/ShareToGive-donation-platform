const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const fixEmailIndex = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('volunteers');

    // Step 1: Get all current indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:');
    indexes.forEach(idx => {
      console.log(`   - ${JSON.stringify(idx.key)} ${idx.unique ? '(unique)' : ''} ${idx.sparse ? '(sparse)' : ''}`);
    });
    console.log('');

    // Step 2: Drop ALL email-related indexes
    console.log('Dropping old email indexes...');
    for (const index of indexes) {
      if (index.key.email !== undefined && index.name !== '_id_') {
        try {
          await collection.dropIndex(index.name);
          console.log(` Dropped index: ${index.name}`);
        } catch (err) {
          console.log(`Could not drop ${index.name}: ${err.message}`);
        }
      }
    }
    console.log('');

    // Step 3: Clean up problematic email values
    console.log('Cleaning up email data...');
    
    // Remove empty string emails
    const result1 = await collection.updateMany(
      { email: '' },
      { $unset: { email: '' } }
    );
    console.log(` Removed ${result1.modifiedCount} empty string emails`);

    // Remove 'N/A' emails
    const result2 = await collection.updateMany(
      { email: 'N/A' },
      { $unset: { email: '' } }
    );
    console.log(` Removed ${result2.modifiedCount} 'N/A' emails`);

    // Remove null emails
    const result3 = await collection.updateMany(
      { email: null },
      { $unset: { email: '' } }
    );
    console.log(` Removed ${result3.modifiedCount} null emails`);
    console.log('');

    // Step 4: Create new sparse unique index
    console.log('Creating new sparse unique index on email...');
    await collection.createIndex(
      { email: 1 }, 
      { 
        unique: true, 
        sparse: true,
        name: 'email_1_sparse'
      }
    );
    console.log('Created sparse unique index successfully');
    console.log('');

    // Step 5: Verify the fix
    const newIndexes = await collection.indexes();
    console.log('Final indexes:');
    newIndexes.forEach(idx => {
      console.log(`   - ${JSON.stringify(idx.key)} ${idx.unique ? '(unique)' : ''} ${idx.sparse ? '(sparse)' : ''}`);
    });
    console.log('');

    // Step 6: Count volunteers without email
    const noEmailCount = await collection.countDocuments({ email: { $exists: false } });
    const withEmailCount = await collection.countDocuments({ email: { $exists: true } });
    console.log('Volunteer Statistics:');
    console.log(`   - Volunteers with email: ${withEmailCount}`);
    console.log(`   - Volunteers without email: ${noEmailCount}`);
    console.log('');

    console.log('Email index fixed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
};

fixEmailIndex();