const { Resend } = require('resend');

const sendEmail = async (options) => {
  try {
    console.log('=== EMAIL SEND START (Resend) ===');
    console.log('To:', options.email);
    console.log('Subject:', options.subject);
    
    // Initialize Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Send email
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'KindNest <onboarding@resend.dev>',
      to: [options.email],
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(error.message);
    }

    console.log('Email sent successfully via Resend!');
    console.log('Message ID:', data.id);
    console.log('=== EMAIL SEND SUCCESS ===');
    
    return data;
  } catch (error) {
    console.error('=== EMAIL SEND FAILED ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('=========================');
    throw new Error(`Email could not be sent: ${error.message}`);
  }
};

module.exports = sendEmail;