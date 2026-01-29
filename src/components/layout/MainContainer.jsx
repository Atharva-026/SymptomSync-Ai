import React from 'react';
import { Container } from 'react-bootstrap';

const MainContainer = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Container className="py-4">
        <div className="mx-auto" style={{ maxWidth: '900px' }}>
          {children}
        </div>
      </Container>
    </div>
  );
};

export default MainContainer;