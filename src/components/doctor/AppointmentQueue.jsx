import React from 'react';
import { Card, ListGroup, Badge, Button, Row, Col } from 'react-bootstrap';
import { FaVideo, FaEye, FaCheckCircle } from 'react-icons/fa';

const AppointmentQueue = ({ appointments, onStartCall, onViewDetails }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'in-progress': return 'success';
      case 'completed': return 'secondary';
      default: return 'warning';
    }
  };

  const getPriorityBadge = (riskLevel) => {
    if (riskLevel >= 80) return <Badge bg="danger">Critical</Badge>;
    if (riskLevel >= 60) return <Badge bg="warning">High Priority</Badge>;
    if (riskLevel >= 40) return <Badge bg="info">Moderate</Badge>;
    return <Badge bg="success">Low Priority</Badge>;
  };

  return (
    <Card className="shadow-custom">
      <Card.Header className="bg-white">
        <h5 className="mb-0">Appointment Queue</h5>
      </Card.Header>
      <Card.Body className="p-0">
        {appointments.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <p>No appointments scheduled</p>
          </div>
        ) : (
          <ListGroup variant="flush">
            {appointments.map((apt) => (
              <ListGroup.Item key={apt.id} className="p-3">
                <Row className="align-items-center">
                  <Col md={6}>
                    <h6 className="mb-1 fw-bold">{apt.patientName}</h6>
                    <div className="d-flex gap-2 mb-2">
                      <Badge bg={getStatusColor(apt.status)}>
                        {apt.status}
                      </Badge>
                      {getPriorityBadge(apt.riskLevel)}
                      {apt.isUrgent && <Badge bg="danger">Urgent</Badge>}
                    </div>
                    <small className="text-muted d-block">
                      <strong>Symptoms:</strong> {apt.assessmentData?.symptoms || 'N/A'}
                    </small>
                  </Col>
                  <Col md={3}>
                    <div className="text-muted small">
                      <div><strong>Date:</strong> {apt.date}</div>
                      <div><strong>Time:</strong> {apt.time}</div>
                      <div><strong>Risk:</strong> {apt.riskLevel}%</div>
                    </div>
                  </Col>
                  <Col md={3} className="text-end">
                    <div className="d-grid gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onStartCall(apt)}
                        disabled={apt.status !== 'scheduled'}
                      >
                        <FaVideo className="me-1" />
                        {apt.status === 'scheduled' ? 'Start Call' : 'Join Call'}
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => onViewDetails(apt)}
                      >
                        <FaEye className="me-1" />
                        View Details
                      </Button>
                    </div>
                  </Col>
                </Row>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Card.Body>
    </Card>
  );
};

export default AppointmentQueue;