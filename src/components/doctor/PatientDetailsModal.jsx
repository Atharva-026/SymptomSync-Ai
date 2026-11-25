import React from 'react';
import { Modal, Card, Row, Col, Badge, Alert } from 'react-bootstrap';
import { FaUser, FaHeartbeat, FaFileMedical, FaExclamationTriangle } from 'react-icons/fa';
import BriefPreview from '../patient/BriefPreview';

const PatientDetailsModal = ({ show, onHide, appointment }) => {
  if (!appointment) return null;

  const assessment = appointment.assessment || {};
  const brief = assessment.brief;
  const risk = appointment.riskLevel || 0;
  const barColor = risk >= 80 ? 'bg-danger' : risk >= 60 ? 'bg-warning' : risk >= 40 ? 'bg-info' : 'bg-success';

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>Patient Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Card className="mb-3 border-primary" style={{ borderWidth: '2px' }}>
          <Card.Body>
            <Row>
              <Col md={8}>
                <h5 className="mb-2">
                  <FaUser className="me-2 text-primary" />
                  {appointment.patient?.name}
                </h5>
                <p className="mb-1"><strong>Appointment:</strong> {appointment.date} at {appointment.time}</p>
              </Col>
              <Col md={4} className="text-end">
                <Badge bg={risk >= 60 ? 'danger' : 'warning'} className="mb-2">Risk: {risk}%</Badge>
                {appointment.isUrgent && <div><Badge bg="danger">Urgent</Badge></div>}
              </Col>
            </Row>
            <div className="p-3 bg-light rounded mt-3">
              <FaHeartbeat className="text-danger me-2" />
              <strong>Risk level: {risk}%</strong>
              <div className="progress mt-2" style={{ height: '16px' }}>
                <div className={`progress-bar ${barColor}`} style={{ width: `${risk}%` }}>{risk}%</div>
              </div>
            </div>
          </Card.Body>
        </Card>

        {brief ? (
          <Card className="mb-3">
            <Card.Header className="bg-light">
              <FaFileMedical className="me-2 text-primary" />
              <strong>Pre-consultation brief</strong>
            </Card.Header>
            <Card.Body>
              <Alert variant="secondary" className="py-2 small">
                AI-generated from the patient's chat with the triage assistant, and shared with their consent.
                It is unverified, so please confirm everything with the patient.
              </Alert>
              <BriefPreview brief={brief} />
            </Card.Body>
          </Card>
        ) : (
          <Card className="mb-3">
            <Card.Header className="bg-light"><strong>Reason for visit</strong></Card.Header>
            <Card.Body>
              <p className="mb-2">{assessment.symptoms || 'Not provided'}</p>
              <small className="text-muted">The patient did not share a chat summary.</small>
            </Card.Body>
          </Card>
        )}

        {risk >= 60 && (
          <Alert variant="warning" className="mb-0">
            <FaExclamationTriangle className="me-2" />
            <strong>High priority:</strong> Consider early evaluation based on the risk assessment.
          </Alert>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default PatientDetailsModal;