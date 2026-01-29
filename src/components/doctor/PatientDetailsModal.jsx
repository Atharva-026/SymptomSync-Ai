import React from 'react';
import { Modal, Card, Row, Col, Badge, ListGroup } from 'react-bootstrap';
import { FaUser, FaExclamationTriangle, FaHeartbeat } from 'react-icons/fa';

const PatientDetailsModal = ({ show, onHide, appointment }) => {
  if (!appointment) return null;

  const assessmentData = appointment.assessmentData || {};

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Patient Assessment Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Patient Info */}
        <Card className="mb-3 border-primary" style={{ borderWidth: '2px' }}>
          <Card.Body>
            <Row>
              <Col md={8}>
                <h5 className="mb-2">
                  <FaUser className="me-2 text-primary" />
                  {appointment.patientName}
                </h5>
                <p className="mb-1"><strong>Patient ID:</strong> {appointment.patientId}</p>
                <p className="mb-1"><strong>Appointment:</strong> {appointment.date} at {appointment.time}</p>
              </Col>
              <Col md={4} className="text-end">
                <Badge bg={appointment.riskLevel >= 60 ? 'danger' : 'warning'} className="mb-2">
                  Risk: {appointment.riskLevel}%
                </Badge>
                {appointment.isUrgent && (
                  <div>
                    <Badge bg="danger">Urgent</Badge>
                  </div>
                )}
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Chief Complaint */}
        <Card className="mb-3">
          <Card.Header className="bg-light">
            <strong>Chief Complaint</strong>
          </Card.Header>
          <Card.Body>
            <p className="mb-0">{assessmentData.symptoms || 'Not provided'}</p>
          </Card.Body>
        </Card>

        {/* Assessment Details */}
        <Card className="mb-3">
          <Card.Header className="bg-light">
            <strong>AI Assessment Results</strong>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <ListGroup variant="flush">
                  <ListGroup.Item className="px-0">
                    <strong>Location:</strong> {assessmentData.bodyPart?.emoji} {assessmentData.bodyPart?.name}
                  </ListGroup.Item>
                  <ListGroup.Item className="px-0">
                    <strong>Pain Level:</strong> {assessmentData.painLevel}/10
                  </ListGroup.Item>
                  <ListGroup.Item className="px-0">
                    <strong>Duration:</strong> {assessmentData.duration?.amount} {assessmentData.duration?.unit}
                  </ListGroup.Item>
                </ListGroup>
              </Col>
              <Col md={6}>
                <div className="p-3 bg-light rounded">
                  <FaHeartbeat className="text-danger me-2" />
                  <strong>Risk Level: {appointment.riskLevel}%</strong>
                  <div className="progress mt-2" style={{ height: '20px' }}>
                    <div
                      className={`progress-bar ${
                        appointment.riskLevel >= 80 ? 'bg-danger' :
                        appointment.riskLevel >= 60 ? 'bg-warning' :
                        appointment.riskLevel >= 40 ? 'bg-info' : 'bg-success'
                      }`}
                      style={{ width: `${appointment.riskLevel}%` }}
                    >
                      {appointment.riskLevel}%
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Additional Symptoms */}
        {assessmentData.additionalSymptoms && assessmentData.additionalSymptoms.length > 0 && (
          <Card className="mb-3">
            <Card.Header className="bg-light">
              <strong>Additional Symptoms</strong>
            </Card.Header>
            <Card.Body>
              <div className="d-flex flex-wrap gap-2">
                {assessmentData.additionalSymptoms.map((symptom, index) => (
                  <Badge key={index} bg="secondary" className="py-2 px-3">
                    {symptom}
                  </Badge>
                ))}
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Clinical Notes Section */}
        <Card>
          <Card.Header className="bg-light">
            <strong>AI-Generated Clinical Notes</strong>
          </Card.Header>
          <Card.Body>
            <p className="mb-2"><strong>Presenting Complaint:</strong></p>
            <p className="text-muted small">
              Patient reports {assessmentData.symptoms?.toLowerCase()} located in the {assessmentData.bodyPart?.name?.toLowerCase()} 
              with pain intensity rated {assessmentData.painLevel}/10. Symptoms started {assessmentData.duration?.amount} {assessmentData.duration?.unit} ago.
              AI risk assessment indicates {appointment.riskLevel}% risk level.
            </p>
            
            {appointment.riskLevel >= 60 && (
              <div className="alert alert-warning mt-3 mb-0">
                <FaExclamationTriangle className="me-2" />
                <strong>High Priority:</strong> Consider immediate evaluation and intervention based on risk assessment.
              </div>
            )}
          </Card.Body>
        </Card>
      </Modal.Body>
    </Modal>
  );
};

export default PatientDetailsModal;