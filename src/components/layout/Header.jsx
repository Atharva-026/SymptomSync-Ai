import React from 'react';
import { Navbar, Container, Button } from 'react-bootstrap';
import { FaHeartbeat, FaCalendarCheck } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBookClick = () => {
    // If user is already on the patient dashboard, we want to trigger the assessment view
    if (location.pathname === '/patient') {
      // This is a custom event to tell the PatientDashboard to open the assessment
      const event = new CustomEvent('trigger-assessment');
      window.dispatchEvent(event);
    } else {
      // If elsewhere, navigate to the patient page
      navigate('/patient');
    }
  };

  return (
    <Navbar className="gradient-header shadow-custom" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand className="d-flex align-items-center">
          <FaHeartbeat size={32} className="me-3" />
          <div>
            <h1 className="mb-0 h3">SymptomSync AI</h1>
            <small className="text-white-50">Healthcare that truly listens</small>
          </div>
        </Navbar.Brand>

        {/* Right-aligned Book Button */}
        <div className="ms-auto">
          <Button 
            variant="light" 
            className="book-consultation-btn d-flex align-items-center fw-bold"
            onClick={handleBookClick}
          >
            <FaCalendarCheck className="me-2 text-primary" />
            <span>Book a Consultation</span>
          </Button>
        </div>
      </Container>
    </Navbar>
  );
};

export default Header;