const express = require('express');
const router = express.Router();
const Volunteer = require('../models/Volunteer');
const auth = require('../middleware/auth');

// Get all volunteers (admin)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const volunteers = await Volunteer.find().sort({ joinedDate: -1 });
    res.json(volunteers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get single volunteer by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const volunteer = await Volunteer.findById(req.params.id);
    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }
    res.json(volunteer);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Public volunteer registration (NO AUTH REQUIRED)
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, role, availability, address, motivation } = req.body;

    // Validate required fields (EMAIL IS OPTIONAL)
    if (!name || !phone || !role || !availability) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, phone, role, and availability are required' 
      });
    }

    // Clean email value to prevent empty string duplicates
    let cleanEmail = undefined;  // Default to undefined
    
    if (email && email.trim() !== '' && email.toLowerCase() !== 'n/a') {
      cleanEmail = email.trim();
      
      // Check for existing email only if a valid email is provided
      const existing = await Volunteer.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(400).json({ 
          message: 'A volunteer with this email already exists' 
        });
      }
    }

    // Create volunteer with pending status
    const volunteerData = {
      name,
      email: cleanEmail,  // Will be undefined if not provided
      phone,
      role,
      availability,
      address: address || '',
      motivation: motivation || '',
      status: 'pending'
    };

    const volunteer = new Volunteer(volunteerData);
    await volunteer.save();
    
    res.json({ 
      message: 'Application submitted successfully! We will contact you soon.',
      volunteer: {
        id: volunteer._id,
        name: volunteer.name,
        status: volunteer.status
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    
    // Handle duplicate key error
    if (err.code === 11000) {
      if (err.keyPattern && err.keyPattern.email) {
        return res.status(400).json({ 
          message: 'A volunteer with this email already exists' 
        });
      }
      return res.status(400).json({ 
        message: 'Duplicate entry detected' 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Add volunteer (admin)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { name, email, phone, role, availability } = req.body;

    // Validate required fields
    if (!name || !phone || !role || !availability) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, phone, role, and availability are required' 
      });
    }

    // Set email to N/A if not provided or empty
    const volunteerData = {
      name,
      email: (email && email.trim() !== '' && email.toLowerCase() !== 'n/a') 
        ? email.trim() : undefined,
      phone,
      role,
      availability,
      status: req.body.status || 'active'
    };

    const volunteer = new Volunteer(volunteerData);
    await volunteer.save();
    res.json(volunteer);
  } catch (err) {
    console.error(err.message);
    if (err.code === 11000) {
      return res.status(400).json({ 
        message: 'A volunteer with this email already exists' 
      });
    }
    res.status(500).send('Server error');
  }
});

// Update volunteer (admin)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { sendEmail: shouldSendEmail, email, ...volunteerData } = req.body;
    
    // Clean email value before update
    let cleanEmail = undefined;
    
    if (email && email.trim() !== '' && email.toLowerCase() !== 'n/a') {
      cleanEmail = email.trim();
      
      // Check if email is being changed and if new email already exists
      const existingVolunteer = await Volunteer.findById(req.params.id);
      if (existingVolunteer && existingVolunteer.email !== cleanEmail) {
        const duplicate = await Volunteer.findOne({ 
          email: cleanEmail,
          _id: { $ne: req.params.id }  // Exclude current volunteer
        });
        
        if (duplicate) {
          return res.status(400).json({ 
            message: 'Another volunteer with this email already exists' 
          });
        }
      }
    }
    
    // Add cleaned email to update data
    const updateData = {
      ...volunteerData,
      email: cleanEmail  // Will be undefined if not provided
    };
    
    console.log('Volunteer ID:', req.params.id);
    console.log('Should send email:', shouldSendEmail);
    console.log('New status:', updateData.status);
    
    // Check if status is being changed to 'active' from 'pending'
    const oldVolunteer = await Volunteer.findById(req.params.id);
    console.log('Old volunteer status:', oldVolunteer?.status);
    console.log('Old volunteer email:', oldVolunteer?.email);
    
    const isNewlyApproved = oldVolunteer?.status === 'pending' && updateData.status === 'active';
    console.log('Is newly approved:', isNewlyApproved);
    
    const volunteer = await Volunteer.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    console.log('Updated volunteer email:', volunteer?.email);
    
    // Send approval email if requested and volunteer has valid email
    if (shouldSendEmail && isNewlyApproved && volunteer.email && volunteer.email !== 'N/A') {
      console.log('All conditions met, attempting to send email...');
      try {
        const sendEmail = require('../utils/sendEmail');
        
        await sendEmail({
          email: volunteer.email,
          subject: 'Welcome to KindNest - Volunteer Approval',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
                .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Welcome to KindNest!</h1>
                  <p style="font-size: 18px; margin-top: 10px;">You're now an approved volunteer</p>
                </div>
                <div class="content">
                  <p>Hello <strong>${volunteer.name}</strong>,</p>
                  
                  <p>Great news! Your volunteer application has been <strong style="color: #10b981;">approved</strong>! </p>
                  
                  <p>We're excited to have you join our team of volunteers making a real difference in our community.</p>
                  
                  <div class="info-box">
                    <h3 style="color: #1f2937; margin-top: 0;">Your Volunteer Details:</h3>
                    <p><strong>Role:</strong> ${volunteer.role}</p>
                    <p><strong>Availability:</strong> ${volunteer.availability}</p>
                    <p><strong>Phone:</strong> ${volunteer.phone}</p>
                  </div>
                  
                  <h3 style="color: #1f2937;">How to Get Started:</h3>
                  <ol style="color: #4b5563;">
                    <li><strong>Login:</strong> Visit the KindNest website and click "Volunteer Login"</li>
                    <li><strong>Use Your Phone:</strong> Login using your registered phone number: <strong>${volunteer.phone}</strong></li>
                    <li><strong>View Assignments:</strong> Check your dashboard for pickup assignments</li>
                    <li><strong>Accept Tasks:</strong> Accept assignments that match your availability</li>
                    <li><strong>Make an Impact:</strong> Complete pickups and help those in need!</li>
                  </ol>
                  
                  <p style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Login to Your Dashboard</a>
                  </p>
                  
                  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0; color: #92400e;"><strong>💡 Quick Tip:</strong> Bookmark the volunteer dashboard for easy access to your assignments!</p>
                  </div>
                  
                  <p>If you have any questions or need assistance, please don't hesitate to reach out to our team.</p>
                  
                  <p>Thank you for choosing to make a difference with KindNest! 💚</p>
                  
                  <p style="margin-top: 30px;">
                    Best regards,<br>
                    <strong>The KindNest Team</strong>
                  </p>
                </div>
                
                <div class="footer">
                  <p>KindNest Foundation | Connecting generosity with those in need</p>
                  <p>This is an automated message. Please do not reply to this email.</p>
                </div>
              </div>
            </body>
            </html>
          `
        });
        
        console.log(`Approval email sent to ${volunteer.email}`);
      } catch (emailError) {
        console.error('Email error (non-critical):', emailError);
        // Don't fail the request if email fails
      }
    }
    
    res.json(volunteer);
  } catch (err) {
    console.error('Update volunteer error:', err);
    
    // Handle duplicate key error
    if (err.code === 11000) {
      if (err.keyPattern && err.keyPattern.email) {
        return res.status(400).json({ 
          message: 'Another volunteer with this email already exists' 
        });
      }
      return res.status(400).json({ 
        message: 'Duplicate entry detected' 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Delete volunteer (admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    await Volunteer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Volunteer removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;