// src/components/family/PendingInvitations.jsx

import React from 'react';
import { Card, Button, Badge, Row, Col } from 'react-bootstrap';
import { FaCheckCircle, FaTimesCircle, FaEnvelope, FaUser } from 'react-icons/fa';
import moment from 'moment';

const PendingInvitations = ({ invitations, onAccept, onReject }) => {
  const permissionLabels = {
    viewRecords: '📄 View Records',
    manageAppointments: '📅 Manage Appointments',
    viewAssessments: '🩺 View Assessments',
    manageMedications: '💊 Manage Medications',
    uploadRecords: '📤 Upload Records',
    emergencyContact: '🚨 Emergency Contact'
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

  if (!invitations || invitations.length === 0) {
    return (
      <div className="text-center py-5">
        <div className="mb-3" style={{ fontSize: '4rem', opacity: 0.3 }}>
          ✉️
        </div>
        <h4 className="text-muted">No Pending Invitations</h4>
        <p className="text-muted">
          You don't have any family access requests at the moment
        </p>
      </div>
    );
  }

  return (
    <Row className="g-3">
      {invitations.map((invitation) => (
        <Col md={6} key={invitation._id}>
          <Card className="h-100 shadow-sm border-warning">
            <Card.Header className="bg-warning-soft border-warning">
              <div className="d-flex justify-content-between align-items-center">
                <strong className="text-warning">
                  <FaEnvelope className="me-2" />
                  Family Access Request
                </strong>
                <Badge bg="warning">Pending</Badge>
              </div>
            </Card.Header>
            
            <Card.Body>
              {/* Patient Info */}
              <div className="mb-3 pb-3 border-bottom">
                <h6 className="mb-2">
                  <FaUser className="me-2 text-primary" />
                  From Patient
                </h6>
                <div>
                  <strong>{invitation.patientId?.name}</strong>
                  <br />
                  <small className="text-muted">
                    {invitation.patientId?.email}
                  </small>
                </div>
              </div>

              {/* Relationship */}
              <div className="mb-3">
                <small className="text-muted d-block mb-1">As their:</small>
                <Badge bg="info" className="text-capitalize">
                  {getRelationshipLabel(invitation.relationship)}
                </Badge>
              </div>

              {/* Permissions */}
              <div className="mb-3">
                <small className="text-muted d-block mb-2">
                  <strong>Requested Permissions:</strong>
                </small>
                <div className="d-flex flex-wrap gap-1">
                  {Object.entries(invitation.permissions)
                    .filter(([_, value]) => value)
                    .map(([key]) => (
                      <Badge
                        key={key}
                        bg="light"
                        text="dark"
                        className="border"
                        style={{ fontSize: '0.75rem' }}
                      >
                        {permissionLabels[key]}
                      </Badge>
                    ))}
                </div>
              </div>

              {/* Invited Date */}
              <small className="text-muted">
                Invited: {moment(invitation.grantedAt).fromNow()}
              </small>
            </Card.Body>

            <Card.Footer className="bg-light border-0">
              <div className="d-grid gap-2">
                <Button
                  variant="success"
                  onClick={() => onAccept(invitation.patientId._id)}
                  className="d-flex align-items-center justify-content-center"
                >
                  <FaCheckCircle className="me-2" />
                  Accept Request
                </Button>
                <Button
                  variant="outline-danger"
                  onClick={() => onReject(invitation.patientId._id)}
                  className="d-flex align-items-center justify-content-center"
                >
                  <FaTimesCircle className="me-2" />
                  Decline
                </Button>
              </div>
            </Card.Footer>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default PendingInvitations;