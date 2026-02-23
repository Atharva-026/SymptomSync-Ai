// File: /src/components/medical/TamboAssessment.jsx
// Updated version with external booking button

import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Spinner, Badge, Alert } from 'react-bootstrap';
import { FaRobot, FaPaperPlane, FaUser, FaCalendarAlt } from 'react-icons/fa';
import { useTamboThread, useTamboThreadInput } from '@tambo-ai/react';
import { useNavigate } from 'react-router-dom';
import formatMedicalResponse from '../../utils/responseFormatter';

const TamboAssessment = () => {
  const navigate = useNavigate();
  const { thread, isLoading } = useTamboThread();
  const { value, setValue, submit, isPending } = useTamboThreadInput();
  
  const [riskLevel, setRiskLevel] = useState(null);
  const [showBookingButton, setShowBookingButton] = useState(false);
  const [assessmentComplete, setAssessmentComplete] = useState(false);

  // Helper function to render formatted medical text with bold colored headings
  const renderFormattedText = (text) => {
    const lines = text.split('\n');
    const content = [];
    
    // List of heading keywords to highlight in bold blue
    const headingKeywords = [
      'RISK ASSESSMENT',
      'PROBLEM DESCRIPTION',
      'ASSOCIATED SYMPTOMS',
      'HOME TREATMENT',
      'WHEN TO SEEK MEDICAL HELP',
      'CLARIFYING QUESTIONS'
    ];
    
    lines.forEach((line, idx) => {
      const trimmedLine = line.trim();
      const upperLine = trimmedLine.toUpperCase();
      
      // Check if this line contains any heading keyword
      let isHeadingLine = false;
      let headingKeywordFound = '';
      
      for (let keyword of headingKeywords) {
        if (upperLine.includes(keyword)) {
          isHeadingLine = true;
          headingKeywordFound = keyword;
          break;
        }
      }
      
      if (isHeadingLine && headingKeywordFound) {
        // Find the position of the keyword in the original line
        const keywordIndex = upperLine.indexOf(headingKeywordFound);
        const beforeKeyword = trimmedLine.substring(0, keywordIndex);
        const actualKeyword = trimmedLine.substring(keywordIndex, keywordIndex + headingKeywordFound.length);
        const afterKeyword = trimmedLine.substring(keywordIndex + headingKeywordFound.length);
        
        // Render the line with keyword styled
        content.push(
          <span 
            key={`heading-${idx}`} 
            style={{ 
              display: 'block', 
              marginTop: '16px', 
              marginBottom: '8px',
              fontSize: '1em',
              letterSpacing: '0.2px',
              paddingTop: '4px',
              paddingBottom: '4px'
            }}
          >
            <span>{beforeKeyword}</span>
            <span style={{ fontWeight: 'bold', color: '#0056b3' }}>
              {actualKeyword}
            </span>
            <span>{afterKeyword}</span>
          </span>
        );
      } else if (trimmedLine === '') {
        content.push(
          <span key={`empty-${idx}`} style={{ display: 'block', height: '3px' }}>
            &nbsp;
          </span>
        );
      } else {
        content.push(
          <span key={`line-${idx}`} style={{ display: 'block', lineHeight: '1.6', marginLeft: '0px' }}>
            {line}
          </span>
        );
      }
    });
    
    return <div style={{ padding: '4px' }}>{content}</div>;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim() && !isPending) {
      submit().catch((error) => {
        console.error('❌ Streaming submit failed:', error);
      });
      setValue('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Monitor thread for risk calculation and assessment completion
  useEffect(() => {
    const messages = thread.messages || [];
    
    // Look for risk calculation in messages
    messages.forEach((message) => {
      if (message.role === 'assistant' && message.content) {
        const content = typeof message.content === 'string' 
          ? message.content 
          : JSON.stringify(message.content);
        
        // Check if this message contains risk data
        try {
          // Look for JSON with riskScore
          const riskMatch = content.match(/"riskScore":(\d+)/);
          const riskLevelMatch = content.match(/"riskLevel":"(\w+)"/);
          
          if (riskMatch && riskLevelMatch) {
            const score = parseInt(riskMatch[1]);
            const level = riskLevelMatch[1];
            
            setRiskLevel({ score, level });
            
            // Show booking button for moderate, high, or emergency
            if (['moderate', 'high', 'emergency'].includes(level)) {
              setShowBookingButton(true);
              setAssessmentComplete(true);
            }
          }
        } catch (err) {
          // Silent fail
        }

        // Also check for keywords indicating assessment is done
        if (content.includes('RecommendationCard') || 
            content.includes('assessment') ||
            content.includes('recommendation')) {
          setAssessmentComplete(true);
        }
      }

      // Check for rendered components indicating completion
      if (message.renderedComponent) {
        setAssessmentComplete(true);
      }
    });
  }, [thread.messages]);

  const handleBookAppointment = () => {
    // Save assessment data to localStorage for booking page
    if (riskLevel) {
      localStorage.setItem('lastAssessment', JSON.stringify({
        riskScore: riskLevel.score,
        riskLevel: riskLevel.level,
        timestamp: new Date().toISOString()
      }));
    }
    
    // Navigate to booking page (or open booking modal)
    navigate('/patient'); // This will show the booking interface
    // Or you could set a state to show BookingInterface modal
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'emergency': return 'danger';
      case 'high': return 'warning';
      case 'moderate': return 'info';
      case 'low': return 'success';
      default: return 'secondary';
    }
  };

  return (
    <div>
      <Card className="shadow-lg border-0">
        {/* Header */}
        <Card.Header className="bg-gradient-primary text-white py-3">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle bg-white text-primary p-2">
                <FaRobot size={24} />
              </div>
              <div>
                <h5 className="mb-0">SymptomSync AI Assistant</h5>
                <small className="opacity-75">
                  {isPending ? 'Analyzing...' : 'Powered by Tambo'}
                </small>
              </div>
            </div>
            {isPending && <Spinner animation="border" size="sm" />}
          </div>
        </Card.Header>

        {/* Messages Area */}
        <Card.Body 
          className="messages-container" 
          style={{ 
            height: '600px', 
            overflowY: 'auto',
            backgroundColor: '#f8f9fa',
            backgroundImage: 'linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)'
          }}
        >
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted mt-3">Loading conversation...</p>
            </div>
          ) : thread.messages.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-4">
                <FaRobot size={80} className="text-primary opacity-50" />
              </div>
              <h4 className="text-primary mb-3">Hello! I'm your AI Health Assistant 👋</h4>
              <p className="text-muted mb-4">
                I'm here to help assess your symptoms and guide you to appropriate care.
              </p>
              <Alert variant="info" className="mx-auto" style={{ maxWidth: '500px' }}>
                <strong>How it works:</strong>
                <ol className="mb-0 mt-2 text-start">
                  <li>Tell me about your symptoms</li>
                  <li>I'll ask follow-up questions</li>
                  <li>Get a personalized risk assessment</li>
                  <li>Receive care recommendations</li>
                  <li>Book an appointment if needed</li>
                </ol>
              </Alert>
              <p className="text-muted mt-3">
                <small>
                  💡 Try: "I have a headache" or "My throat is sore"
                </small>
              </p>
            </div>
          ) : (
            <div className="messages-list">
              {thread.messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`message-wrapper mb-4 ${
                    message.role === 'user' ? 'user-message' : 'assistant-message'
                  }`}
                >
                  <div className={`d-flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div 
                        className={`rounded-circle d-flex align-items-center justify-content-center ${
                          message.role === 'user' 
                            ? 'bg-primary text-white' 
                            : 'bg-white text-primary border border-primary'
                        }`}
                        style={{ width: '40px', height: '40px' }}
                      >
                        {message.role === 'user' ? <FaUser size={18} /> : <FaRobot size={18} />}
                      </div>
                    </div>

                    {/* Message Content */}
                    <div className="flex-grow-1" style={{ maxWidth: '80%' }}>
                      <div className={`mb-1 ${message.role === 'user' ? 'text-end' : 'text-start'}`}>
                        <Badge 
                          bg={message.role === 'user' ? 'primary' : 'success'}
                          className="me-2"
                        >
                          {message.role === 'user' ? 'You' : 'AI Assistant'}
                        </Badge>
                        <small className="text-muted">
                          {new Date(message.createdAt || Date.now()).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </small>
                      </div>

                      {/* Text Content */}
                      {Array.isArray(message.content) ? (
                        message.content.map((part, i) => {
                          if (part.type === 'text' && part.text) {
                            const textContent = message.role === 'assistant' 
                              ? formatMedicalResponse(part.text) 
                              : part.text;
                            return (
                              <div 
                                key={i} 
                                className={`message-bubble p-3 rounded-3 ${
                                  message.role === 'user' 
                                    ? 'bg-primary text-white' 
                                    : 'bg-white border shadow-sm'
                                }`}
                                style={{
                                  wordWrap: 'break-word',
                                  lineHeight: '1.6'
                                }}
                              >
                                {message.role === 'assistant' && typeof textContent === 'string'
                                  ? renderFormattedText(textContent)
                                  : textContent}
                              </div>
                            );
                          }
                          return null;
                        })
                      ) : typeof message.content === 'string' ? (
                        <div 
                          className={`message-bubble p-3 rounded-3 ${
                            message.role === 'user' 
                              ? 'bg-primary text-white' 
                              : 'bg-white border shadow-sm'
                          }`}
                          style={{
                            wordWrap: 'break-word',
                            lineHeight: '1.6'
                          }}
                        >
                          {message.role === 'assistant'
                            ? renderFormattedText(formatMedicalResponse(message.content))
                            : message.content}
                        </div>
                      ) : null}

                      {/* Rendered Components */}
                      {message.renderedComponent && (
                        <div className="mt-3 component-container">
                          {message.renderedComponent}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isPending && (
                <div className="message-wrapper mb-4">
                  <div className="d-flex gap-3">
                    <div className="flex-shrink-0">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center bg-white text-primary border border-primary"
                        style={{ width: '40px', height: '40px' }}
                      >
                        <FaRobot size={18} />
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <div className="message-bubble p-3 rounded-3 bg-white border shadow-sm">
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card.Body>

        {/* Input Area */}
        <Card.Footer className="bg-white border-top">
          <form onSubmit={handleSubmit}>
            <div className="d-flex gap-2 align-items-end">
              <div className="flex-grow-1">
                <Form.Control
                  as="textarea"
                  rows={1}
                  placeholder="Describe your symptoms..."
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isPending}
                  className="rounded-3"
                  style={{ resize: 'none', minHeight: '44px' }}
                />
              </div>
              <Button 
                type="submit" 
                variant="primary" 
                disabled={isPending || !value.trim()}
                className="rounded-circle"
                style={{ width: '44px', height: '44px', padding: 0 }}
              >
                {isPending ? <Spinner animation="border" size="sm" /> : <FaPaperPlane size={16} />}
              </Button>
            </div>
          </form>
          <div className="mt-2 text-center">
            <small className="text-muted">
              🤖 Powered by Tambo AI
            </small>
          </div>
        </Card.Footer>
      </Card>

      {/* BOOKING BUTTON - Shows outside chat when assessment is complete */}
      {showBookingButton && assessmentComplete && (
        <Alert variant={getRiskColor(riskLevel?.level)} className="mt-4 shadow-lg">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="alert-heading mb-2">
                📋 Assessment Complete - {riskLevel?.level?.toUpperCase()} Risk ({riskLevel?.score}%)
              </h5>
              <p className="mb-0">
                {riskLevel?.level === 'emergency' && 'Immediate medical attention recommended. '}
                {riskLevel?.level === 'high' && 'See a doctor within 24 hours. '}
                {riskLevel?.level === 'moderate' && 'Medical consultation recommended. '}
                Book an appointment with our specialists now.
              </p>
            </div>
            <Button 
              variant={getRiskColor(riskLevel?.level)}
              size="lg"
              onClick={handleBookAppointment}
              className="ms-3"
            >
              <FaCalendarAlt className="me-2" />
              Book Appointment
            </Button>
          </div>
        </Alert>
      )}

      {/* Styles */}
      <style>{`
        .bg-gradient-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .messages-container {
          scroll-behavior: smooth;
        }
        
        .messages-container::-webkit-scrollbar {
          width: 8px;
        }
        
        .messages-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .messages-container::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        
        .messages-container::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        
        .typing-indicator {
          display: flex;
          gap: 6px;
          padding: 4px 0;
        }
        
        .typing-indicator span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #667eea;
          animation: typing 1.4s infinite;
        }
        
        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
        
        .message-bubble {
          animation: fadeIn 0.3s ease-in;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .component-container {
          animation: slideIn 0.4s ease-out;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default TamboAssessment;