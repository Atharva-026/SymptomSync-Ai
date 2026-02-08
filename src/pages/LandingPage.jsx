import React from 'react';
import { Container, Row, Col, Button, Card, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
  FaUserMd, FaUserInjured, FaVideo, FaChartLine, 
  FaShieldAlt, FaRobot, FaUsers, FaFileMedical, FaCode, FaExternalLinkAlt 
} from 'react-icons/fa';
import Header from '../components/layout/Header';

const LandingPage = () => {
  const feedbackLink = "https://forms.gle/RAAPQFWLj7JssCAGA";

  const features = [
    { icon: <FaRobot />, title: "AI Assessment", desc: "Conversational symptom analysis using Tambo AI SDK and structured follow-ups." },
    { icon: <FaUsers />, title: "Family Access", desc: "Caregiver support system with permission-based access to patient records." },
    { icon: <FaVideo />, title: "Video Consult", desc: "Low-latency, secure consultations powered by Jitsi Video API." },
    { icon: <FaFileMedical />, title: "Secure Records", desc: "QR-code based sharing and tokenized access for medical reports." },
    { icon: <FaShieldAlt />, title: "Intelligent Risk", desc: "Real-time urgency categorization (Emergency to Low) based on symptoms." },
    { icon: <FaExternalLinkAlt />, title: "Project Feedback", desc: "We value your input! Share your experience with us at the link below.", isFeedback: true }
  ];

  return (
    <div>
      <Header />
      
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

      {/* High Level Features */}
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
              <Card className="border-primary h-100 shadow-sm">
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
              <Card className="border-success h-100 shadow-sm">
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

      {/* ABOUT SECTION - THE PROJECT SHOWCASE */}
      <div id="about" className="py-5 bg-white">
        <Container>
          <div className="text-center mb-5">
            <Badge bg="info" className="mb-2 px-3 py-2 rounded-pill text-white">PROJECT SHOWCASE</Badge>
            <h2 className="display-5 fw-bold mb-4">Intelligent Telemedicine Platform</h2>
            <p className="lead text-muted mx-auto mb-3" style={{ maxWidth: '900px' }}>
              SymptomSync AI is a full-stack, AI-powered platform designed to bridge the gap 
              between patients, doctors, and caregivers.
            </p>
            {/* Feedback Link visible in the text body with Raw URL */}
            <p className="mb-1 text-muted">
              Help us improve our platform by providing user feedback at:
            </p>
            <a 
              href={feedbackLink} 
              target="_blank" 
              rel="noreferrer" 
              className="text-info fw-bold text-decoration-underline break-all"
            >
              {feedbackLink}
            </a>
          </div>

          <Row className="g-4 mb-5">
            {features.map((f, i) => (
              <Col md={4} key={i}>
                <Card className="h-100 shadow-sm border-0 feature-card p-3">
                  <Card.Body>
                    <div className="text-primary mb-3" style={{ fontSize: '2rem' }}>{f.icon}</div>
                    <h5 className="fw-bold">{f.title}</h5>
                    <Card.Text className="text-muted small mb-3">{f.desc}</Card.Text>
                    {f.isFeedback && (
                      <div className="mt-auto">
                        <a 
                          href={feedbackLink} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-info small fw-bold text-decoration-none d-block overflow-hidden"
                          style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {feedbackLink} <FaExternalLinkAlt size={10} />
                        </a>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          <Card className="shadow-sm border-0 overflow-hidden mt-5">
            <Row className="g-0">
              <Col lg={4} className="bg-primary text-white p-5 d-flex align-items-center justify-content-center text-center">
                <div>
                  <FaCode size={50} className="mb-3" />
                  <h3 className="fw-bold">Technology Stack</h3>
                </div>
              </Col>
              <Col lg={8} className="p-4 bg-light">
                <Row>
                  <Col sm={6} className="mb-3">
                    <h6 className="fw-bold text-primary">FRONTEND</h6>
                    <ul className="list-unstyled small text-muted">
                      <li>React 19 & React Router</li>
                      <li>Tambo AI React SDK</li>
                      <li>Bootstrap 5 & React-Bootstrap</li>
                      <li>Socket.io Client</li>
                    </ul>
                  </Col>
                  <Col sm={6}>
                    <h6 className="fw-bold text-primary">BACKEND</h6>
                    <ul className="list-unstyled small text-muted">
                      <li>Node.js & Express.js</li>
                      <li>MongoDB & Mongoose</li>
                      <li>Google Gemini AI</li>
                      <li>Jitsi Video API & Nodemailer</li>
                    </ul>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card>
        </Container>
      </div>

      {/* CTA */}
      <Container className="py-5 text-center">
        <h2 className="mb-4">Ready to Get Started?</h2>
        <p className="lead text-muted mb-4">
          Join thousands of patients and doctors using SymptomSync AI
        </p>
        <Button as={Link} to="/register" variant="primary" size="lg" className="px-5 shadow">
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