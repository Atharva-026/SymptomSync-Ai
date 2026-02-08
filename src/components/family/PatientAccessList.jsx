// src/components/family/PatientAccessList.jsx

import React from 'react';
import { Card, Badge, Button, Row, Col } from 'react-bootstrap';
import { 
  FaUser, FaCalendarAlt, FaFileAlt, FaStethoscope, 
  FaPills, FaHospital, FaPhone, FaEnvelope 
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';

const PatientAccessList = ({ patients, onRefresh }) => {
  const navigate = useNavigate();

  const permissionIcons = {
    viewRecords: { icon: <FaFileAlt />, label: 'View Records', color: 'primary' },
    manageAppointments: { icon: <FaCalendarAlt />, label: 'Appointments', color: 'success' },
    viewAssessments: { icon: <FaStethoscope />, label: 'Assessments', color: 'info' },
    manageMedications: { icon: <FaPills />, label: 'Medications', color: 'warning' },
    uploadRecords: { icon: <FaHospital />, label: 'Upload Records', color: 'danger' },
    emergencyContact: { icon: <FaPhone />, label: 'Emergency', color: 'dark' }
  };

  const getRelationshipLabel = (relationship) => {
    const labels = {
      spouse: 'Spouse/Partner',
      parent: 'Parent',
      child: 'Child',
      sibling: 'Sibling',
      guardian: 'Legal Guardian',
      caregiver: 'Caregiver',
      other: 'Other Family Member'
    };
    return labels[relationship] || relationship;
  };

  const handleManagePatient = (patientId) => {
    // Navigate to family member view with patient context
    navigate(`/family/manage-patient/${patientId}`);
  };

  if (!patients || patients.length === 0) {
    return (
      <div className="text-center py-5">
        <div className="mb-3" style={{ fontSize: '4rem', opacity: 0.3 }}>
          🏥
        </div>
        <h4 className="text-muted">No Patient Access</h4>
        <p className="text-muted">
          You haven't been granted access to manage any patient's healthcare yet
        </p>
      </div>
    );
  }

  return (
    <Row className="g-4">
      {patients.map((access) => (
        <Col lg={6} key={access._id}>
          <Card className="h-100 shadow-sm patient-access-card">
            <Card.Header className="bg-primary-soft border-primary">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-0">
                    <FaUser className="me-2" />
                    Patient Access
                  </h6>
                </div>
                <Badge bg="success">Active</Badge>
              </div>
            </Card.Header>

            <Card.Body>
              {/* Patient Information */}
              <div className="mb-3 pb-3 border-bottom">
                <h5 className="mb-2">{access.patientId?.name}</h5>
                <div className="text-muted small">
                  {access.patientId?.email && (
                    <div className="mb-1">
                      <FaEnvelope className="me-2" />
                      {access.patientId.email}
                    </div>
                  )}
                  {access.patientId?.phone && (
                    <div className="mb-1">
                      <FaPhone className="me-2" />
                      {access.patientId.phone}
                    </div>
                  )}
                  {access.patientId?.dateOfBirth && (
                    <div className="mb-1">
                      Age: {moment().diff(access.patientId.dateOfBirth, 'years')} years
                    </div>
                  )}
                </div>
              </div>

              {/* Relationship */}
              <div className="mb-3">
                <small className="text-muted d-block mb-1">Your Relationship:</small>
                <Badge bg="info" className="text-capitalize">
                  {getRelationshipLabel(access.relationship)}
                </Badge>
              </div>

              {/* Access Permissions */}
              <div className="mb-3">
                <small className="text-muted d-block mb-2">
                  <strong>Your Permissions:</strong>
                </small>
                <Row className="g-2">
                  {Object.entries(access.permissions)
                    .filter(([_, value]) => value)
                    .map(([key]) => {
                      const perm = permissionIcons[key];
                      return (
                        <Col xs={6} key={key}>
                          <div className={`text-${perm.color} small d-flex align-items-center`}>
                            <span className="me-2">{perm.icon}</span>
                            {perm.label}
                          </div>
                        </Col>
                      );
                    })}
                </Row>
              </div>

              {/* Access Granted Date */}
              <div className="mb-3">
                <small className="text-muted">
                  Access granted: {moment(access.grantedAt).format('MMM D, YYYY')}
                </small>
              </div>
            </Card.Body>

            <Card.Footer className="bg-light border-0">
              <Button
                variant="primary"
                className="w-100"
                onClick={() => handleManagePatient(access.patientId._id)}
              >
                <FaStethoscope className="me-2" />
                Manage Patient's Healthcare
              </Button>
            </Card.Footer>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default PatientAccessList;