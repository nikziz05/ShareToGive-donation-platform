const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const cleanupSchedules = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const schedulesCollection = db.collection('schedules');

    // Get all schedules
    const allSchedules = await schedulesCollection.find({}).toArray();
    console.log('Total schedules in database:', allSchedules.length);
    
    // Show current status breakdown
    console.log('\n=== CURRENT STATUS BREAKDOWN ===');
    console.log('Pending:', allSchedules.filter(s => s.status === 'pending').length);
    console.log('Confirmed:', allSchedules.filter(s => s.status === 'confirmed').length);
    console.log('Completed:', allSchedules.filter(s => s.status === 'completed').length);
    console.log('Cancelled:', allSchedules.filter(s => s.status === 'cancelled').length);
    console.log('Other/Invalid:', allSchedules.filter(s => !['pending', 'confirmed', 'completed', 'cancelled'].includes(s.status)).length);
    
    // Show each schedule
    console.log('\n=== ALL SCHEDULES ===');
    allSchedules.forEach((s, idx) => {
      console.log(`${idx + 1}. Status: "${s.status}", Type: ${s.type}, Date: ${new Date(s.date).toLocaleDateString()}`);
    });
    
    // Ask if user wants to delete all schedules
    console.log('\n=== OPTIONS ===');
    console.log('To delete ALL schedules, uncomment the delete code below and run again.');
    
    // Uncomment these lines to DELETE all schedules
    // const result = await schedulesCollection.deleteMany({});
    // console.log(`\nDeleted ${result.deletedCount} schedules`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

cleanupSchedules();