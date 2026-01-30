const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

exports.sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `SymptomSync AI <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Email error:', error);
    throw error;
  }
};

// Send appointment reminder
exports.sendAppointmentReminder = async (appointment) => {
  const html = `
    <h2>Appointment Reminder</h2>
    <p>This is a reminder for your upcoming appointment:</p>
    <p><strong>Date:</strong> ${appointment.date}</p>
    <p><strong>Time:</strong> ${appointment.time}</p>
    <p><strong>Doctor:</strong> ${appointment.doctor.name}</p>
    <p>Please join the video call 5 minutes early.</p>
  `;

  await this.sendEmail({
    email: appointment.patient.email,
    subject: 'Appointment Reminder - SymptomSync AI',
    html
  });
};