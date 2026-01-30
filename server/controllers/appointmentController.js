const Appointment = require('../models/Appointment');
const Assessment = require('../models/Assessment');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');
const { emitNotification } = require('../socket/socketHandler');

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Private (Patient only)
exports.createAppointment = async (req, res) => {
  try {
    const {
      doctorId,
      assessmentId,
      date,
      time,
      isUrgent,
      riskLevel
    } = req.body;

    // Check if doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check if assessment exists
    let assessment = null;
    if (assessmentId) {
      assessment = await Assessment.findById(assessmentId);
    }

    // Create appointment
    const appointment = await Appointment.create({
      patient: req.user.id,
      doctor: doctorId,
      assessment: assessmentId,
      date,
      time,
      isUrgent,
      riskLevel,
      consultationType: 'video'
    });

    // Populate patient and doctor details
    await appointment.populate('patient', 'name email');
    await appointment.populate('doctor', 'name email specialty');

    // Send email to doctor
    const emailContent = `
      <h2>New Appointment Scheduled</h2>
      <p><strong>Patient:</strong> ${appointment.patient.name}</p>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Time:</strong> ${time}</p>
      <p><strong>Risk Level:</strong> ${riskLevel}%</p>
      ${isUrgent ? '<p style="color: red;"><strong>⚠️ URGENT APPOINTMENT</strong></p>' : ''}
      <p>Please login to your dashboard to view details.</p>
    `;

    await sendEmail({
      email: doctor.email,
      subject: 'New Patient Appointment - SymptomSync AI',
      html: emailContent
    });

    // Send email to patient
    const patientEmailContent = `
      <h2>Appointment Confirmed</h2>
      <p>Dear ${appointment.patient.name},</p>
      <p>Your appointment has been successfully scheduled.</p>
      <p><strong>Doctor:</strong> ${appointment.doctor.name}</p>
      <p><strong>Specialty:</strong> ${appointment.doctor.specialty}</p>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Time:</strong> ${time}</p>
      <p>You will receive a reminder 15 minutes before your appointment.</p>
    `;

    await sendEmail({
      email: appointment.patient.email,
      subject: 'Appointment Confirmation - SymptomSync AI',
      html: patientEmailContent
    });

    // Emit real-time notification to doctor
    emitNotification(doctorId, {
      type: 'NEW_APPOINTMENT',
      message: `New appointment from ${appointment.patient.name}`,
      appointment: appointment
    });

    res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all appointments for logged in user
// @route   GET /api/appointments
// @access  Private
exports.getAppointments = async (req, res) => {
  try {
    let query;

    if (req.user.role === 'patient') {
      query = { patient: req.user.id };
    } else if (req.user.role === 'doctor') {
      query = { doctor: req.user.id };
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'name email age gender')
      .populate('doctor', 'name email specialty experience rating')
      .populate('assessment')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
exports.getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email age gender')
      .populate('doctor', 'name email specialty experience')
      .populate('assessment');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user is authorized to view this appointment
    if (
      appointment.patient._id.toString() !== req.user.id &&
      appointment.doctor._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this appointment'
      });
    }

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id
// @access  Private
exports.updateAppointment = async (req, res) => {
  try {
    const { status, roomUrl, notes, prescription } = req.body;

    let appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Update fields
    if (status) appointment.status = status;
    if (roomUrl) appointment.roomUrl = roomUrl;
    if (notes) appointment.notes = notes;
    if (prescription) appointment.prescription = prescription;

    if (status === 'in-progress' && !appointment.startTime) {
      appointment.startTime = new Date();
    }

    if (status === 'completed' && !appointment.endTime) {
      appointment.endTime = new Date();
    }

    await appointment.save();

    // Populate details
    await appointment.populate('patient', 'name email');
    await appointment.populate('doctor', 'name email');

    // Emit notification
    const recipientId = req.user.role === 'doctor' 
      ? appointment.patient._id 
      : appointment.doctor._id;

    emitNotification(recipientId, {
      type: 'APPOINTMENT_UPDATE',
      message: `Appointment status updated to ${status}`,
      appointment: appointment
    });

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Cancel appointment
// @route   DELETE /api/appointments/:id
// @access  Private
exports.cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};