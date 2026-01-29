import React, { useState } from 'react';
import { Card, Button, Form, Row, Col, InputGroup } from 'react-bootstrap';
import { FaClock } from 'react-icons/fa';

const DurationPicker = ({ onSelect }) => {
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState('hours');

  const handleSubmit = () => {
    if (amount) {
      onSelect({ amount: parseInt(amount), unit });
    }
  };

  const quickOptions = [
    { label: '30 minutes', amount: 30, unit: 'minutes' },
    { label: '2 hours', amount: 2, unit: 'hours' },
    { label: '1 day', amount: 1, unit: 'days' },
    { label: '3 days', amount: 3, unit: 'days' },
    { label: '1 week', amount: 1, unit: 'weeks' },
    { label: '2 weeks', amount: 2, unit: 'weeks' },
  ];

  return (
    <Card className="shadow-custom fade-in">
      <Card.Body className="p-4">
        <h3 className="h4 mb-4 d-flex align-items-center">
          <FaClock className="text-primary me-2" />
          When did this start?
        </h3>

        <div className="mb-4">
          <p className="small text-muted mb-2">Quick select:</p>
          <Row className="g-2">
            {quickOptions.map((option, index) => (
              <Col xs={6} sm={4} key={index}>
                <Button
                  variant="outline-primary"
                  className="w-100"
                  onClick={() => {
                    setAmount(option.amount.toString());
                    setUnit(option.unit);
                    onSelect(option);
                  }}
                >
                  {option.label}
                </Button>
              </Col>
            ))}
          </Row>
        </div>

        <div className="border-top pt-4">
          <p className="small text-muted mb-3">Or enter custom duration:</p>
          <InputGroup>
            <Form.Control
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter number"
              min="1"
            />
            
            <Form.Select 
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              style={{ maxWidth: '150px' }}
            >
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
            </Form.Select>

            <Button 
              variant="primary" 
              onClick={handleSubmit}
            >
              Confirm
            </Button>
          </InputGroup>
        </div>
      </Card.Body>
    </Card>
  );
};

export default DurationPicker;