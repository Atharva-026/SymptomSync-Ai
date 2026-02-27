import React from 'react';
import { Navbar, Container, Button, Nav } from 'react-bootstrap';
import { FaHeartbeat, FaCalendarCheck, FaUserFriends, FaInfoCircle } from 'react-icons/fa';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleBookClick = () => {
    if (location.pathname === '/patient') {
      const event = new CustomEvent('trigger-assessment');
      window.dispatchEvent(event);
    } else {
      navigate('/patient');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('trigger-assessment'));
      }, 500);
    }
  };

  return (
    <Navbar className="gradient-header shadow-custom" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <FaHeartbeat size={32} className="me-3" />
          <div>
            <h1 className="mb-0 h3">SymptomSync AI</h1>
            <small className="text-white-50">Healthcare that truly listens</small>
          </div>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            {/* Always show About link */}
            <Nav.Link as={Link} to="/about" className="text-white me-3 d-flex align-items-center">
              <FaInfoCircle className="me-2" />
              About
            </Nav.Link>

            {/* Only show these when user is logged in */}
            {user && (
              <>
                <Nav.Link as={Link} to="/family-access" className="text-white me-4 d-flex align-items-center">
                  <FaUserFriends className="me-2" />
                  Family Access
                </Nav.Link>

                <Button 
                  variant="light" 
                  className="book-consultation-btn d-flex align-items-center fw-bold"
                  onClick={handleBookClick}
                >
                  <FaCalendarCheck className="me-2 text-primary" />
                  <span>Book a Consultation</span>
                </Button>
              </>
            )}

            {/* Show Login/Register when not logged in */}
            {!user && (
              <div className="d-flex gap-2">
                <Button 
                  as={Link}
                  to="/login" 
                  variant="outline-light"
                  size="sm"
                >
                  Login
                </Button>
                <Button 
                  as={Link}
                  to="/register" 
                  variant="light"
                  size="sm"
                >
                  Get Started
                </Button>
              </div>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;