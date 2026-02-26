import React, { useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { 
  FaRobot, 
  FaUsers, 
  FaVideo, 
  FaFileMedical, 
  FaShieldAlt, 
  FaChartLine,
  FaExternalLinkAlt,
  FaDollarSign,
  FaHospital,
  FaUserMd,
  FaHandHoldingHeart
} from 'react-icons/fa';
import './AboutPage.css';

const AboutPage = () => {
  const [hoveredCard, setHoveredCard] = useState(null);

  const marketResearch = [
    {
      icon: <FaChartLine />,
      title: "Telemedicine Market",
      link: "https://www.grandviewresearch.com/industry-analysis/telemedicine-industry",
      summary: "$285B projected by 2030 with 17-20% CAGR. Post-COVID adoption now normalized globally.",
      color: "#10b981"
    },
    {
      icon: <FaRobot />,
      title: "AI in Healthcare",
      link: "https://www.marketsandmarkets.com/Market-Reports/artificial-intelligence-healthcare-market-54679303.html",
      summary: "$187B by 2030. Major growth in risk prediction, symptom triage, and decision support systems.",
      color: "#3b82f6"
    },
    {
      icon: <FaHandHoldingHeart />,
      title: "Elderly Care Market",
      link: "https://www.who.int/news-room/fact-sheets/detail/ageing-and-health",
      summary: "By 2050, 1 in 6 people will be 65+. Growing need for family-assisted digital health solutions.",
      color: "#8b5cf6"
    },
    {
      icon: <FaHospital />,
      title: "Competitor Analysis",
      link: "https://www.practo.com",
      summary: "Major players focus on booking/video. Gap exists in AI triage, family access, and QR sharing.",
      color: "#f59e0b"
    }
  ];

  const features = [
    {
      icon: <FaRobot />,
      title: "AI Symptom Analysis",
      desc: "Real-time risk scoring (0-100%) with severity classification"
    },
    {
      icon: <FaUsers />,
      title: "Family Access System",
      desc: "Caregiver support with permission-based patient record access"
    },
    {
      icon: <FaVideo />,
      title: "Secure Video Consult",
      desc: "Low-latency consultations powered by Jitsi API"
    },
    {
      icon: <FaFileMedical />,
      title: "QR Medical Records",
      desc: "Instant, tokenized sharing with doctors and family"
    },
    {
      icon: <FaShieldAlt />,
      title: "Emergency Triage",
      desc: "Automatic 911 alert for high-risk assessments"
    },
    {
      icon: <FaUserMd />,
      title: "Doctor Dashboard",
      desc: "Prioritized patient queue based on AI risk scores"
    }
  ];

  const businessModels = [
    {
      icon: <FaDollarSign />,
      title: "Freemium Model",
      desc: "Basic features free, advanced AI diagnostics premium"
    },
    {
      icon: <FaHospital />,
      title: "B2B Hospital SaaS",
      desc: "Enterprise licensing for clinics and healthcare systems"
    },
    {
      icon: <FaUsers />,
      title: "Caregiver Premium",
      desc: "Advanced family dashboard with analytics and alerts"
    }
  ];

  return (
    <div className="about-page-new">
      {/* Hero Section */}
      <div className="hero-section">
        <Container>
          <div className="hero-content">
            <h1 className="hero-title">SymptomSync AI</h1>
            <p className="hero-subtitle">
              AI-powered family-centric telemedicine platform bridging patients, doctors, and caregivers 
              through intelligent triage, real-time consultations, and secure medical record management. 
              Addressing the $285B telemedicine market with innovative AI risk assessment and 
              elder-care focused design.
            </p>
          </div>
        </Container>
      </div>

      <Container className="py-5">
        {/* Key Features Grid */}
        <section className="section-features mb-5">
          <h2 className="section-title">Key Features</h2>
          <Row className="g-4">
            {features.map((feature, idx) => (
              <Col md={4} key={idx}>
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
                    <div className="feature-icon">{feature.icon}</div>
                    <h5 className="feature-title">{feature.title}</h5>
                    <p className="feature-desc">{feature.desc}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        {/* Architecture Diagram */}
        <section className="section-architecture mb-5">
          <h2 className="section-title">System Architecture</h2>
          <Card className="architecture-card">
            <Card.Body className="p-0">
              <div className="architecture-wrapper">
                <img 
                  src="/architecture-diagram.png" 
                  alt="SymptomSync AI Architecture" 
                  className="architecture-img"
                />
                <div className="architecture-overlay">
                  <p className="architecture-caption">
                    End-to-end patient journey: AI symptom analysis → Risk classification → 
                    Appointment booking → Video consultation → Smart EHR storage
                  </p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </section>

        {/* Market Research */}
        <section className="section-market mb-5">
          <h2 className="section-title">Market Research & Validation</h2>
          <Row className="g-4">
            {marketResearch.map((research, idx) => (
              <Col md={6} lg={3} key={idx}>
                <a 
                  href={research.link} 
                  target="_blank" 
                  rel="noreferrer"
                  className="market-card-link"
                >
                  <Card 
                    className="market-card"
                    style={{ borderTop: `4px solid ${research.color}` }}
                    onMouseEnter={() => setHoveredCard(`market-${idx}`)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <Card.Body>
                      <div 
                        className="market-icon" 
                        style={{ color: research.color }}
                      >
                        {research.icon}
                      </div>
                      <h6 className="market-title">
                        {research.title}
                        <FaExternalLinkAlt className="external-icon" />
                      </h6>
                      <p className="market-summary">{research.summary}</p>
                    </Card.Body>
                  </Card>
                </a>
              </Col>
            ))}
          </Row>

          {/* Market Summary */}
          <Card className="market-summary-card mt-4">
            <Card.Body>
              <h5 className="mb-3">📊 Market Opportunity</h5>
              <p className="text-muted mb-0">
                The global telemedicine market is projected to exceed <strong>$285 billion by 2030</strong>, 
                growing at over 17% CAGR. AI in healthcare will reach <strong>$187 billion by 2030</strong>, 
                driven by predictive risk assessment demand. With the elderly population rapidly increasing, 
                there's a critical need for <strong>family-assisted digital healthcare</strong>. Current platforms 
                lack integrated AI triage and caregiver systems—<strong>SymptomSync AI fills this gap</strong>.
              </p>
            </Card.Body>
          </Card>
        </section>

        {/* Business Model */}
        <section className="section-business">
          <h2 className="section-title">Revenue Models</h2>
          <Row className="g-4">
            {businessModels.map((model, idx) => (
              <Col md={4} key={idx}>
                <Card className="business-card">
                  <Card.Body className="text-center">
                    <div className="business-icon">{model.icon}</div>
                    <h5 className="business-title">{model.title}</h5>
                    <p className="business-desc">{model.desc}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Competitive Advantage */}
          <Card className="advantage-card mt-4">
            <Card.Body>
              <h5 className="mb-3">🎯 Competitive Advantage</h5>
              <Row>
                <Col md={6}>
                  <div className="advantage-item">
                    <strong>Existing Apps:</strong> Basic booking + video calls
                  </div>
                  <div className="advantage-item">
                    <strong>Practo, 1mg, Apollo:</strong> No AI risk scoring
                  </div>
                </Col>
                <Col md={6}>
                  <div className="advantage-item advantage-ours">
                    <strong>SymptomSync AI:</strong> AI triage + Family access
                  </div>
                  <div className="advantage-item advantage-ours">
                    <strong>Our Edge:</strong> QR sharing + Elder-care focus
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </section>
      </Container>
    </div>
  );
};

export default AboutPage;