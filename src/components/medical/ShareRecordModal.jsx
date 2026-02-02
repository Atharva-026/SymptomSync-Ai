import React, { useState, useEffect } from 'react';
import { Modal, Button, Alert, Form, ListGroup, Badge, Spinner } from 'react-bootstrap';
import { FaShare, FaUserMd, FaCheckCircle } from 'react-icons/fa';
import medicalRecordService from '../../services/medicalRecordService';
import doctorService from '../../services/doctorService';

const ShareRecordModal = ({ show, onHide, record }) => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [accessDays, setAccessDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (show) {
      fetchDoctors();
    }
  }, [show]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const data = await doctorService.getAllDoctors();
      setDoctors(data);
    } catch (err) {
      setError('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (!selectedDoctor) {
      setError('Please select a doctor');
      return;
    }

    setSharing(true);
    setError('');
    setSuccess(false);

    try {
      await medicalRecordService.shareWithDoctor(record._id, selectedDoctor, accessDays);
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err || 'Failed to share record');
    } finally {
      setSharing(false);
    }
  };

  const handleClose = () => {
    setSelectedDoctor('');
    setAccessDays(30);
    setError('');
    setSuccess(false);
    onHide();
  };

  if (!record) return null;

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <FaShare className="me-2" />
          Share Medical Record
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && (
          <Alert variant="success">
            <FaCheckCircle className="me-2" />
            Record shared successfully!
          </Alert>
        )}

        {/* Record Info */}
        <Alert variant="info" className="mb-4">
          <strong>Sharing:</strong> {record.title}
        </Alert>

        {/* Already Shared */}
        {record.sharedWith && record.sharedWith.length > 0 && (
          <div className="mb-4">
            <h6 className="mb-3">Currently Shared With:</h6>
            <ListGroup>
              {record.sharedWith.map((share, index) => (
                <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                  <div>
                    <FaUserMd className="me-2 text-success" />
                    <strong>{share.doctor?.name || 'Unknown'}</strong>
                    <br />
                    <small className="text-muted">
                      {share.doctor?.specialty} • Accessed {share.accessCount || 0} time(s)
                    </small>
                  </div>
                  <Badge bg="success">Active</Badge>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        )}

        {/* Share Form */}
        <Form onSubmit={handleShare}>
          <h6 className="mb-3">Share with New Doctor:</h6>

          <Form.Group className="mb-3">
            <Form.Label>Select Doctor *</Form.Label>
            {loading ? (
              <div className="text-center py-3">
                <Spinner animation="border" size="sm" />
              </div>
            ) : (
              <Form.Select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                required
              >
                <option value="">Choose a doctor...</option>
                {doctors
                  .filter(
                    (doc) =>
                      !record.sharedWith?.some(
                        (share) => share.doctor?._id === doc._id
                      )
                  )
                  .map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                      {doctor.name} - {doctor.specialty}
                    </option>
                  ))}
              </Form.Select>
            )}
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Access Duration</Form.Label>
            <Form.Select
              value={accessDays}
              onChange={(e) => setAccessDays(parseInt(e.target.value))}
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days (1 month)</option>
              <option value={90}>90 days (3 months)</option>
              <option value={180}>180 days (6 months)</option>
              <option value={365}>365 days (1 year)</option>
            </Form.Select>
            <Form.Text className="text-muted">
              Doctor will have access for the selected period
            </Form.Text>
          </Form.Group>

          <Alert variant="warning">
            <small>
              <strong>Privacy Notice:</strong> The selected doctor will be able to view
              this medical record for the specified duration.
            </small>
          </Alert>

          <div className="d-flex gap-2">
            <Button variant="secondary" onClick={handleClose} disabled={sharing}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={sharing} className="flex-fill">
              {sharing ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Sharing...
                </>
              ) : (
                <>
                  <FaShare className="me-2" />
                  Share Record
                </>
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default ShareRecordModal;