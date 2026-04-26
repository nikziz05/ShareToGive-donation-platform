const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const Volunteer = require('../models/Volunteer');
const auth = require('../middleware/auth');
const crypto = require('crypto');

// Get all schedules (admin)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }   
    const schedules = await Schedule.find()
      .populate('donorId', 'name phone email')
      .populate('donationId')
      .populate('assignedVolunteer', 'name phone email role')
      .sort({ date: 1 });
    
    // DEBUG: Log what we're sending
    console.log('\n=== BACKEND SCHEDULE DEBUG ===');
    console.log('Total schedules found:', schedules.length);
    schedules.forEach((s, idx) => {
      console.log(`${idx + 1}. ID: ${s._id}, Status: ${s.status}, Type: ${s.type}`);
    });
    res.json(schedules);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get donor's schedules
router.get('/my-schedules', auth, async (req, res) => {
  try {
    const schedules = await Schedule.find({ donorId: req.user.id })
      .populate('assignedVolunteer', 'name phone role')
      .sort({ date: 1 });
    res.json(schedules);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get volunteer's assigned schedules
router.get('/volunteer/:volunteerId', auth, async (req, res) => {
  try {
    const schedules = await Schedule.find({ 
      assignedVolunteer: req.params.volunteerId 
    })
      .populate('donorId', 'name phone email')
      .populate('donationId')
      .sort({ date: 1 });
    res.json(schedules);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update schedule (admin or assigned volunteer)
router.put('/:id', auth, async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Check permissions
    const isAdmin = req.user.role === 'admin';
    const isAssignedVolunteer = schedule.assignedVolunteer && 
                                 schedule.assignedVolunteer.toString() === req.user.id;
    
    if (!isAdmin && !isAssignedVolunteer) {
      return res.status(403).json({ message: 'Access denied' });
    }
    //Check if volunteer is cancelling
    const volunteerCancelling = isAssignedVolunteer && req.body.status === 'cancelled';

    // Generate OTP when volunteer is assigned
    if (req.body.assignedVolunteer && !schedule.assignedVolunteer) {
      req.body.otp = generateOTP();
      req.body.otpVerified = false;
      console.log('Generated OTP:', req.body.otp, 'for schedule:', req.params.id);
    }

    // Update schedule
    const updatedSchedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
      .populate('assignedVolunteer', 'name phone email role')
      .populate('donorId', 'name phone email')
      .populate('donationId');

      console.log('Schedule updated:', {
      id: updatedSchedule._id,
      status: updatedSchedule.status,
      volunteer: updatedSchedule.assignedVolunteer?.name,
      otp: updatedSchedule.otp
    });

    //Send admin notification if volunteer cancels
    if (volunteerCancelling) {
      try {
        const sendEmail = require('../utils/sendEmail');
        const Volunteer = require('../models/Volunteer');
        const volunteer = await Volunteer.findById(schedule.assignedVolunteer);
        const donor = updatedSchedule.donorId;
        
        await sendEmail({
          email: process.env.EMAIL_ADM, // Send to admin email
          subject: 'Volunteer Cancelled Assignment - Action Required',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
                .button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Volunteer Cancelled Assignment</h1>
                </div>
                <div class="content">
                  <div class="alert-box">
                    <p style="margin: 0; color: #92400e;"><strong>Action Required:</strong> A volunteer has cancelled their pickup assignment. Please assign a new volunteer.</p>
                  </div>
                  
                  <div class="info-box">
                    <h3 style="color: #1f2937; margin-top: 0;">Pickup Details:</h3>
                    <p><strong>Date:</strong> ${new Date(updatedSchedule.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p><strong>Time:</strong> ${updatedSchedule.time}</p>
                    ${updatedSchedule.address ? `<p><strong>Address:</strong> ${updatedSchedule.address}</p>` : ''}
                  </div>
                  
                  <div class="info-box">
                    <h3 style="color: #1f2937; margin-top: 0;">Donor Information:</h3>
                    <p><strong>Name:</strong> ${donor?.name || 'Donor'}</p>
                    ${donor?.phone ? `<p><strong>Phone:</strong> ${donor.phone}</p>` : ''}
                    ${donor?.email ? `<p><strong>Email:</strong> ${donor.email}</p>` : ''}
                  </div>
                  
                  <div class="info-box" style="border-left-color: #ef4444;">
                    <h3 style="color: #1f2937; margin-top: 0;">Cancelled By:</h3>
                    <p><strong>Volunteer:</strong> ${volunteer?.name || 'Unknown'}</p>
                    <p><strong>Role:</strong> ${volunteer?.role || 'N/A'}</p>
                  </div>
                  
                  <p style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/donations" class="button">Assign New Volunteer</a>
                  </p>
                  
                  <p style="margin-top: 30px;">
                    Best regards,<br>
                    <strong>KindNest System</strong>
                  </p>
                </div>
              </div>
            </body>
            </html>
          `
        });
        
        console.log('Admin notified about volunteer cancellation');
      } catch (emailError) {
        console.error('Admin notification error (non-critical):', emailError);
      }
    }

    // notify donor
if (volunteerCancelling && updatedSchedule.donorId?.email) {
  try {
    const sendEmail = require('../utils/sendEmail');
    const donor = updatedSchedule.donorId;
    
    await sendEmail({
      email: donor.email,
      subject: 'Pickup Schedule Update - KindNest',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Pickup Schedule Update</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${donor.name}</strong>,</p>
              
              <div class="alert-box">
                <p style="margin: 0; color: #92400e;">
                  The volunteer assigned to your pickup is no longer available. Our team is working to assign a new volunteer.
                </p>
              </div>
              
              <p><strong>Original Pickup Details:</strong></p>
              <p>Date: ${new Date(updatedSchedule.date).toLocaleDateString()}<br>
              Time: ${updatedSchedule.time}</p>
              
              <p>We will notify you as soon as a new volunteer is assigned. We apologize for any inconvenience.</p>
              
              <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>The KindNest Team</strong>
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    });
    
    console.log('Donor notified about cancellation');
  } catch (emailError) {
    console.error('Donor notification error (non-critical):', emailError);
  }
}

    
    // If volunteer is being assigned, you might want to send notification here
if (req.body.assignedVolunteer && !schedule.assignedVolunteer) {
  try {
    const sendEmail = require('../utils/sendEmail');
    const volunteer = updatedSchedule.assignedVolunteer;
    const donor = updatedSchedule.donorId;
    
    if (volunteer && volunteer.email && volunteer.email !== 'N/A') {
      await sendEmail({
        email: volunteer.email,
        subject: 'New Pickup Assignment - KindNest',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
              .urgent { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>New Pickup Assignment!</h1>
              </div>
              <div class="content">
                <p>Hello <strong>${volunteer.name}</strong>,</p>
                <p>You have been assigned a new pickup task! </p>
                
                <div class="info-box">
                  <h3 style="color: #1f2937; margin-top: 0;">Pickup Details:</h3>
                  <p><strong>Date:</strong> ${new Date(updatedSchedule.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p><strong>Time:</strong> ${updatedSchedule.time}</p>
                  ${updatedSchedule.address ? `<p><strong>Address:</strong> ${updatedSchedule.address}</p>` : ''}
                  ${updatedSchedule.phone ? `<p><strong>Contact:</strong> ${updatedSchedule.phone}</p>` : ''}
                  ${updatedSchedule.notes ? `<p><strong>Notes:</strong> ${updatedSchedule.notes}</p>` : ''}
                </div>
                
                <div class="info-box" style="border-left-color: #10b981;">
                  <h3 style="color: #1f2937; margin-top: 0;">Donor Information:</h3>
                  <p><strong>Name:</strong> ${donor?.name || 'Donor'}</p>
                  ${updatedSchedule.donorId?.phone ? `<p><strong>Phone:</strong> ${updatedSchedule.donorId.phone}</p>` : ''}
                  ${updatedSchedule.donorId?.email ? `<p><strong>Email:</strong> ${updatedSchedule.donorId.email}</p>` : ''}
                </div>
                
                <div class="urgent">
                  <p style="margin: 0; color: #92400e;"><strong>Action Required:</strong> Please log in to your volunteer dashboard to accept or view more details about this assignment.</p>
                </div>
                
                <p style="text-align: center; margin-top: 30px;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/volunteer/dashboard" class="button">View Assignment Details</a>
                </p>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                  <strong>Need to decline?</strong> No problem! Login to your dashboard and click the decline button if you're not available.
                </p>
                
                <p>Thank you for your dedication to helping our community! 💚</p>
                
                <p style="margin-top: 30px;">
                  Best regards,<br>
                  <strong>The KindNest Team</strong>
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      });
      
      console.log(`Assignment email sent to ${volunteer.email}`);
    }
  } catch (emailError) {
    console.error('Email notification error (non-critical):', emailError);
  }
}
//Email donor about volunteer assignment
    if (req.body.assignedVolunteer && updatedSchedule.assignedVolunteer && updatedSchedule.donorId) {
      try {
        const sendEmail = require('../utils/sendEmail');
        const volunteer = updatedSchedule.assignedVolunteer;
        const donor = updatedSchedule.donorId;
        
        if (donor.email) {
          await sendEmail({
            email: donor.email,
            subject: 'Volunteer Assigned for Your Donation Pickup - KindNest',
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                  .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
                  .volunteer-card { background: #dbeafe; padding: 15px; border-radius: 8px; margin: 15px 0; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>Volunteer Assigned for Pickup!</h1>
                  </div>
                  <div class="content">
                    <p>Hello <strong>${donor.name}</strong>,</p>
                    
                    <p>Great news! A volunteer has been assigned to pick up your donation.</p>
                    
                    <div class="info-box">
                      <h3 style="color: #1f2937; margin-top: 0;">Pickup Details:</h3>
                      <p><strong>Date:</strong> ${new Date(updatedSchedule.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      <p><strong>Time:</strong> ${updatedSchedule.time}</p>
                      ${updatedSchedule.address ? `<p><strong>Address:</strong> ${updatedSchedule.address}</p>` : ''}
                    </div>
                    
                    <div class="volunteer-card">
                      <h3 style="color: #1e40af; margin-top: 0;">Your Volunteer Contact:</h3>
                      <p><strong>Name:</strong> ${volunteer.name}</p>
                      <p><strong>Role:</strong> ${volunteer.role}</p>
                      <p><strong>Phone:</strong> <a href="tel:${volunteer.phone}" style="color: #2563eb;">${volunteer.phone}</a></p>
                      ${volunteer.email && volunteer.email !== 'N/A' ? `<p><strong>Email:</strong> <a href="mailto:${volunteer.email}" style="color: #2563eb;">${volunteer.email}</a></p>` : ''}
                    </div>
                    
                    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0;">
                      <p style="margin: 0; color: #92400e;"><strong>Please keep your phone handy</strong> so the volunteer can contact you if needed.</p>
                    </div>
                    
                    <p>Thank you for your generous donation! 💚</p>
                    
                    <p style="margin-top: 30px;">
                      Best regards,<br>
                      <strong>The KindNest Team</strong>
                    </p>
                  </div>
                </div>
              </body>
              </html>
            `
          });
          
          console.log(`Volunteer assignment email sent to donor ${donor.email}`);
        }
      } catch (emailError) {
        console.error('Email notification error (non-critical):', emailError);
      }
    }

        //Send OTP to donor
    if (req.body.otp && updatedSchedule.donorId && updatedSchedule.donorId.email) {
      try {
        const sendEmail = require('../utils/sendEmail');
        const donor = updatedSchedule.donorId;
        
        await sendEmail({
          email: donor.email,
          subject: 'Pickup Verification Code - KindNest',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .otp-box { background: white; padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0; border: 3px dashed #10b981; }
                .otp-code { font-size: 48px; font-weight: bold; color: #10b981; letter-spacing: 8px; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Your Pickup Verification Code</h1>
                </div>
                <div class="content">
                  <p>Hello <strong>${donor.name}</strong>,</p>
                  
                  <p>A volunteer has been assigned for your donation pickup. For security, please share this OTP code with the volunteer when they arrive:</p>
                  
                  <div class="otp-box">
                    <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">YOUR VERIFICATION CODE</p>
                    <div class="otp-code">${req.body.otp}</div>
                    <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 12px;">Valid for this pickup only</p>
                  </div>
                  
                  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0; color: #92400e;"><strong>Important:</strong> Only share this code with the volunteer at the time of pickup. Do not share it via phone or message.</p>
                  </div>
                  
                  <p><strong>Pickup Details:</strong></p>
                  <p>Date: ${new Date(updatedSchedule.date).toLocaleDateString()}<br>
                  Time: ${updatedSchedule.time}<br>
                   Address: ${updatedSchedule.address || 'Drop-off location'}</p>
                  
                  <p>Thank you for your donation! 💚</p>
                  
                  <p style="margin-top: 30px;">
                    Best regards,<br>
                    <strong>The KindNest Team</strong>
                  </p>
                </div>
              </div>
            </body>
            </html>
          `
        });
        
        console.log(`OTP ${req.body.otp} sent to donor ${donor.email}`);
      } catch (emailError) {
        console.error('OTP email error:', emailError);
      }
    }
    
    res.json(updatedSchedule);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// OTP verification:
router.post('/:id/verify-otp', auth, async (req, res) => {
  try {
    const { otp } = req.body;
    
    const schedule = await Schedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    if (schedule.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP code' });
    }
    
    schedule.otpVerified = true;
    await schedule.save();
    
    res.json({ message: 'OTP verified successfully', schedule });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = router;