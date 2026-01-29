import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FaUserInjured, FaUserMd } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const AuthSelector = () => {
  const { loginAsPatient, loginAsDoctor } = useAuth();

  const handlePatientLogin = () => {
    // Mock patient data
    loginAsPatient({
      id: 'patient-001',
      name: 'John Doe',
      email: 'john@example.com',
      age: 35,
    });
  };

  const handleDoctorLogin = () => {
    // Mock doctor data
    loginAsDoctor({
      id: 'doctor-001',
      name: 'Dr. Sarah Johnson',
      email: 'sarah@hospital.com',
      specialty: 'General Physician',
      experience: '12 years',
    });
  };

  return (
    <Container className="mt-5">
      <div className="text-center mb-5">
        <h1 className="display-4 mb-3">SymptomSync AI</h1>
        <p className="lead text-muted">Choose your role to continue</p>
      </div>

      <Row className="justify-content-center">
        <Col md={5} className="mb-4">
          <Card className="shadow-lg h-100 border-0 hover-card">
            <Card.Body className="text-center p-5">
              <div className="mb-4" style={{ fontSize: '5rem' }}>
                <FaUserInjured className="text-primary" />
              </div>
              <h3 className="mb-3">I'm a Patient</h3>
              <p className="text-muted mb-4">
                Get AI-powered symptom assessment and connect with doctors instantly
              </p>
              <Button
                variant="primary"
                size="lg"
                className="w-100"
                onClick={handlePatientLogin}
              >
                Continue as Patient
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={5} className="mb-4">
          <Card className="shadow-lg h-100 border-0 hover-card">
            <Card.Body className="text-center p-5">
              <div className="mb-4" style={{ fontSize: '5rem' }}>
                <FaUserMd className="text-success" />
              </div>
              <h3 className="mb-3">I'm a Doctor</h3>
              <p className="text-muted mb-4">
                Review patient assessments and provide video consultations
              </p>
              <Button
                variant="success"
                size="lg"
                className="w-100"
                onClick={handleDoctorLogin}
              >
                Continue as Doctor
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style>{`
        .hover-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          cursor: pointer;
        }
        .hover-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 1rem 3rem rgba(0,0,0,0.175) !important;
        }
      `}</style>
    </Container>
  );
};

export default AuthSelector;