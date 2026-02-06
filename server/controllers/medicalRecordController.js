const MedicalRecord = require('../models/MedicalRecord');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { analyzeWithAI } = require('../services/aiAnalysisService');

// @desc    Upload medical record
// @route   POST /api/medical-records
// @access  Private (Patient only)
exports.uploadRecord = async (req, res) => {
  try {
    const { title, description, recordType, recordDate, tags } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    // Generate unique share token
    const shareToken = uuidv4();

    // Generate QR code URL (will be used by doctor to access)
    const qrCodeUrl = `${process.env.CLIENT_URL}/records/view/${shareToken}`;
    
    // Generate QR code as base64 image
    const qrCodeImage = await QRCode.toDataURL(qrCodeUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Create medical record
    const record = await MedicalRecord.create({
      patient: req.user.id,
      title,
      description,
      recordType,
      recordDate: recordDate || new Date(),
      fileUrl: `/uploads/medical-records/${req.file.filename}`,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      shareToken,
      qrCode: qrCodeImage,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });

    res.status(201).json({
      success: true,
      data: record
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

// @desc    Get all medical records for logged in patient
// @route   GET /api/medical-records
// @access  Private (Patient only)
exports.getMyRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.find({ 
      patient: req.user.id,
      isArchived: false 
    })
      .populate('sharedWith.doctor', 'name email specialty')
      .sort('-uploadDate');

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single medical record
// @route   GET /api/medical-records/:id
// @access  Private
exports.getRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate('patient', 'name email age gender')
      .populate('sharedWith.doctor', 'name email specialty');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Check if user is authorized
    const isOwner = record.patient._id.toString() === req.user.id;
    const isSharedDoctor = record.sharedWith.some(
      share => share.doctor._id.toString() === req.user.id
    );

    if (!isOwner && !isSharedDoctor) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this record'
      });
    }

    res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get record by share token (QR code scan)
// @route   GET /api/medical-records/share/:token
// @access  Public (but validates doctor)
exports.getRecordByToken = async (req, res) => {
  try {
    const { token } = req.params;

    const record = await MedicalRecord.findOne({ shareToken: token })
      .populate('patient', 'name email age gender')
      .populate('sharedWith.doctor', 'name email specialty');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Record not found or link expired'
      });
    }

    // If user is logged in and is a doctor, add to shared list
    if (req.user && req.user.role === 'doctor') {
      const alreadyShared = record.sharedWith.some(
        share => {
          const doctorId = typeof share.doctor === 'object' ? share.doctor._id : share.doctor;
          return doctorId.toString() === req.user.id;
        }
      );

      if (!alreadyShared) {
        record.sharedWith.push({
          doctor: req.user.id,
          sharedAt: new Date(),
          accessExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          accessCount: 1
        });
        await record.save();
      } else {
        // Increment access count
        const shareIndex = record.sharedWith.findIndex(
          share => {
            const doctorId = typeof share.doctor === 'object' ? share.doctor._id : share.doctor;
            return doctorId.toString() === req.user.id;
          }
        );
        record.sharedWith[shareIndex].accessCount += 1;
        await record.save();
      }
    }

    res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Share record with specific doctor
// @route   POST /api/medical-records/:id/share
// @access  Private (Patient only)
exports.shareWithDoctor = async (req, res) => {
  try {
    const { doctorId, accessDays } = req.body;

    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }

    // Check if user owns this record
    if (record.patient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Check if already shared
    const alreadyShared = record.sharedWith.some(
      share => share.doctor.toString() === doctorId
    );

    if (alreadyShared) {
      return res.status(400).json({
        success: false,
        message: 'Record already shared with this doctor'
      });
    }

    // Add to shared list
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (accessDays || 30));

    record.sharedWith.push({
      doctor: doctorId,
      sharedAt: new Date(),
      accessExpiry: expiryDate,
      accessCount: 0
    });

    await record.save();

    res.status(200).json({
      success: true,
      message: 'Record shared successfully',
      data: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Request AI analysis of medical record
// @route   POST /api/medical-records/:id/analyze
// @access  Private
exports.analyzeRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }

    // Check authorization
    const isOwner = record.patient.toString() === req.user.id;
    const isSharedDoctor = record.sharedWith.some(
      share => share.doctor.toString() === req.user.id
    );

    if (!isOwner && !isSharedDoctor) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // If already analyzed, return existing analysis
    if (record.aiAnalysis && record.aiAnalysis.summary) {
      return res.status(200).json({
        success: true,
        data: record.aiAnalysis,
        message: 'Using cached analysis'
      });
    }

    // Perform AI analysis
    const filePath = path.join(__dirname, '..', record.fileUrl);
    const analysis = await analyzeWithAI(filePath, record.fileType);

    // Update record with analysis
    record.aiAnalysis = {
      summary: analysis.summary,
      keyFindings: analysis.keyFindings,
      abnormalValues: analysis.abnormalValues,
      recommendations: analysis.recommendations,
      analyzedAt: new Date(),
      model: 'gemini-pro'
    };

    await record.save();

    res.status(200).json({
      success: true,
      data: record.aiAnalysis
    });
  } catch (error) {
    console.error('AI Analysis Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze record',
      error: error.message
    });
  }
};

// @desc    Delete medical record
// @route   DELETE /api/medical-records/:id
// @access  Private (Patient only)
exports.deleteRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }

    if (record.patient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '..', record.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await record.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get records shared with logged in doctor
// @route   GET /api/medical-records/shared-with-me
// @access  Private (Doctor only)
exports.getSharedRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.find({
      'sharedWith.doctor': req.user.id,
      isArchived: false
    })
      .populate('patient', 'name email age gender')
      .sort('-uploadDate');

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};