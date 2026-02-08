import React from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import { FaRobot, FaShieldAlt, FaVideo, FaUsers, FaFileMedical, FaCode, FaCheckCircle } from 'react-icons/fa';

const AboutPage = () => {
  const techStack = {
    Frontend: ["React 19", "React Router", "Bootstrap 5", "Tambo AI SDK", "Socket.io Client"],
    Backend: ["Node.js", "Express.js", "MongoDB", "Google Gemini AI", "Jitsi API", "Nodemailer"]
  };

  return (
    <div className="bg-light pb-5">
      {/* Hero Section */}
      <div className="about-hero text-center mb-5">
        <Container>
          <h1 className="display-4 fw-bold mb-3">SymptomSync AI</h1>
          <p className="lead opacity-90 mx-auto" style={{ maxWidth: '800px' }}>
            An Intelligent Telemedicine Platform bridging the gap between patients, doctors, and caregivers through AI-powered diagnostics and real-time care.
          </p>
        </Container>
      </div>

      <Container>
        {/* Core Vision */}
        <Row className="mb-5 align-items-center">
          <Col lg={6}>
            <h2 className="fw-bold mb-4">The Vision</h2>
            <p className="text-muted">
              SymptomSync AI is designed to revolutionize healthcare accessibility. By combining 
              <strong> Tambo AI</strong> for symptom analysis and <strong>Jitsi</strong> for video consultations, 
              we provide a seamless flow from feeling unwell to receiving professional medical advice.
            </p>
            <div className="d-flex align-items-center mb-3">
              <FaCheckCircle className="text-primary me-2" />
              <span>Early Risk Detection & Alerts</span>
            </div>
            <div className="d-flex align-items-center mb-3">
              <FaCheckCircle className="text-primary me-2" />
              <span>Family-Assisted Healthcare for Elderly</span>
            </div>
          </Col>
          <Col lg={6}>
            <Card className="shadow-sm border-0 p-4 bg-white">
               <h5 className="fw-bold"><FaCode className="me-2 text-primary"/> Project Summary</h5>
               <p className="small text-muted">
                 SymptomSync AI leverages a structured multi-step assessment flow to calculate risk scores (0-100%) 
                 and provides tokenized, QR-code based medical record sharing for maximum security.
               </p>
            </Card>
          </Col>
        </Row>

        {/* Features Grid */}
        <h3 className="text-center fw-bold mb-4">Key Capabilities</h3>
        <Row className="g-4 mb-5">
          {[
            { icon: <FaRobot/>, title: "AI Assessment", desc: "Conversational symptom analysis using Tambo AI SDK and structured follow-ups." },
            { icon: <FaUsers/>, title: "Family Access", desc: "Caregiver support system with permission-based access to patient records." },
            { icon: <FaVideo/>, title: "Video Consult", desc: "Low-latency, secure consultations powered by Jitsi Video API." },
            { icon: <FaFileMedical/>, title: "Secure Records", desc: "QR-code based sharing and tokenized access for medical reports." },
            { icon: <FaShieldAlt/>, title: "Intelligent Risk", desc: "Real-time urgency categorization (Emergency to Low) based on symptoms." },
            { icon: <FaCode/>, title: "Role-Based Auth", desc: "Dedicated workflows for Patients, Doctors, and Admin/Caregivers." }
          ].map((feature, index) => (
            <Col md={4} key={index}>
              <Card className="h-100 shadow-sm feature-card p-3">
                <Card.Body>
                  <div className="text-primary mb-3" style={{ fontSize: '2rem' }}>{feature.icon}</div>
                  <h5 className="fw-bold">{feature.title}</h5>
                  <Card.Text className="text-muted small">{feature.desc}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Tech Stack */}
        <Card className="shadow-sm border-0 mb-5 overflow-hidden">
          <Row className="g-0">
            <Col md={4} className="bg-primary text-white p-4 d-flex align-items-center justify-content-center">
              <div className="text-center">
                <FaCode size={50} className="mb-3" />
                <h4>Technology Stack</h4>
              </div>
            </Col>
            <Col md={8} className="p-4 bg-white">
              <h6>Frontend</h6>
              <div className="mb-4">
                {techStack.Frontend.map(tech => <span key={tech} className="tech-badge">{tech}</span>)}
              </div>
              <h6>Backend</h6>
              <div>
                {techStack.Backend.map(tech => <span key={tech} className="tech-badge">{tech}</span>)}
              </div>
            </Col>
          </Row>
        </Card>

        {/* Core User Flow */}
        <h3 className="fw-bold mb-4">Standard Patient Journey</h3>
        <Row>
          <Col md={6}>
            <div className="flow-step">
              <h6>AI Symptom Chat</h6>
              <p className="small text-muted">Initial natural language interaction to identify discomfort.</p>
            </div>
            <div className="flow-step">
              <h6>Risk Assessment</h6>
              <p className="small text-muted">Multi-step data gathering (Pain, Duration, Location).</p>
            </div>
            <div className="flow-step">
              <h6>Appointment Booking</h6>
              <p className="small text-muted">Seamless transition to doctor scheduling based on urgency.</p>
            </div>
          </Col>
          <Col md={6}>
            <div className="flow-step">
              <h6>Video Consultation</h6>
              <p className="small text-muted">Real-time face-to-face interaction with a specialist.</p>
            </div>
            <div className="flow-step">
              <h6>Medical Records</h6>
              <p className="small text-muted">Securely upload reports and share with family or doctors.</p>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AboutPage;