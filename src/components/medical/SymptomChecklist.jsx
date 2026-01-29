import React, { useState } from 'react';
import { Card, Form, Row, Col, Badge } from 'react-bootstrap';
import { FaListUl } from 'react-icons/fa';

const SymptomChecklist = ({ onSelect, primarySymptom }) => {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);

  // Symptoms categorized by body part
  const symptomsByCategory = {
    head: [
      'Headache',
      'Dizziness',
      'Nausea',
      'Vision changes',
      'Neck stiffness',
      'Light sensitivity',
      'Confusion'
    ],
    chest: [
      'Shortness of breath',
      'Rapid heartbeat',
      'Chest pressure',
      'Sweating',
      'Pain radiating to arm',
      'Lightheadedness',
      'Anxiety'
    ],
    abdomen: [
      'Nausea',
      'Vomiting',
      'Diarrhea',
      'Constipation',
      'Bloating',
      'Loss of appetite',
      'Blood in stool'
    ],
    general: [
      'Fever',
      'Chills',
      'Fatigue',
      'Weakness',
      'Weight loss',
      'Night sweats',
      'Loss of appetite'
    ]
  };

  // Get relevant symptoms based on primary complaint
  const getRelevantSymptoms = () => {
    if (primarySymptom?.id === 'head' || primarySymptom?.id === 'neck') {
      return symptomsByCategory.head;
    } else if (primarySymptom?.id === 'chest') {
      return symptomsByCategory.chest;
    } else if (primarySymptom?.id === 'abdomen') {
      return symptomsByCategory.abdomen;
    }
    return symptomsByCategory.general;
  };

  const relevantSymptoms = getRelevantSymptoms();

  const handleToggle = (symptom) => {
    const updated = selectedSymptoms.includes(symptom)
      ? selectedSymptoms.filter(s => s !== symptom)
      : [...selectedSymptoms, symptom];
    
    setSelectedSymptoms(updated);
    onSelect(updated);
  };

  return (
    <Card className="shadow-custom fade-in">
      <Card.Body className="p-4">
        <h3 className="h4 mb-3 d-flex align-items-center">
          <FaListUl className="text-primary me-2" />
          Additional Symptoms
        </h3>
        <p className="text-muted mb-4">
          Select any other symptoms you're experiencing
          {selectedSymptoms.length > 0 && (
            <Badge bg="primary" className="ms-2">
              {selectedSymptoms.length} selected
            </Badge>
          )}
        </p>

        <Row className="g-2">
          {relevantSymptoms.map((symptom, index) => (
            <Col xs={12} sm={6} md={4} key={index}>
              <Form.Check
                type="checkbox"
                id={`symptom-${index}`}
                label={symptom}
                checked={selectedSymptoms.includes(symptom)}
                onChange={() => handleToggle(symptom)}
                className="user-select-none"
                style={{
                  padding: '10px',
                  backgroundColor: selectedSymptoms.includes(symptom) ? '#e7f3ff' : '#f8f9fa',
                  borderRadius: '8px',
                  border: selectedSymptoms.includes(symptom) ? '2px solid #0d6efd' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              />
            </Col>
          ))}
        </Row>

        {selectedSymptoms.length > 0 && (
          <div className="mt-4 p-3 bg-light rounded">
            <p className="small mb-2"><strong>Selected symptoms:</strong></p>
            <div className="d-flex flex-wrap gap-2">
              {selectedSymptoms.map((symptom, index) => (
                <Badge
                  key={index}
                  bg="primary"
                  className="py-2 px-3"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleToggle(symptom)}
                >
                  {symptom} ✕
                </Badge>
              ))}
            </div>
          </div>
        )}

        {selectedSymptoms.length === 0 && (
          <div className="alert alert-info mt-3 mb-0">
            <small>💡 Select all symptoms that apply to help us provide better recommendations</small>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default SymptomChecklist;