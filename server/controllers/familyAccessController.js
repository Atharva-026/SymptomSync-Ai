// server/controllers/familyAccessController.js

const User = require('../models/User');
const { sendEmail } = require('../services/emailService');

/**
 * Send family member invitation
 */
exports.inviteFamilyMember = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { email, relationship, permissions } = req.body;

    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(400).json({ message: 'Only patients can invite family members' });
    }

    // Initialize privacySettings if not exists
    if (!patient.privacySettings) {
      patient.privacySettings = {
        allowFamilyAccess: true,
        requireApprovalForAccess: true
      };
    }

    // Initialize familyMembers array if not exists
    if (!patient.familyMembers) {
      patient.familyMembers = [];
    }

    if (!patient.privacySettings.allowFamilyAccess) {
      return res.status(403).json({ message: 'Family access is disabled in privacy settings' });
    }

    let familyMember = await User.findOne({ email: email.toLowerCase() });

    if (!familyMember) {
      return res.status(400).json({ 
        message: 'Family member must register first',
        suggestRegistration: true 
      });
    }

    const existingMember = patient.familyMembers.find(
      fm => fm.userId && fm.userId.toString() === familyMember._id.toString()
    );

    if (existingMember) {
      return res.status(400).json({ 
        message: 'This family member is already added',
        status: existingMember.status 
      });
    }

    const newFamilyMember = {
      userId: familyMember._id,
      relationship,
      permissions: {
        viewRecords: permissions?.viewRecords || false,
        manageAppointments: permissions?.manageAppointments || false,
        viewAssessments: permissions?.viewAssessments || false,
        manageMedications: permissions?.manageMedications || false,
        uploadRecords: permissions?.uploadRecords || false,
        emergencyContact: permissions?.emergencyContact || false
      },
      status: patient.privacySettings.requireApprovalForAccess ? 'pending' : 'accepted',
      addedBy: patientId,
      invitedAt: new Date()
    };

    patient.familyMembers.push(newFamilyMember);
    await patient.save();

    // Initialize accessToPatients for family member if not exists
    if (!familyMember.accessToPatients) {
      familyMember.accessToPatients = [];
    }

    familyMember.accessToPatients.push({
      patientId: patientId,
      relationship,
      permissions: newFamilyMember.permissions,
      status: newFamilyMember.status,
      grantedAt: newFamilyMember.status === 'accepted' ? new Date() : null
    });
    await familyMember.save();

    // Send email notification - FIXED to match your emailService
    try {
      if (familyMember.email) {
        await sendEmail({
          email: familyMember.email,  // Changed from 'to' to 'email'
          subject: 'Family Access Request - SymptomSync AI',
          html: `
            <h2>Family Access Request</h2>
            <p>Hi ${familyMember.name},</p>
            <p><strong>${patient.name}</strong> has invited you to be their <strong>${relationship}</strong> 
            with access to manage their health records on SymptomSync AI.</p>
            <p><strong>Permissions granted:</strong></p>
            <ul>
              ${permissions.viewRecords ? '<li>View Medical Records</li>' : ''}
              ${permissions.manageAppointments ? '<li>Manage Appointments</li>' : ''}
              ${permissions.viewAssessments ? '<li>View Assessments</li>' : ''}
              ${permissions.manageMedications ? '<li>Manage Medications</li>' : ''}
              ${permissions.uploadRecords ? '<li>Upload Records</li>' : ''}
              ${permissions.emergencyContact ? '<li>Emergency Contact</li>' : ''}
            </ul>
            <p>Please log in to your account to accept or decline this request.</p>
            <p>Best regards,<br>SymptomSync AI Team</p>
          `
        });
        console.log('✅ Invitation email sent to:', familyMember.email);
      }
    } catch (emailError) {
      console.log('⚠️ Email notification failed, but invitation was created:', emailError.message);
      // Don't fail the whole request if email fails
    }

    res.status(201).json({
      message: 'Family member invitation sent successfully',
      familyMember: {
        id: familyMember._id,
        name: familyMember.name,
        email: familyMember.email,
        relationship,
        status: newFamilyMember.status
      }
    });

  } catch (error) {
    console.error('Error inviting family member:', error);
    res.status(500).json({ message: 'Failed to invite family member', error: error.message });
  }
};

/**
 * Accept or reject family access request
 */
exports.respondToInvitation = async (req, res) => {
  try {
    const familyMemberId = req.user.id;
    const { patientId, action } = req.body;

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Must be "accept" or "reject"' });
    }

    const familyMember = await User.findById(familyMemberId);
    
    if (!familyMember.accessToPatients || familyMember.accessToPatients.length === 0) {
      return res.status(404).json({ message: 'No invitations found' });
    }

    const accessRequest = familyMember.accessToPatients.find(
      ap => ap.patientId.toString() === patientId && ap.status === 'pending'
    );

    if (!accessRequest) {
      return res.status(404).json({ message: 'Invitation not found or already processed' });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    accessRequest.status = newStatus;
    if (newStatus === 'accepted') {
      accessRequest.grantedAt = new Date();
    }
    await familyMember.save();

    const patient = await User.findById(patientId);
    const familyMemberEntry = patient.familyMembers?.find(
      fm => fm.userId.toString() === familyMemberId
    );
    
    if (familyMemberEntry) {
      familyMemberEntry.status = newStatus;
      if (newStatus === 'accepted') {
        familyMemberEntry.acceptedAt = new Date();
      }
      await patient.save();
    }

    // Send confirmation email to patient
    try {
      if (patient.email) {
        await sendEmail({
          email: patient.email,  // Changed from 'to' to 'email'
          subject: `Family Access ${action === 'accept' ? 'Accepted' : 'Declined'}`,
          html: `
            <h2>Family Access Update</h2>
            <p>Hi ${patient.name},</p>
            <p><strong>${familyMember.name}</strong> has <strong>${action === 'accept' ? 'accepted' : 'declined'}</strong> 
            your request to access their health records.</p>
            <p>Best regards,<br>SymptomSync AI Team</p>
          `
        });
      }
    } catch (emailError) {
      console.log('⚠️ Email notification failed:', emailError.message);
    }

    res.json({
      message: `Invitation ${action}ed successfully`,
      status: newStatus
    });

  } catch (error) {
    console.error('Error responding to invitation:', error);
    res.status(500).json({ message: 'Failed to process invitation', error: error.message });
  }
};

/**
 * Get all family members for a patient
 */
exports.getFamilyMembers = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId)
      .populate('familyMembers.userId', 'name email phone')
      .populate('primaryCaregiver', 'name email phone');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      familyMembers: user.familyMembers || [],
      primaryCaregiver: user.primaryCaregiver
    });

  } catch (error) {
    console.error('Error fetching family members:', error);
    res.status(500).json({ message: 'Failed to fetch family members', error: error.message });
  }
};

/**
 * Get all patients the current user has access to
 */
exports.getAccessiblePatients = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId)
      .populate('accessToPatients.patientId', 'name email phone dateOfBirth gender');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const acceptedPatients = (user.accessToPatients || []).filter(
      ap => ap.status === 'accepted'
    );

    res.json({
      patients: acceptedPatients
    });

  } catch (error) {
    console.error('Error fetching accessible patients:', error);
    res.status(500).json({ message: 'Failed to fetch patients', error: error.message });
  }
};

/**
 * Get pending invitations for current user
 */
exports.getPendingInvitations = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId)
      .populate('accessToPatients.patientId', 'name email phone');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const pendingInvitations = (user.accessToPatients || []).filter(
      ap => ap.status === 'pending'
    );

    res.json({
      invitations: pendingInvitations
    });

  } catch (error) {
    console.error('Error fetching pending invitations:', error);
    res.status(500).json({ message: 'Failed to fetch invitations', error: error.message });
  }
};

/**
 * Update family member permissions
 */
exports.updatePermissions = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { familyMemberId, permissions } = req.body;

    const patient = await User.findById(patientId);
    
    if (!patient.familyMembers || patient.familyMembers.length === 0) {
      return res.status(404).json({ message: 'No family members found' });
    }

    const familyMemberEntry = patient.familyMembers.find(
      fm => fm.userId.toString() === familyMemberId
    );

    if (!familyMemberEntry) {
      return res.status(404).json({ message: 'Family member not found' });
    }

    familyMemberEntry.permissions = {
      ...familyMemberEntry.permissions,
      ...permissions
    };
    await patient.save();

    const familyMember = await User.findById(familyMemberId);
    if (familyMember && familyMember.accessToPatients) {
      const accessEntry = familyMember.accessToPatients.find(
        ap => ap.patientId.toString() === patientId
      );
      
      if (accessEntry) {
        accessEntry.permissions = familyMemberEntry.permissions;
        await familyMember.save();
      }
    }

    res.json({
      message: 'Permissions updated successfully',
      permissions: familyMemberEntry.permissions
    });

  } catch (error) {
    console.error('Error updating permissions:', error);
    res.status(500).json({ message: 'Failed to update permissions', error: error.message });
  }
};

/**
 * Revoke family member access
 */
exports.revokeFamilyAccess = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { familyMemberId } = req.params;

    const patient = await User.findById(patientId);
    
    if (!patient.familyMembers || patient.familyMembers.length === 0) {
      return res.status(404).json({ message: 'No family members found' });
    }

    const familyMemberEntry = patient.familyMembers.find(
      fm => fm.userId.toString() === familyMemberId
    );

    if (!familyMemberEntry) {
      return res.status(404).json({ message: 'Family member not found' });
    }

    familyMemberEntry.status = 'revoked';
    await patient.save();

    const familyMember = await User.findById(familyMemberId);
    if (familyMember && familyMember.accessToPatients) {
      const accessEntry = familyMember.accessToPatients.find(
        ap => ap.patientId.toString() === patientId
      );
      
      if (accessEntry) {
        accessEntry.status = 'revoked';
        await familyMember.save();
      }
    }

    // Send notification email
    try {
      if (familyMember && familyMember.email) {
        await sendEmail({
          email: familyMember.email,  // Changed from 'to' to 'email'
          subject: 'Family Access Revoked - SymptomSync AI',
          html: `
            <h2>Access Revoked</h2>
            <p>Hi ${familyMember.name},</p>
            <p><strong>${patient.name}</strong> has revoked your access to their health records.</p>
            <p>Best regards,<br>SymptomSync AI Team</p>
          `
        });
      }
    } catch (emailError) {
      console.log('⚠️ Email notification failed:', emailError.message);
    }

    res.json({
      message: 'Family access revoked successfully'
    });

  } catch (error) {
    console.error('Error revoking access:', error);
    res.status(500).json({ message: 'Failed to revoke access', error: error.message });
  }
};

/**
 * Set primary caregiver
 */
exports.setPrimaryCaregiver = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { familyMemberId } = req.body;

    const patient = await User.findById(patientId);
    
    const familyMemberEntry = patient.familyMembers?.find(
      fm => fm.userId.toString() === familyMemberId && fm.status === 'accepted'
    );

    if (!familyMemberEntry) {
      return res.status(400).json({ 
        message: 'Family member must be added and accepted first' 
      });
    }

    patient.primaryCaregiver = familyMemberId;
    await patient.save();

    res.json({
      message: 'Primary caregiver set successfully',
      primaryCaregiver: familyMemberId
    });

  } catch (error) {
    console.error('Error setting primary caregiver:', error);
    res.status(500).json({ message: 'Failed to set primary caregiver', error: error.message });
  }
};