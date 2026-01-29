import React from 'react';
import { Card, Button, Alert } from 'react-bootstrap';
import { FaPhone, FaExclamationTriangle, FaAmbulance } from 'react-icons/fa';

const EmergencyWarning = ({ onAcknowledge, symptoms }) => {
  return (
    <Card 
      className="shadow-lg fade-in border-danger" 
      style={{ 
        borderWidth: '4px',
        animation: 'pulse 2s infinite'
      }}
    >
      <Card.Body className="p-4 bg-danger text-white">
        <div className="text-center mb-4">
          <FaAmbulance size={64} className="mb-3" />
          <h2 className="h3 fw-bold mb-2">⚠️ EMERGENCY ALERT ⚠️</h2>
          <p className="h5 mb-0">Your symptoms require immediate medical attention</p>
        </div>

        <Alert variant="light" className="mb-4">
          <div className="d-flex align-items-start">
            <FaExclamationTriangle className="text-danger me-2 mt-1" size={20} />
            <div>
              <strong>Symptoms indicating emergency:</strong>
              <p className="mb-0 mt-1">{symptoms}</p>
            </div>
          </div>
        </Alert>

        <div className="bg-white text-dark rounded p-4 mb-4">
          <h4 className="h5 fw-bold mb-3 text-danger">
            🚨 IMMEDIATE ACTIONS REQUIRED:
          </h4>
          <ol className="mb-0 ps-3">
            <li className="mb-2">
              <strong>Call 911 immediately</strong> or have someone call for you
            </li>
            <li className="mb-2">
              <strong>Do NOT drive yourself</strong> to the hospital
            </li>
            <li className="mb-2">
              <strong>Stay calm</strong> and sit or lie down in a comfortable position
            </li>
            <li className="mb-2">
              <strong>Unlock your door</strong> so emergency responders can enter
            </li>
            <li className="mb-0">
              <strong>Have someone stay with you</strong> until help arrives
            </li>
          </ol>
        </div>

        <div className="text-center">
          <Button
            variant="light"
            size="lg"
            className="fw-bold px-5 py-3 mb-3"
            style={{ fontSize: '1.5rem' }}
            onClick={() => window.open('tel:911')}
          >
            <FaPhone className="me-2" />
            CALL 911 NOW
          </Button>

          <div className="text-white-50 small">
            <p className="mb-2">If you are not in the United States:</p>
            <p className="mb-0">Call your local emergency number immediately</p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-top border-light">
          <Button
            variant="outline-light"
            className="w-100"
            onClick={onAcknowledge}
          >
            I understand and have called for help
          </Button>
        </div>
      </Card.Body>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7); }
          50% { box-shadow: 0 0 0 20px rgba(220, 53, 69, 0); }
        }
      `}</style>
    </Card>
  );
};

export default EmergencyWarning;