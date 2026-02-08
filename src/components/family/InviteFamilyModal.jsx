// src/components/family/InviteFamilyModal.jsx

import React, { useState } from 'react';
import { Modal, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { FaUserPlus, FaEnvelope, FaHeart } from 'react-icons/fa';
import familyAccessService from '../../services/familyAccessService';

const InviteFamilyModal = ({ show, onHide, onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    relationship: '',
    permissions: {
      viewRecords: false,
      manageAppointments: false,
      viewAssessments: false,
      manageMedications: false,
      uploadRecords: false,
      emergencyContact: false
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const relationshipOptions = [
    { value: 'spouse', label: 'Spouse/Partner' },
    { value: 'parent', label: 'Parent' },
    { value: 'child', label: 'Child' },
    { value: 'sibling', label: 'Sibling' },
    { value: 'guardian', label: 'Legal Guardian' },
    { value: 'caregiver', label: 'Caregiver' },
    { value: 'other', label: 'Other Family Member' }
  ];

  const permissionOptions = [
    {
      key: 'viewRecords',
      label: 'View Medical Records',
      description: 'Can view all your medical documents and history',
      icon: '📄'
    },
    {
      key: 'manageAppointments',
      label: 'Manage Appointments',
      description: 'Can book, reschedule, and cancel appointments on your behalf',
      icon: '📅'
    },
    {
      key: 'viewAssessments',
      label: 'View Health Assessments',
      description: 'Can see symptom assessments and AI health recommendations',
      icon: '🩺'
    },
    {
      key: 'manageMedications',
      label: 'Manage Medications',
      description: 'Can add, update, and track your medications',
      icon: '💊'
    },
    {
      key: 'uploadRecords',
      label: 'Upload Medical Records',
      description: 'Can upload new medical documents on your behalf',
      icon: '📤'
    },
    {
      key: 'emergencyContact',
      label: 'Emergency Contact',
      description: 'Will be notified in case of medical emergencies',
      icon: '🚨'
    }
  ];

  const handlePermissionChange = (key) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key]
      }
    }));
  };

  const handleSelectAll = () => {
    const allSelected = Object.values(formData.permissions).every(v => v);
    const newPermissions = {};
    permissionOptions.forEach(opt => {
      newPermissions[opt.key] = !allSelected;
    });
    setFormData(prev => ({
      ...prev,
      permissions: newPermissions
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.email || !formData.relationship) {
      setError('Please fill in all required fields');
      return;
    }

    if (!Object.values(formData.permissions).some(v => v)) {
      setError('Please select at least one permission');
      return;
    }

    setLoading(true);

    try {
      await familyAccessService.inviteFamilyMember(formData);
      
      // Reset form
      setFormData({
        email: '',
        relationship: '',
        permissions: {
          viewRecords: false,
          manageAppointments: false,
          viewAssessments: false,
          manageMedications: false,
          uploadRecords: false,
          emergencyContact: false
        }
      });
      
      onSuccess();
      
    } catch (error) {
      console.error('Error inviting family member:', error);
      setError(
        error.response?.data?.message || 
        'Failed to send invitation. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = Object.values(formData.permissions).filter(v => v).length;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <FaUserPlus className="me-2" />
          Invite Family Member
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Alert variant="info" className="mb-4">
            <FaHeart className="me-2" />
            <strong>Important:</strong> The person you invite must already have a SymptomSync AI account. 
            They will receive an email notification and can accept or decline your invitation.
          </Alert>

          {/* Email Input */}
          <Form.Group className="mb-3">
            <Form.Label>
              <FaEnvelope className="me-2" />
              Email Address <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="email"
              placeholder="family.member@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Form.Text className="text-muted">
              Enter the email address of your registered family member
            </Form.Text>
          </Form.Group>

          {/* Relationship Select */}
          <Form.Group className="mb-4">
            <Form.Label>
              Relationship <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select
              value={formData.relationship}
              onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
              required
            >
              <option value="">Select relationship...</option>
              {relationshipOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {/* Permissions Section */}
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">
                Access Permissions <span className="text-danger">*</span>
              </h5>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedCount === permissionOptions.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            
            <p className="text-muted small mb-3">
              Selected: <strong>{selectedCount}</strong> of {permissionOptions.length} permissions
            </p>

            <Row className="g-3">
              {permissionOptions.map(option => (
                <Col md={6} key={option.key}>
                  <div 
                    className={`permission-card p-3 border rounded ${
                      formData.permissions[option.key] ? 'border-primary bg-primary-soft' : ''
                    }`}
                    onClick={() => handlePermissionChange(option.key)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Form.Check
                      type="checkbox"
                      id={option.key}
                      checked={formData.permissions[option.key]}
                      onChange={() => handlePermissionChange(option.key)}
                      label={
                        <div>
                          <div className="d-flex align-items-center mb-1">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>
                              {option.icon}
                            </span>
                            <strong>{option.label}</strong>
                          </div>
                          <small className="text-muted d-block">
                            {option.description}
                          </small>
                        </div>
                      }
                    />
                  </div>
                </Col>
              ))}
            </Row>
          </div>

          <Alert variant="warning" className="mt-3">
            <strong>Privacy Note:</strong> You can change these permissions anytime from 
            your Family Access settings. The invited person will need to accept your 
            invitation before they can access your data.
          </Alert>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={loading || !formData.email || !formData.relationship || selectedCount === 0}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Sending Invitation...
              </>
            ) : (
              <>
                <FaUserPlus className="me-2" />
                Send Invitation
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default InviteFamilyModal;