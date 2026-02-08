// File: /src/components/medical/tambo-wrappers/TamboBookingInterface.jsx

import React, { useState } from 'react';
import { Card, ListGroup, Button, Badge, Row, Col } from 'react-bootstrap';
import { FaUserMd, FaCalendar, FaClock } from 'react-icons/fa';

const TamboBookingInterface = ({ doctors = [] }) => {
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const handleBookDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    // Navigate to booking page or open booking modal
    alert(`Booking with Dr. ${doctor.name} - ${doctor.specialty}\nThis would open the booking interface.`);
  };

  if (!doctors || doctors.length === 0) {
    return (
      <Card className="mb-4">
        <Card.Body className="text-center py-4">
          <p className="text-muted">No doctors available at this time. Please try again later.</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm mb-4">
      <Card.Header className="bg-success text-white">
        <h5 className="mb-0">
          <FaUserMd className="me-2" />
          Available Doctors for Consultation
        </h5>
      </Card.Header>
      <Card.Body>
        <p className="text-muted mb-3">
          Select a doctor below to book your appointment:
        </p>
        
        <ListGroup variant="flush">
          {doctors.map((doctor, index) => (
            <ListGroup.Item key={doctor.id || index} className="p-3 border rounded mb-2">
              <Row className="align-items-center">
                <Col md={8}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                         style={{ width: '50px', height: '50px', fontSize: '20px' }}>
                      <FaUserMd />
                    </div>
                    <div>
                      <h6 className="mb-1">Dr. {doctor.name}</h6>
                      <Badge bg="info" className="me-2">{doctor.specialty}</Badge>
                      {doctor.available && (
                        <Badge bg="success">Available</Badge>
                      )}
                    </div>
                  </div>
                </Col>
                <Col md={4} className="text-end">
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => handleBookDoctor(doctor)}
                  >
                    <FaCalendar className="me-2" />
                    Book Appointment
                  </Button>
                </Col>
              </Row>
            </ListGroup.Item>
          ))}
        </ListGroup>

        <div className="mt-3 p-3 bg-light rounded">
          <small className="text-muted">
            <FaClock className="me-2" />
            <strong>Next Steps:</strong> After selecting a doctor, you'll be able to choose your preferred date and time for the consultation.
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

export default TamboBookingInterface;