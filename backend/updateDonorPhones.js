const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const updateDonorPhones = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Find all donors without phone numbers
    const donorsWithoutPhone = await usersCollection.find({
      role: 'donor',
      $or: [
        { phone: { $exists: false } },
        { phone: null },
        { phone: '' }
      ]
    }).toArray();

    console.log(`Found ${donorsWithoutPhone.length} donors without phone numbers`);
    console.log('\nDonors:');
    donorsWithoutPhone.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.name} (${user.email})`);
    });

    console.log('\nYou need to add phone numbers for these donors manually in MongoDB Compass');
    console.log('Or they can update their profile in the app');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

updateDonorPhones();