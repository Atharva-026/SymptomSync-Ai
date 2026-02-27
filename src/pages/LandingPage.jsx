import React, { useState } from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
  FaRobot, FaChartLine, FaVideo, FaQrcode, FaCalendarAlt, FaBell,
  FaHeartbeat, FaStethoscope, FaUserMd, FaUserInjured
} from 'react-icons/fa';
import Header from '../components/layout/Header';
import './LandingPage.css';

const LandingPage = () => {
  const [hoveredCard, setHoveredCard] = useState(null);

  const features = [
    { 
      icon: <FaRobot />, 
      title: "AI Symptom Analysis", 
      desc: "Conversational AI analyzes symptoms through natural language with real-time risk scoring (0-100%)",
      color: "#10b981"
    },
    { 
      icon: <FaChartLine />, 
      title: "Risk Assessment", 
      desc: "Intelligent severity classification from low to emergency with automated triage prioritization",
      color: "#3b82f6"
    },
    { 
      icon: <FaVideo />, 
      title: "Video Consultations", 
      desc: "Secure HD video calls with doctors powered by Jitsi API for real-time care delivery",
      color: "#8b5cf6"
    },
    { 
      icon: <FaQrcode />, 
      title: "Smart Medical Records", 
      desc: "QR code-based instant sharing with AI-powered analysis of X-rays and lab reports",
      color: "#f59e0b"
    },
    { 
      icon: <FaCalendarAlt />, 
      title: "Smart Scheduling", 
      desc: "Automatic appointment booking based on AI risk assessment with priority queuing",
      color: "#ec4899"
    },
    { 
      icon: <FaBell />, 
      title: "Real-time Alerts", 
      desc: "Email notifications for appointments, risk assessments, and emergency situations",
      color: "#06b6d4"
    }
  ];

  return (
    <div className="landing-page-new">
      <Header />
      
      {/* Hero Section */}
      <div className="hero-section-new">
        <Container>
          <div className="hero-content-new">
            <div className="hero-badge-new">
              <span className="badge-pulse-new"></span>
              AI-Powered Healthcare Platform
            </div>
            <h1 className="hero-title-new">
              Smart Healthcare, <br />
              <span className="text-gradient-new">Right at Your Fingertips</span>
            </h1>
            <p className="hero-subtitle-new">
              Experience intelligent symptom assessment with real-time AI analysis, instant risk scoring, 
              and seamless video consultations with qualified healthcare professionals.
            </p>
            <div className="hero-stats-new">
              <div className="stat-item-new">
                <FaStethoscope className="stat-icon-new" />
                <div>
                  <div className="stat-number-new">24/7</div>
                  <div className="stat-label-new">Availability</div>
                </div>
              </div>
              <div className="stat-divider-new"></div>
              <div className="stat-item-new">
                <FaHeartbeat className="stat-icon-new" />
                <div>
                  <div className="stat-number-new">AI-Powered</div>
                  <div className="stat-label-new">Risk Analysis</div>
                </div>
              </div>
            </div>
            <div className="hero-buttons">
              <Button as={Link} to="/register" className="btn-hero-primary-new">
                Get Started Free
              </Button>
              <Button as={Link} to="/about" className="btn-hero-secondary-new">
                Learn More
              </Button>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-5">
        {/* Features Section */}
        <section className="section-features-new mb-5">
          <h2 className="section-title-new">Why Choose SymptomSync AI?</h2>
          <p className="section-subtitle-new">
            Advanced AI technology meets compassionate healthcare
          </p>
          <Row className="g-4">
            {features.map((feature, idx) => (
              <Col md={6} lg={4} key={idx}>
                <Card 
                  className="feature-card-new"
                  onMouseEnter={() => setHoveredCard(`feature-${idx}`)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    transform: hoveredCard === `feature-${idx}` ? 'translateY(-10px)' : 'translateY(0)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Card.Body>
                    <div 
                      className="feature-icon-new" 
                      style={{ color: feature.color }}
                    >
                      {feature.icon}
                    </div>
                    <h5 className="feature-title-new">{feature.title}</h5>
                    <p className="feature-desc-new">{feature.desc}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        {/* How It Works */}
        <section className="section-process-new mb-5">
          <h2 className="section-title-new">How It Works</h2>
          <p className="section-subtitle-new">
            Simple, fast, and secure healthcare journey
          </p>
          <Row className="g-4">
            <Col md={6}>
              <Card className="process-card-new">
                <Card.Body className="p-4">
                  <div className="process-icon-new patient-icon-new">
                    <FaUserInjured size={40} />
                  </div>
                  <h4 className="process-title-new">For Patients</h4>
                  <div className="process-steps-new">
                    <div className="process-step-new">
                      <span className="step-number-new">1</span>
                      <span className="step-text-new">Describe symptoms naturally to AI</span>
                    </div>
                    <div className="process-step-new">
                      <span className="step-number-new">2</span>
                      <span className="step-text-new">Get instant risk assessment</span>
                    </div>
                    <div className="process-step-new">
                      <span className="step-number-new">3</span>
                      <span className="step-text-new">Book appointment with specialist</span>
                    </div>
                    <div className="process-step-new">
                      <span className="step-number-new">4</span>
                      <span className="step-text-new">Join video consultation</span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="process-card-new">
                <Card.Body className="p-4">
                  <div className="process-icon-new doctor-icon-new">
                    <FaUserMd size={40} />
                  </div>
                  <h4 className="process-title-new">For Doctors</h4>
                  <div className="process-steps-new">
                    <div className="process-step-new">
                      <span className="step-number-new">1</span>
                      <span className="step-text-new">Receive AI-analyzed patient requests</span>
                    </div>
                    <div className="process-step-new">
                      <span className="step-number-new">2</span>
                      <span className="step-text-new">Review comprehensive assessment</span>
                    </div>
                    <div className="process-step-new">
                      <span className="step-number-new">3</span>
                      <span className="step-text-new">Conduct video consultations</span>
                    </div>
                    <div className="process-step-new">
                      <span className="step-number-new">4</span>
                      <span className="step-text-new">Provide care and follow-up</span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </section>

        {/* CTA Section */}
        <section className="section-cta-new">
          <Card className="cta-card-new">
            <Card.Body className="p-5 text-center">
              <h2 className="cta-title-new">Ready to Experience Smart Healthcare?</h2>
              <p className="cta-subtitle-new">
                Join thousands using AI-powered symptom assessment and video consultations
              </p>
              <Button as={Link} to="/register" className="btn-cta-new">
                Create Free Account
                <span className="ms-2">→</span>
              </Button>
            </Card.Body>
          </Card>
        </section>
      </Container>

      {/* Footer */}
      <footer className="footer-new">
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
              <Link to="/about" className="footer-link-new">About</Link>
              <span className="mx-2 text-white-50">•</span>
              <Link to="/register" className="footer-link-new">Get Started</Link>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
};

export default LandingPage;