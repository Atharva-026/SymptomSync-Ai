import React from 'react';
import { Navbar, Container } from 'react-bootstrap';
import { FaHeartbeat } from 'react-icons/fa';

const Header = () => {
  return (
    <Navbar className="gradient-header shadow-custom" variant="dark">
      <Container>
        <Navbar.Brand className="d-flex align-items-center">
          <FaHeartbeat size={32} className="me-3" />
          <div>
            <h1 className="mb-0 h3">SymptomSync AI</h1>
            <small className="text-white-50">Healthcare that truly listens</small>
          </div>
        </Navbar.Brand>
      </Container>
    </Navbar>
  );
};

export default Header;