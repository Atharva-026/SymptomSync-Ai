import api from './api';

// Files are stored encrypted and served only through authenticated endpoints, so
// they can no longer be opened with a plain <a href>. We fetch the decrypted
// bytes as a Blob (the JWT is attached by the axios interceptor) and show that.

// With responseType 'blob', error bodies arrive as a Blob too - read the message out of it.
const blobErrorMessage = async (error, fallback) => {
  const data = error.response?.data;
  if (data instanceof Blob) {
    try {
      return JSON.parse(await data.text()).message || fallback;
    } catch (e) {
      return fallback;
    }
  }
  return data?.message || fallback;
};

// The tab is opened synchronously inside the click so popup blockers allow it,
// then pointed at the blob once the download finishes.
const openBlobInNewTab = async (loadBlob, fileName) => {
  const tab = window.open('', '_blank');
  try {
    const blob = await loadBlob();
    const url = URL.createObjectURL(blob);
    if (tab) {
      tab.location.href = url;
    } else {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'medical-record';
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
    setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
  } catch (err) {
    if (tab) tab.close();
    throw err;
  }
};

const medicalRecordService = {
  // Upload medical record
  uploadRecord: async (formData) => {
    try {
      const response = await api.post('/medical-records', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to upload record';
    }
  },

  // Get all my records
  getMyRecords: async () => {
    try {
      const response = await api.get('/medical-records');
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch records';
    }
  },

  // Get single record
  getRecord: async (recordId) => {
    try {
      const response = await api.get(`/medical-records/${recordId}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch record';
    }
  },

  // Get record by share token (QR scan)
  getRecordByToken: async (token) => {
    try {
      const response = await api.get(`/medical-records/share/${token}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch shared record';
    }
  },

  // Share record with doctor
  shareWithDoctor: async (recordId, doctorId, accessDays = 30) => {
    try {
      const response = await api.post(`/medical-records/${recordId}/share`, {
        doctorId,
        accessDays,
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to share record';
    }
  },

  // Delete record
  deleteRecord: async (recordId) => {
    try {
      const response = await api.delete(`/medical-records/${recordId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to delete record';
    }
  },

  // Get records shared with me (doctor)
  getSharedRecords: async () => {
    try {
      const response = await api.get('/medical-records/shared-with-me');
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch shared records';
    }
  },

  // Records of a patient the current user has family access to
  getPatientRecords: async (patientId) => {
    try {
      const response = await api.get('/medical-records', { params: { patientId } });
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch records';
    }
  },

  // Open the decrypted file (owner / family / doctor) in a new tab
  openRecordFile: (recordId, fileName) =>
    openBlobInNewTab(async () => {
      try {
        const response = await api.get(`/medical-records/${recordId}/file`, {
          responseType: 'blob',
        });
        return response.data;
      } catch (error) {
        throw await blobErrorMessage(error, 'Failed to open file');
      }
    }, fileName),

  // Open the decrypted file for a QR share token (no login needed)
  openSharedFile: (token, fileName) =>
    openBlobInNewTab(async () => {
      try {
        const response = await api.get(`/medical-records/share/${token}/file`, {
          responseType: 'blob',
        });
        return response.data;
      } catch (error) {
        throw await blobErrorMessage(error, 'Failed to open file');
      }
    }, fileName),

  // Create a short-lived QR/share link -> { token, url, expiresAt, hours }
  createShareLink: async (recordId, hours = 24) => {
    try {
      const response = await api.post(`/medical-records/${recordId}/share-link`, { hours });
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to create share link';
    }
  },

  // Invalidate every active QR/share link of a record
  revokeShareLinks: async (recordId) => {
    try {
      const response = await api.delete(`/medical-records/${recordId}/share-link`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to revoke share links';
    }
  },
};

export default medicalRecordService;