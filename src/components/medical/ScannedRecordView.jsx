import React from 'react';
import { Modal, Button, Card, Row, Col, Badge, Alert } from 'react-bootstrap';
import { FaFileAlt, FaUser, FaCalendar, FaStethoscope, FaPrescription, FaTimes } from 'react-icons/fa';

const ScannedRecordView = ({ show, onHide, recordData }) => {
  if (!recordData) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <FaFileAlt className="me-2" />
          Patient Medical Record
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        <Alert variant="success" className="mb-4">
          <strong>✅ Record accessed via QR scan</strong>
          <div className="small mt-1">This record was shared by the patient</div>
        </Alert>

        {/* Patient Information */}
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Header className="bg-light">
            <h6 className="mb-0">
              <FaUser className="me-2 text-primary" />
              Patient Information
            </h6>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <div className="mb-3">
                  <label className="small text-muted fw-bold">Patient Name</label>
                  <div className="h5 mb-0">{recordData.patientName || 'Unknown Patient'}</div>
                </div>
              </Col>
              <Col md={6}>
                <div className="mb-3">
                  <label className="small text-muted fw-bold">Record ID</label>
                  <div>
                    <Badge bg="secondary" className="font-monospace">
                      {recordData.recordId || 'N/A'}
                    </Badge>
                  </div>
                </div>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <div className="mb-0">
                  <label className="small text-muted fw-bold">
                    <FaCalendar className="me-2" />
                    Date
                  </label>
                  <div>
                    {recordData.date ? new Date(recordData.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'N/A'}
                  </div>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Record Details */}
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Header className="bg-light">
            <h6 className="mb-0">
              <FaFileAlt className="me-2 text-primary" />
              Record Details
            </h6>
          </Card.Header>
          <Card.Body>
            <div className="mb-3">
              <label className="small text-muted fw-bold">Title</label>
              <div className="h6">{recordData.title || 'Untitled Record'}</div>
            </div>

            {recordData.description && (
              <div className="mb-3">
                <label className="small text-muted fw-bold">Description</label>
                <div className="bg-light p-3 rounded">
                  {recordData.description}
                </div>
              </div>
            )}

            {recordData.diagnosis && (
              <div className="mb-3">
                <label className="small text-muted fw-bold">
                  <FaStethoscope className="me-2" />
                  Diagnosis
                </label>
                <div className="bg-light p-3 rounded">
                  {recordData.diagnosis}
                </div>
              </div>
            )}

            {recordData.prescription && (
              <div className="mb-0">
                <label className="small text-muted fw-bold">
                  <FaPrescription className="me-2" />
                  Prescription
                </label>
                <div className="bg-light p-3 rounded">
                  {recordData.prescription}
                </div>
              </div>
            )}

            {!recordData.diagnosis && !recordData.prescription && !recordData.description && (
              <Alert variant="info" className="mb-0">
                <small>No additional medical details available in this record.</small>
              </Alert>
            )}
          </Card.Body>
        </Card>

        {/* Previous Doctor Info */}
        {recordData.doctorName && (
          <Card className="mb-3 border-0 shadow-sm">
            <Card.Header className="bg-light">
              <h6 className="mb-0">
                <FaStethoscope className="me-2 text-primary" />
                Previous Consultation
              </h6>
            </Card.Header>
            <Card.Body>
              <div>
                <label className="small text-muted fw-bold">Doctor</label>
                <div>{recordData.doctorName}</div>
              </div>
            </Card.Body>
          </Card>
        )}

        <Alert variant="warning" className="mb-0">
          <small>
            <strong>⚠️ Privacy Notice:</strong> This medical information is confidential. 
            Handle it in accordance with HIPAA and patient privacy regulations.
          </small>
        </Alert>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={onHide}>
          <FaTimes className="me-2" />
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ScannedRecordView;