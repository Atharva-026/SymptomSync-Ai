import React from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaUserMd, FaUserInjured, FaVideo, FaChartLine, FaShieldAlt } from 'react-icons/fa';

const LandingPage = () => {
  return (
    <div>
      {/* Hero Section */}
      <div className="bg-primary text-white py-5">
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="py-5">
              <h1 className="display-3 fw-bold mb-4">SymptomSync AI</h1>
              <p className="lead mb-4">
                AI-powered symptom assessment with real video consultations. 
                Get expert medical advice from anywhere, anytime.
              </p>
              <div className="d-flex gap-3">
                <Button as={Link} to="/register" variant="light" size="lg">
                  Get Started
                </Button>
                <Button as={Link} to="/login" variant="outline-light" size="lg">
                  Login
                </Button>
              </div>
            </Col>
            <Col lg={6} className="text-center">
              <div style={{ fontSize: '15rem' }}>🏥</div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Features */}
      <Container className="py-5">
        <h2 className="text-center mb-5">Why Choose SymptomSync AI?</h2>
        <Row className="g-4">
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm text-center p-4">
              <Card.Body>
                <FaChartLine size={48} className="text-primary mb-3" />
                <h5>AI Assessment</h5>
                <p className="text-muted">
                  Advanced AI analyzes your symptoms and provides risk assessment in real-time
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm text-center p-4">
              <Card.Body>
                <FaVideo size={48} className="text-success mb-3" />
                <h5>Video Consultations</h5>
                <p className="text-muted">
                  Connect with qualified doctors via HD video calls from the comfort of your home
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm text-center p-4">
              <Card.Body>
                <FaShieldAlt size={48} className="text-danger mb-3" />
                <h5>Secure & Private</h5>
                <p className="text-muted">
                  Your medical data is encrypted and protected with industry-standard security
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* How It Works */}
      <div className="bg-light py-5">
        <Container>
          <h2 className="text-center mb-5">How It Works</h2>
          <Row>
            <Col md={6} className="mb-4">
              <Card className="border-primary h-100">
                <Card.Body className="p-4">
                  <FaUserInjured size={40} className="text-primary mb-3" />
                  <h4>For Patients</h4>
                  <ol className="ps-3">
                    <li className="mb-2">Describe your symptoms naturally</li>
                    <li className="mb-2">AI assesses your condition and risk level</li>
                    <li className="mb-2">Book appointment with recommended specialist</li>
                    <li className="mb-2">Join video consultation at scheduled time</li>
                  </ol>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} className="mb-4">
              <Card className="border-success h-100">
                <Card.Body className="p-4">
                  <FaUserMd size={40} className="text-success mb-3" />
                  <h4>For Doctors</h4>
                  <ol className="ps-3">
                    <li className="mb-2">Receive patient appointment requests</li>
                    <li className="mb-2">Review AI-generated assessment reports</li>
                    <li className="mb-2">Conduct video consultations</li>
                    <li className="mb-2">Provide prescriptions and follow-up care</li>
                  </ol>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* CTA */}
      <Container className="py-5 text-center">
        <h2 className="mb-4">Ready to Get Started?</h2>
        <p className="lead text-muted mb-4">
          Join thousands of patients and doctors using SymptomSync AI
        </p>
        <Button as={Link} to="/register" variant="primary" size="lg" className="px-5">
          Create Free Account
        </Button>
      </Container>

      {/* Footer */}
      <div className="bg-dark text-white py-4">
        <Container>
          <Row>
            <Col md={6}>
              <p className="mb-0">© 2026 SymptomSync AI. All rights reserved.</p>
            </Col>
            <Col md={6} className="text-md-end">
              <p className="mb-0">Built for healthcare innovation</p>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default LandingPage;
