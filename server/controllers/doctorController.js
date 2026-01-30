const User = require('../models/User');

// @desc    Get all available doctors
// @route   GET /api/doctors
// @access  Public
exports.getDoctors = async (req, res) => {
  try {
    const { specialty, available } = req.query;

    let query = { role: 'doctor' };

    if (specialty) {
      query.specialty = specialty;
    }

    if (available !== undefined) {
      query.isAvailable = available === 'true';
    }

    const doctors = await User.find(query).select('-password');

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single doctor
// @route   GET /api/doctors/:id
// @access  Public
exports.getDoctor = async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id).select('-password');

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update doctor availability
// @route   PUT /api/doctors/availability
// @access  Private (Doctor only)
exports.updateAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;

    const doctor = await User.findByIdAndUpdate(
      req.user.id,
      { isAvailable },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};