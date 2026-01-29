import React, { useState } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { FaQuestionCircle, FaExclamationTriangle } from 'react-icons/fa';

const FollowUpQuestions = ({ questions, onComplete }) => {
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      onComplete(answers);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  if (!questions || questions.length === 0) {
    return null;
  }

  const question = questions[currentQuestion];
  const isAnswered = answers[question.id] !== undefined;
  const hasCriticalQuestion = questions.some(q => q.critical);

  return (
    <Card className="shadow-custom fade-in">
      <Card.Body className="p-4">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h3 className="h4 mb-0 d-flex align-items-center">
            <FaQuestionCircle className="text-primary me-2" />
            Additional Information
          </h3>
          <span className="badge bg-primary">
            Question {currentQuestion + 1} of {questions.length}
          </span>
        </div>

        {hasCriticalQuestion && (
          <Alert variant="warning" className="mb-4">
            <FaExclamationTriangle className="me-2" />
            These questions help us assess the urgency of your condition.
          </Alert>
        )}

        {/* Current Question */}
        <div className="mb-4">
          <div className="d-flex align-items-start mb-3">
            {question.critical && (
              <FaExclamationTriangle className="text-danger me-2 mt-1" />
            )}
            <h5 className="mb-0">{question.question}</h5>
          </div>

          {/* Yes/No Questions */}
          {question.type === 'yesno' && (
            <div className="d-flex gap-3">
              <Button
                variant={answers[question.id] === 'yes' ? 'success' : 'outline-success'}
                size="lg"
                className="flex-fill"
                onClick={() => handleAnswer(question.id, 'yes')}
              >
                ✓ Yes
              </Button>
              <Button
                variant={answers[question.id] === 'no' ? 'danger' : 'outline-danger'}
                size="lg"
                className="flex-fill"
                onClick={() => handleAnswer(question.id, 'no')}
              >
                ✗ No
              </Button>
            </div>
          )}

          {/* Multiple Choice Questions */}
          {question.type === 'multiple' && (
            <div className="d-grid gap-2">
              {question.options.map((option, index) => (
                <Button
                  key={index}
                  variant={answers[question.id] === option ? 'primary' : 'outline-primary'}
                  size="lg"
                  onClick={() => handleAnswer(question.id, option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          )}

          {/* Text Input Questions */}
          {question.type === 'text' && (
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Please describe..."
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswer(question.id, e.target.value)}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="d-flex justify-content-between gap-3">
          <Button
            variant="outline-secondary"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            ← Previous
          </Button>

          <Button
            variant="primary"
            onClick={handleNext}
            disabled={!isAnswered}
          >
            {currentQuestion === questions.length - 1 ? 'Complete Assessment' : 'Next →'}
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="mt-4">
          <div className="d-flex gap-1">
            {questions.map((_, index) => (
              <div
                key={index}
                style={{
                  flex: 1,
                  height: '4px',
                  backgroundColor: index <= currentQuestion ? '#0d6efd' : '#e9ecef',
                  borderRadius: '2px',
                  transition: 'background-color 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default FollowUpQuestions;