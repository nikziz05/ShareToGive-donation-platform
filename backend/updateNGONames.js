const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Need = require('./models/Need');

dotenv.config();

const updateNGONames = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const result = await Need.updateMany(
      { ngo: 'Hope Foundation' },
      { $set: { ngo: 'KindNest Foundation' } }
    );

    console.log(`Updated ${result.modifiedCount} needs`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

updateNGONames();