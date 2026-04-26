const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const Need = require('../models/Need');
const Schedule = require('../models/Schedule');
const Inventory = require('../models/Inventory');
const auth = require('../middleware/auth');

// Get all donations (admin)
router.get('/admin', auth, async(req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        const donations = await Donation.find()
            .populate('donorId', 'name email')
            .populate('needId', 'title')
            .sort({ createdAt: -1 });
        res.json(donations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Get user's donations
router.get('/my-donations', auth, async(req, res) => {
    try {
        const donations = await Donation.find({ donorId: req.user.id })
            .populate('needId', 'title ngo')
            .sort({ createdAt: -1 });
        res.json(donations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Create donation
router.post('/', auth, async(req, res) => {
    try {
      // Validate physical donation schedule data
    if (req.body.type === 'physical') {
      if (!req.body.scheduleData) {
        return res.status(400).json({ 
          message: 'Schedule data is required for physical donations' 
        });
      }
      
      const { date, time, deliveryMethod } = req.body.scheduleData;
      
      if (!date || !time || !deliveryMethod) {
        return res.status(400).json({ 
          message: 'Schedule must include date, time, and delivery method' 
        });
      }
      
      if (deliveryMethod === 'pickup' && !req.body.scheduleData.address) {
        return res.status(400).json({ 
          message: 'Pickup address is required for pickup donations' 
        });
      }
      
      if (deliveryMethod === 'drop-off' && !req.body.scheduleData.phone) {
        return res.status(400).json({ 
          message: 'Contact phone is required for drop-off donations' 
        });
      }
    }
        const donation = new Donation({
            ...req.body,
            donorId: req.user.id
        });

        // Check if donation would exceed need's goal
        if (donation.type === 'physical' && donation.quantity) {
            const need = await Need.findById(donation.needId);

            if (!need) {
                return res.status(404).json({ message: 'Need not found' });
            }

            // Calculate new total
            const newTotal = need.current + donation.quantity;

            if (newTotal > need.goal) {
                const remaining = need.goal - need.current;
                return res.status(400).json({
                    message: `This need only requires ${remaining} more items. The goal is ${need.goal} items and ${need.current} have already been donated.`
                });
            }
        }
        await donation.save();

        // Update need progress if physical donation
        if (donation.type === 'physical' && donation.quantity) {
            await Need.findByIdAndUpdate(
                donation.needId, { $inc: { current: donation.quantity } }
            );
        }

        // Create schedule if physical donation
        if (donation.type === 'physical' && req.body.scheduleData) {
          const scheduleData = req.body.scheduleData;
          // Get donor info for phone fallback
          const donor = await require('../models/User').findById(req.user.id);
          console.log('Donation ID:', donation._id);
          console.log('Donor ID:', req.user.id);
          console.log('Schedule Data:', JSON.stringify(scheduleData, null, 2));
          console.log('Creating schedule with data:', scheduleData);
          const schedule = new Schedule({
            donationId: donation._id,
            donorId: req.user.id,
            type: scheduleData.deliveryMethod || scheduleData.type, // Accept both field names
            date: scheduleData.date,
            time: scheduleData.time,
            address: scheduleData.address || '',
            phone: scheduleData.phone || donor.phone || '',
            notes: req.body.notes || '',
            status: 'pending'
  });
  
  await schedule.save();
  console.log('Schedule created:', schedule._id);
}

        res.json(donation);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// donation status (admin) 
router.put('/:id/status', auth, async(req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { status, location, inventoryAction, rejectionReason } = req.body;

    const donation = await Donation.findById(req.params.id)
      .populate('donorId', 'name email')
      .populate('needId', 'title');

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    donation.status = status;
    await donation.save();

    // If accepting physical donation and inventory action requested
    if (status === 'confirmed' && donation.type === 'physical' && inventoryAction === 'auto' && location) {
      try {
        let inventoryItem = await Inventory.findOne({
          name: donation.items,
          location: location
        });

        if (inventoryItem) {
          inventoryItem.quantity += donation.quantity;
          inventoryItem.lastUpdated = Date.now();
          await inventoryItem.save();
        } else {
          inventoryItem = new Inventory({
            name: donation.items,
            category: donation.needId?.category || 'other',
            quantity: donation.quantity,
            location: location
          });
          await inventoryItem.save();
        }
      } catch (invError) {
        console.error('Inventory update error:', invError);
      }
    }

    // Send email notification
    try {
      const sendEmail = require('../utils/sendEmail');

      const statusMessages = {
        confirmed: {
          subject: 'Donation Confirmed - KindNest',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1>Donation Confirmed!</h1>
              </div>
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                <p>Hello ${donation.donorId.name},</p>
                <p>Great news! Your donation has been confirmed by KindNest Foundation.</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #1f2937; margin-top: 0;">Donation Details:</h3>
                  <p><strong>For:</strong> ${donation.needId.title}</p>
                  <p><strong>Type:</strong> ${donation.type === 'money' ? `Money - ₹${donation.amount}` : `${donation.items} (${donation.quantity} items)`}</p>
                  ${donation.type === 'physical' ? `<p><strong>Delivery:</strong> ${donation.deliveryMethod}</p>` : ''}
                </div>
                
                ${donation.type === 'physical' ? '<p>Our team will contact you soon regarding the pickup/drop-off schedule.</p>' : '<p>Thank you for your generous contribution!</p>'}
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                  Track your donation anytime at <a href="${process.env.FRONTEND_URL || 'https://kindnestplatformproject.vercel.app'}">My Donations</a>
                </p>
              </div>
            </div>
          `
        },
        rejected: {
          subject: 'Donation Status Update - KindNest',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1>Donation Status Update</h1>
              </div>
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                <p>Hello ${donation.donorId.name},</p>
                <p>We regret to inform you that we cannot accept your donation at this time.</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #1f2937; margin-top: 0;">Donation Details:</h3>
                  <p><strong>For:</strong> ${donation.needId.title}</p>
                  <p><strong>Type:</strong> ${donation.type === 'money' ? `Money - ₹${donation.amount}` : `${donation.items} (${donation.quantity} items)`}</p>
                </div>
                
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p style="margin: 0; color: #92400e;"><strong>Reason:</strong> ${rejectionReason || 'The need has been fulfilled or items do not match current requirements.'}</p>
                </div>
                
                <p>Please browse other active needs where your contribution can make a difference!</p>
                
                <p style="text-align: center; margin-top: 30px;">
                  <a href="${process.env.FRONTEND_URL || 'https://kindnestplatformproject.vercel.app'}" style="background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Browse Needs</a>
                </p>
              </div>
            </div>
          `
        }
      };

      const emailData = statusMessages[status];
      if (emailData && donation.donorId.email) {
        await sendEmail({
          email: donation.donorId.email,
          subject: emailData.subject,
          html: emailData.html
        });
      }
    } catch (emailError) {
      console.error('Email error (non-critical):', emailError);
    }

    res.json({ 
      message: `Donation ${status}`, 
      donation,
      inventoryUpdated: status === 'confirmed' && inventoryAction === 'auto' 
    });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ message: 'Error updating donation status', error: err.message });
  }
});

module.exports = router;