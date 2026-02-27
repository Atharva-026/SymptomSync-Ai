import React from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
  FaUserMd, FaUserInjured, FaVideo, FaChartLine, 
  FaShieldAlt, FaRobot, FaHeartbeat, FaCalendarAlt,
  FaQrcode, FaBell, FaStethoscope
} from 'react-icons/fa';
import Header from '../components/layout/Header';

const LandingPage = () => {
  const features = [
    { 
      icon: <FaRobot />, 
      title: "AI Symptom Analysis", 
      desc: "Conversational AI engine analyzes symptoms through natural language and generates risk scores",
      color: "#10b981"
    },
    { 
      icon: <FaChartLine />, 
      title: "Risk Assessment", 
      desc: "Real-time severity classification from low to emergency with intelligent prioritization",
      color: "#3b82f6"
    },
    { 
      icon: <FaVideo />, 
      title: "Video Consultations", 
      desc: "HD video calls with doctors powered by secure Jitsi API integration",
      color: "#8b5cf6"
    },
    { 
      icon: <FaQrcode />, 
      title: "Smart Medical Records", 
      desc: "QR code-based secure sharing with AI analysis of X-rays and lab reports",
      color: "#f59e0b"
    },
    { 
      icon: <FaCalendarAlt />, 
      title: "Smart Scheduling", 
      desc: "Automatic appointment booking based on AI risk assessment results",
      color: "#ec4899"
    },
    { 
      icon: <FaBell />, 
      title: "Real-time Alerts", 
      desc: "Email notifications for appointments, assessments, and emergency situations",
      color: "#06b6d4"
    }
  ];

  return (
    <div className="landing-page">
      <Header />
      
      {/* Hero Section */}
      <div className="hero-section-landing">
        <Container>
          <Row className="align-items-center min-vh-75">
            <Col lg={6} className="py-5">
              <div className="hero-badge mb-3">
                <span className="badge-pulse"></span>
                AI-Powered Healthcare
              </div>
              <h1 className="hero-title-landing">
                Smart Healthcare,
                <br />
                <span className="text-gradient">Right at Your Fingertips</span>
              </h1>
              <p className="hero-description">
                Experience intelligent symptom assessment with real-time AI analysis, 
                instant risk scoring, and seamless video consultations with qualified doctors.
              </p>
              <div className="hero-stats mb-4">
                <div className="stat-item">
                  <FaStethoscope className="stat-icon" />
                  <div>
                    <div className="stat-number">24/7</div>
                    <div className="stat-label">Availability</div>
                  </div>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <FaHeartbeat className="stat-icon" />
                  <div>
                    <div className="stat-number">AI-Powered</div>
                    <div className="stat-label">Risk Analysis</div>
                  </div>
                </div>
              </div>
              <div className="d-flex gap-3 flex-wrap">
                <Button as={Link} to="/register" className="btn-hero-primary">
                  Get Started Free
                </Button>
                <Button as={Link} to="/about" className="btn-hero-secondary">
                  Learn More
                </Button>
              </div>
            </Col>
            <Col lg={6} className="text-center">
              <div className="hero-illustration">
                <div className="floating-card card-1">
                  <FaRobot size={30} className="text-primary" />
                  <div className="ms-3">
                    <div className="fw-bold">AI Analysis</div>
                    <small className="text-muted">Real-time assessment</small>
                  </div>
                </div>
                <div className="floating-card card-2">
                  <FaVideo size={30} className="text-success" />
                  <div className="ms-3">
                    <div className="fw-bold">Video Call</div>
                    <small className="text-muted">Connect with doctors</small>
                  </div>
                </div>
                <div className="floating-card card-3">
                  <FaShieldAlt size={30} className="text-danger" />
                  <div className="ms-3">
                    <div className="fw-bold">Secure</div>
                    <small className="text-muted">HIPAA compliant</small>
                  </div>
                </div>
                <div className="hero-emoji">🏥</div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Features Section */}
      <Container className="py-5 my-5">
        <div className="text-center mb-5">
          <h2 className="section-title-landing">Why Choose SymptomSync AI?</h2>
          <p className="section-subtitle">
            Advanced AI technology meets compassionate healthcare
          </p>
        </div>
        <Row className="g-4">
          {features.map((feature, idx) => (
            <Col md={6} lg={4} key={idx}>
              <Card className="feature-card-landing h-100">
                <Card.Body className="p-4">
                  <div 
                    className="feature-icon-wrapper mb-3" 
                    style={{ backgroundColor: `${feature.color}15` }}
                  >
                    <div style={{ color: feature.color, fontSize: '2rem' }}>
                      {feature.icon}
                    </div>
                  </div>
                  <h5 className="feature-title-landing">{feature.title}</h5>
                  <p className="feature-desc-landing">{feature.desc}</p>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      {/* How It Works */}
      <div className="how-it-works-section">
        <Container>
          <div className="text-center mb-5">
            <h2 className="section-title-landing text-white">How It Works</h2>
            <p className="section-subtitle text-white-50">
              Simple, fast, and secure healthcare journey
            </p>
          </div>
          <Row>
            <Col md={6} className="mb-4">
              <Card className="process-card">
                <Card.Body className="p-4">
                  <div className="process-icon patient-icon">
                    <FaUserInjured size={40} />
                  </div>
                  <h4 className="mb-3">For Patients</h4>
                  <div className="process-steps">
                    <div className="process-step">
                      <span className="step-number">1</span>
                      <span className="step-text">Describe symptoms naturally to AI</span>
                    </div>
                    <div className="process-step">
                      <span className="step-number">2</span>
                      <span className="step-text">Get instant risk assessment</span>
                    </div>
                    <div className="process-step">
                      <span className="step-number">3</span>
                      <span className="step-text">Book appointment with specialist</span>
                    </div>
                    <div className="process-step">
                      <span className="step-number">4</span>
                      <span className="step-text">Join video consultation</span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} className="mb-4">
              <Card className="process-card">
                <Card.Body className="p-4">
                  <div className="process-icon doctor-icon">
                    <FaUserMd size={40} />
                  </div>
                  <h4 className="mb-3">For Doctors</h4>
                  <div className="process-steps">
                    <div className="process-step">
                      <span className="step-number">1</span>
                      <span className="step-text">Receive AI-analyzed patient requests</span>
                    </div>
                    <div className="process-step">
                      <span className="step-number">2</span>
                      <span className="step-text">Review comprehensive assessment</span>
                    </div>
                    <div className="process-step">
                      <span className="step-number">3</span>
                      <span className="step-text">Conduct video consultations</span>
                    </div>
                    <div className="process-step">
                      <span className="step-number">4</span>
                      <span className="step-text">Provide care and follow-up</span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* CTA Section */}
      <Container className="py-5 my-5">
        <Card className="cta-card">
          <Card.Body className="p-5 text-center">
            <h2 className="cta-title">Ready to Experience Smart Healthcare?</h2>
            <p className="cta-subtitle">
              Join thousands using AI-powered symptom assessment and video consultations
            </p>
            <Button as={Link} to="/register" className="btn-cta">
              Create Free Account
              <span className="ms-2">→</span>
            </Button>
          </Card.Body>
        </Card>
      </Container>

      {/* Footer */}
      <footer className="footer-landing">
        <Container>
          <Row className="align-items-center">
            <Col md={6}>
              <div className="d-flex align-items-center mb-3 mb-md-0">
                <FaHeartbeat size={24} className="me-2" />
                <span className="fw-bold">SymptomSync AI</span>
              </div>
              <p className="text-white-50 small mb-0">
                © 2026 SymptomSync AI. All rights reserved.
              </p>
            </Col>
            <Col md={6} className="text-md-end">
              <p className="text-white-50 small mb-2">
                Built for healthcare innovation
              </p>
              <Link to="/about" className="footer-link">About</Link>
              <span className="mx-2 text-white-50">•</span>
              <Link to="/register" className="footer-link">Get Started</Link>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
};

export default LandingPage;