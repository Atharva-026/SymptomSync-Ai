import React, { useState } from 'react';
import { Card, Button, Row, Col, Alert } from 'react-bootstrap';
import { FaSmile, FaFrown } from 'react-icons/fa';

const PainScale = ({ onSelect }) => {
  const [selectedPain, setSelectedPain] = useState(null);

  const painLevels = [
    { value: 1, label: 'Very Mild', color: 'success', emoji: '😊' },
    { value: 2, label: 'Mild', color: 'success', emoji: '🙂' },
    { value: 3, label: 'Uncomfortable', color: 'warning', emoji: '😐' },
    { value: 4, label: 'Moderate', color: 'warning', emoji: '😕' },
    { value: 5, label: 'Distracting', color: 'warning', emoji: '😟' },
    { value: 6, label: 'Distressing', color: 'warning', emoji: '😣' },
    { value: 7, label: 'Unmanageable', color: 'danger', emoji: '😖' },
    { value: 8, label: 'Intense', color: 'danger', emoji: '😫' },
    { value: 9, label: 'Severe', color: 'danger', emoji: '😰' },
    { value: 10, label: 'Worst Possible', color: 'danger', emoji: '😱' },
  ];

  const handleSelect = (value) => {
    setSelectedPain(value);
    onSelect(value);
  };

  return (
    <Card className="shadow-custom fade-in">
      <Card.Body className="p-4">
        <h3 className="h4 mb-3">Pain Level Assessment</h3>
        <p className="text-muted mb-4">
          On a scale of 1-10, how would you rate your pain?
        </p>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <small className="text-success d-flex align-items-center">
            <FaSmile className="me-1" /> No Pain
          </small>
          <div className="flex-grow-1 mx-3" style={{ height: '8px', background: 'linear-gradient(to right, #28a745, #ffc107, #fd7e14, #dc3545)', borderRadius: '4px' }}></div>
          <small className="text-danger d-flex align-items-center">
            Worst Pain <FaFrown className="ms-1" />
          </small>
        </div>

        <Row className="g-2 mb-3">
          {painLevels.map((level) => (
            <Col xs={6} sm={4} md={3} lg={2} key={level.value}>
              <Button
                variant={selectedPain === level.value ? level.color : 'outline-secondary'}
                className={`w-100 py-3 transition-all ${selectedPain === level.value ? 'shadow' : ''}`}
                onClick={() => handleSelect(level.value)}
                style={{
                  transform: selectedPain === level.value ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <div className="fs-3">{level.emoji}</div>
                <div className="fw-bold">{level.value}</div>
                <small className="d-block" style={{ fontSize: '0.7rem' }}>
                  {level.label}
                </small>
              </Button>
            </Col>
          ))}
        </Row>

        {selectedPain && (
          <Alert variant="info" className="mb-0">
            <strong>Selected:</strong> Level {selectedPain} - {painLevels[selectedPain - 1].label}
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
};

export default PainScale;