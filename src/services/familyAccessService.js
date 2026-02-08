// src/services/familyAccessService.js

import api from './api';

const familyAccessService = {
  /**
   * Invite a family member
   */
  inviteFamilyMember: async (data) => {
    return await api.post('/family-access/invite', data);
  },

  /**
   * Respond to a family access invitation
   */
  respondToInvitation: async (patientId, action) => {
    return await api.post('/family-access/respond', { patientId, action });
  },

  /**
   * Get all family members for current patient
   */
  getFamilyMembers: async () => {
    return await api.get('/family-access/members');
  },

  /**
   * Get all patients current user has access to
   */
  getAccessiblePatients: async () => {
    return await api.get('/family-access/patients');
  },

  /**
   * Get pending invitations
   */
  getPendingInvitations: async () => {
    return await api.get('/family-access/invitations');
  },

  /**
   * Update family member permissions
   */
  updatePermissions: async (familyMemberId, permissions) => {
    return await api.put('/family-access/permissions', {
      familyMemberId,
      permissions
    });
  },

  /**
   * Revoke family member access
   */
  revokeFamilyAccess: async (familyMemberId) => {
    return await api.delete(`/family-access/revoke/${familyMemberId}`);
  },

  /**
   * Set primary caregiver
   */
  setPrimaryCaregiver: async (familyMemberId) => {
    return await api.post('/family-access/primary-caregiver', { familyMemberId });
  },

  /**
   * Get patient data on behalf of (for family members)
   */
  getPatientAppointments: async (patientId) => {
    return await api.get(`/appointments?patientId=${patientId}`);
  },

  /**
   * Get patient assessments on behalf of
   */
  getPatientAssessments: async (patientId) => {
    return await api.get(`/assessments?patientId=${patientId}`);
  },

  /**
   * Get patient medical records on behalf of
   */
  getPatientMedicalRecords: async (patientId) => {
    return await api.get(`/medical-records?patientId=${patientId}`);
  },

  /**
   * Create appointment on behalf of patient
   */
  createAppointmentForPatient: async (patientId, appointmentData) => {
    return await api.post('/appointments', {
      ...appointmentData,
      patientId
    });
  },

  /**
   * Upload medical record on behalf of patient
   */
  uploadRecordForPatient: async (patientId, formData) => {
    formData.append('patientId', patientId);
    return await api.post('/medical-records', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

export default familyAccessService;