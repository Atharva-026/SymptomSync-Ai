import React, { useState } from 'react';
import { Modal, Form, Button, Alert, Spinner, ProgressBar } from 'react-bootstrap';
import { FaUpload, FaFilePdf, FaFileImage, FaCheckCircle } from 'react-icons/fa';
import medicalRecordService from '../../services/medicalRecordService';

const UploadRecordModal = ({ show, onHide, onUploadSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    recordType: 'lab_report',
    recordDate: '',
    tags: '',
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const recordTypes = [
    { value: 'lab_report', label: '🧪 Lab Report' },
    { value: 'prescription', label: '💊 Prescription' },
    { value: 'scan', label: '🔬 Scan (CT/MRI)' },
    { value: 'xray', label: '🦴 X-Ray' },
    { value: 'other', label: '📄 Other' },
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Only PDF and image files (JPEG, PNG) are allowed');
        return;
      }

      // Validate file size (10MB max)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create form data
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('title', formData.title);
      uploadData.append('description', formData.description);
      uploadData.append('recordType', formData.recordType);
      uploadData.append('recordDate', formData.recordDate || new Date().toISOString());
      uploadData.append('tags', formData.tags);

      // Simulate progress (since we don't have real progress tracking)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const record = await medicalRecordService.uploadRecord(uploadData);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setSuccess(true);

      // Notify parent component
      if (onUploadSuccess) {
        onUploadSuccess(record);
      }

      // Reset form after 1.5 seconds
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err || 'Failed to upload record');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      recordType: 'lab_report',
      recordDate: '',
      tags: '',
    });
    setFile(null);
    setUploading(false);
    setUploadProgress(0);
    setError('');
    setSuccess(false);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <FaUpload className="me-2" />
          Upload Medical Record
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && (
          <Alert variant="success">
            <FaCheckCircle className="me-2" />
            Record uploaded successfully!
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          {/* File Upload */}
          <Form.Group className="mb-3">
            <Form.Label>Select File *</Form.Label>
            <div className="border-2 border-dashed rounded p-4 text-center" style={{ borderStyle: 'dashed', borderColor: '#dee2e6' }}>
              <input
                type="file"
                id="file-upload"
                className="d-none"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                {file ? (
                  <div>
                    {file.type === 'application/pdf' ? (
                      <FaFilePdf size={48} className="text-danger mb-2" />
                    ) : (
                      <FaFileImage size={48} className="text-primary mb-2" />
                    )}
                    <p className="mb-0 fw-bold">{file.name}</p>
                    <small className="text-muted">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </small>
                  </div>
                ) : (
                  <div>
                    <FaUpload size={48} className="text-muted mb-2" />
                    <p className="mb-1">Click to upload or drag and drop</p>
                    <small className="text-muted">PDF, JPG, PNG (Max 10MB)</small>
                  </div>
                )}
              </label>
            </div>
          </Form.Group>

          {/* Title */}
          <Form.Group className="mb-3">
            <Form.Label>Title *</Form.Label>
            <Form.Control
              type="text"
              name="title"
              placeholder="e.g., Blood Test Results - Jan 2026"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </Form.Group>

          {/* Record Type */}
          <Form.Group className="mb-3">
            <Form.Label>Record Type *</Form.Label>
            <Form.Select
              name="recordType"
              value={formData.recordType}
              onChange={handleChange}
              required
            >
              {recordTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {/* Description */}
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              name="description"
              rows={3}
              placeholder="Add any notes or context about this record..."
              value={formData.description}
              onChange={handleChange}
            />
          </Form.Group>

          {/* Record Date */}
          <Form.Group className="mb-3">
            <Form.Label>Record Date</Form.Label>
            <Form.Control
              type="date"
              name="recordDate"
              value={formData.recordDate}
              onChange={handleChange}
            />
            <Form.Text className="text-muted">
              Date when this medical record was created
            </Form.Text>
          </Form.Group>

          {/* Tags */}
          <Form.Group className="mb-3">
            <Form.Label>Tags (comma separated)</Form.Label>
            <Form.Control
              type="text"
              name="tags"
              placeholder="e.g., diabetes, routine checkup, cholesterol"
              value={formData.tags}
              onChange={handleChange}
            />
          </Form.Group>

          {/* Upload Progress */}
          {uploading && (
            <div className="mb-3">
              <ProgressBar
                now={uploadProgress}
                label={`${uploadProgress}%`}
                animated
                variant="primary"
              />
            </div>
          )}

          {/* Submit Button */}
          <div className="d-flex gap-2">
            <Button variant="secondary" onClick={handleClose} disabled={uploading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={uploading} className="flex-fill">
              {uploading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <FaUpload className="me-2" />
                  Upload Record
                </>
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default UploadRecordModal;