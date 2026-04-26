const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const updateOldSchedules = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const schedulesCollection = db.collection('schedules');

    // Find schedules older than 7 days that are still pending
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const oldPending = await schedulesCollection.find({
      status: 'pending',
      date: { $lt: sevenDaysAgo }
    }).toArray();

    console.log(`Found ${oldPending.length} old pending schedules (>7 days old)`);
    
    if (oldPending.length > 0) {
      console.log('\nMarking them as completed...');
      
      const result = await schedulesCollection.updateMany(
        {
          status: 'pending',
          date: { $lt: sevenDaysAgo }
        },
        {
          $set: { status: 'completed' }
        }
      );
      
      console.log(`Updated ${result.modifiedCount} schedules to completed`);
    } else {
      console.log('No old pending schedules found');
    }
    
    // Show final counts
    const finalCounts = {
      pending: await schedulesCollection.countDocuments({ status: 'pending' }),
      confirmed: await schedulesCollection.countDocuments({ status: 'confirmed' }),
      completed: await schedulesCollection.countDocuments({ status: 'completed' })
    };
    
    console.log('\n=== FINAL COUNTS ===');
    console.log('Pending:', finalCounts.pending);
    console.log('Confirmed:', finalCounts.confirmed);
    console.log('Completed:', finalCounts.completed);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

updateOldSchedules();