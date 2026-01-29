import React, { useState } from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import { FaPaperPlane, FaMicrophone } from 'react-icons/fa';

const ChatInput = ({ onSubmit }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input);
      setInput('');
    }
  };

  return (
    <Card className="shadow-custom fade-in">
      <Card.Body className="p-4">
        <h2 className="h4 mb-4 text-dark">How are you feeling today?</h2>
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <div className="position-relative">
              <Form.Control
                as="textarea"
                rows={4}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your symptoms in your own words... (e.g., 'I have a headache and feel dizzy')"
                className="pe-5"
                style={{ resize: 'none' }}
              />
              
              <Button 
                variant="link" 
                className="position-absolute top-0 end-0 m-2 text-muted"
                title="Voice input (coming soon)"
                type="button"
              >
                <FaMicrophone size={20} />
              </Button>
            </div>
          </Form.Group>

          <Button 
            variant="primary" 
            type="submit" 
            className="w-100 py-2"
            size="lg"
          >
            <FaPaperPlane className="me-2" />
            Analyze Symptoms
          </Button>
        </Form>

        <div className="mt-3 text-muted small">
          💡 <strong>Tip:</strong> Be as specific as possible. Include when symptoms started, severity, and any changes.
        </div>
      </Card.Body>
    </Card>
  );
};

export default ChatInput;