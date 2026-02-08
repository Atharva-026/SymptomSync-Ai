import React from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import { FaRobot, FaShieldAlt, FaVideo, FaUsers, FaFileMedical, FaCode } from 'react-icons/fa';

const AboutSection = () => {
  const features = [
    { icon: <FaRobot />, title: "AI Assessment", desc: "Conversational symptom analysis using Tambo AI SDK and structured follow-ups." },
    { icon: <FaUsers />, title: "Family Access", desc: "Caregiver support system with permission-based access to patient records." },
    { icon: <FaVideo />, title: "Video Consult", desc: "Low-latency, secure consultations powered by Jitsi Video API." },
    { icon: <FaFileMedical />, title: "Secure Records", desc: "QR-code based sharing and tokenized access for medical reports." },
    { icon: <FaShieldAlt />, title: "Intelligent Risk", desc: "Real-time urgency categorization (Emergency to Low) based on symptoms." },
    { icon: <FaCode />, title: "Role-Based Auth", desc: "Dedicated workflows for Patients, Doctors, and Admin/Caregivers." }
  ];

  return (
    <section id="about" className="py-5 bg-light">
      <Container>
        {/* Project Intro */}
        <div className="text-center mb-5">
          <Badge bg="primary" className="mb-2 px-3 py-2 rounded-pill">PROJECT OVERVIEW</Badge>
          <h2 className="display-5 fw-bold mb-4">Intelligent Telemedicine Platform</h2>
          <p className="lead text-muted mx-auto" style={{ maxWidth: '900px' }}>
            SymptomSync AI is a full-stack, AI-powered telemedicine platform designed to bridge the gap 
            between patients, doctors, and caregivers. We focus on early risk detection, faster 
            clinical decision-making, and family-assisted healthcare.
          </p>
        </div>

        {/* Feature Grid */}
        <Row className="g-4 mb-5">
          {features.map((f, i) => (
            <Col md={4} key={i}>
              <Card className="h-100 shadow-sm border-0 feature-card p-3">
                <Card.Body>
                  <div className="text-primary mb-3" style={{ fontSize: '2rem' }}>{f.icon}</div>
                  <h5 className="fw-bold">{f.title}</h5>
                  <Card.Text className="text-muted small">{f.desc}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Technology Stack Showcase */}
        <Card className="shadow-sm border-0 overflow-hidden mt-5">
          <Row className="g-0">
            <Col lg={4} className="bg-primary text-white p-5 d-flex align-items-center justify-content-center text-center">
              <div>
                <FaCode size={50} className="mb-3" />
                <h3 className="fw-bold">Tech Stack</h3>
              </div>
            </Col>
            <Col lg={8} className="p-4 bg-white">
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
    </section>
  );
};

export default AboutSection;