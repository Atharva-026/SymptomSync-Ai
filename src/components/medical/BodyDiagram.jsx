import React, { useState } from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { FaUser } from 'react-icons/fa';

const BodyDiagram = ({ onSelect }) => {
  const [selectedPart, setSelectedPart] = useState(null);

  const bodyParts = [
    { id: 'head', name: 'Head', emoji: '🧠', color: 'primary' },
    { id: 'neck', name: 'Neck', emoji: '🦴', color: 'info' },
    { id: 'chest', name: 'Chest', emoji: '🫁', color: 'danger' },
    { id: 'abdomen', name: 'Abdomen', emoji: '🫃', color: 'warning' },
    { id: 'back', name: 'Back', emoji: '🔙', color: 'secondary' },
    { id: 'left-arm', name: 'Left Arm', emoji: '💪', color: 'success' },
    { id: 'right-arm', name: 'Right Arm', emoji: '💪', color: 'success' },
    { id: 'left-leg', name: 'Left Leg', emoji: '🦵', color: 'primary' },
    { id: 'right-leg', name: 'Right Leg', emoji: '🦵', color: 'primary' },
  ];

  const handleSelect = (part) => {
    setSelectedPart(part);
    onSelect(part);
  };

  return (
    <Card className="shadow-custom fade-in">
      <Card.Body className="p-4">
        <h3 className="h4 mb-3 d-flex align-items-center">
          <FaUser className="text-primary me-2" />
          Where does it hurt?
        </h3>
        <p className="text-muted mb-4">
          Click on the body part that's bothering you
        </p>

        {/* Simple Body Diagram - Grid Layout */}
        <div className="text-center mb-4">
          <div className="d-inline-block border rounded p-4 bg-light" style={{ maxWidth: '400px' }}>
            {/* Head */}
            <div className="mb-3">
              <button
                onClick={() => handleSelect(bodyParts[0])}
                className={`btn ${selectedPart?.id === 'head' ? 'btn-primary' : 'btn-outline-primary'} rounded-circle`}
                style={{ width: '80px', height: '80px', fontSize: '2rem' }}
              >
                {bodyParts[0].emoji}
              </button>
            </div>

            {/* Neck */}
            <div className="mb-2">
              <button
                onClick={() => handleSelect(bodyParts[1])}
                className={`btn ${selectedPart?.id === 'neck' ? 'btn-info' : 'btn-outline-info'}`}
                style={{ width: '60px', height: '40px', fontSize: '1.5rem' }}
              >
                {bodyParts[1].emoji}
              </button>
            </div>

            {/* Shoulders & Arms */}
            <div className="d-flex justify-content-center align-items-center gap-2 mb-2">
              <button
                onClick={() => handleSelect(bodyParts[5])}
                className={`btn ${selectedPart?.id === 'left-arm' ? 'btn-success' : 'btn-outline-success'}`}
                style={{ width: '50px', height: '100px', fontSize: '1.5rem' }}
              >
                {bodyParts[5].emoji}
              </button>

              {/* Chest */}
              <button
                onClick={() => handleSelect(bodyParts[2])}
                className={`btn ${selectedPart?.id === 'chest' ? 'btn-danger' : 'btn-outline-danger'}`}
                style={{ width: '100px', height: '100px', fontSize: '2rem' }}
              >
                {bodyParts[2].emoji}
              </button>

              <button
                onClick={() => handleSelect(bodyParts[6])}
                className={`btn ${selectedPart?.id === 'right-arm' ? 'btn-success' : 'btn-outline-success'}`}
                style={{ width: '50px', height: '100px', fontSize: '1.5rem' }}
              >
                {bodyParts[6].emoji}
              </button>
            </div>

            {/* Abdomen */}
            <div className="mb-2">
              <button
                onClick={() => handleSelect(bodyParts[3])}
                className={`btn ${selectedPart?.id === 'abdomen' ? 'btn-warning' : 'btn-outline-warning'}`}
                style={{ width: '100px', height: '80px', fontSize: '2rem' }}
              >
                {bodyParts[3].emoji}
              </button>
            </div>

            {/* Back */}
            <div className="mb-3">
              <button
                onClick={() => handleSelect(bodyParts[4])}
                className={`btn ${selectedPart?.id === 'back' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                style={{ width: '100px', height: '60px', fontSize: '1.5rem' }}
              >
                {bodyParts[4].emoji}
              </button>
            </div>

            {/* Legs */}
            <div className="d-flex justify-content-center gap-3">
              <button
                onClick={() => handleSelect(bodyParts[7])}
                className={`btn ${selectedPart?.id === 'left-leg' ? 'btn-primary' : 'btn-outline-primary'}`}
                style={{ width: '45px', height: '120px', fontSize: '1.5rem' }}
              >
                {bodyParts[7].emoji}
              </button>
              <button
                onClick={() => handleSelect(bodyParts[8])}
                className={`btn ${selectedPart?.id === 'right-leg' ? 'btn-primary' : 'btn-outline-primary'}`}
                style={{ width: '45px', height: '120px', fontSize: '1.5rem' }}
              >
                {bodyParts[8].emoji}
              </button>
            </div>
          </div>
        </div>

        {/* Alternative: Button Grid for Mobile */}
        <div className="mb-3">
          <p className="small text-muted mb-2">Or select from list:</p>
          <Row className="g-2">
            {bodyParts.map((part) => (
              <Col xs={6} sm={4} key={part.id}>
                <button
                  onClick={() => handleSelect(part)}
                  className={`btn w-100 ${
                    selectedPart?.id === part.id
                      ? `btn-${part.color}`
                      : `btn-outline-${part.color}`
                  }`}
                >
                  {part.emoji} {part.name}
                </button>
              </Col>
            ))}
          </Row>
        </div>

        {selectedPart && (
          <div className="alert alert-info mb-0">
            <strong>Selected:</strong> {selectedPart.emoji} {selectedPart.name}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default BodyDiagram;