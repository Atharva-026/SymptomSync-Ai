import React from 'react';
import { Card, Form, Button, Spinner, Badge, Alert } from 'react-bootstrap';
import { FaRobot, FaPaperPlane, FaUser } from 'react-icons/fa';
import { useTamboThread, useTamboThreadInput } from '@tambo-ai/react';

const TamboAssessment = () => {
  const { thread, isLoading } = useTamboThread();
  const { value, setValue, submit, isPending } = useTamboThreadInput();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim() && !isPending) {
      submit();
      setValue('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
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
                {isPending ? 'Analyzing...' : 'Ready to help you'}
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
                    {/* Message Header */}
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
                                whiteSpace: 'pre-wrap'
                              }}
                            >
                              {part.text}
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
                      >
                        {message.content}
                      </div>
                    ) : null}

                    {/* Rendered Components - THIS IS WHERE THE MAGIC HAPPENS! */}
                    {message.renderedComponent && (
                      <div className="mt-3 component-container">
                        {message.renderedComponent}
                      </div>
                    )}

                    {/* Tool Invocations */}
                    {message.toolInvocations && message.toolInvocations.length > 0 && (
                      <div className="mt-2">
                        {message.toolInvocations.map((tool, idx) => (
                          <Badge key={idx} bg="info" className="me-2 mt-1">
                            🔧 {tool.toolName}
                          </Badge>
                        ))}
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
        <Form onSubmit={handleSubmit}>
          <div className="d-flex gap-2 align-items-end">
            <div className="flex-grow-1">
              <Form.Control
                as="textarea"
                rows={1}
                placeholder="Describe your symptoms... (Press Enter to send)"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isPending}
                className="rounded-3"
                style={{ 
                  resize: 'none',
                  minHeight: '44px'
                }}
              />
            </div>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={isPending || !value.trim()}
              className="rounded-circle d-flex align-items-center justify-content-center"
              style={{ 
                width: '44px', 
                height: '44px',
                padding: 0
              }}
              title="Send message"
            >
              {isPending ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <FaPaperPlane size={16} />
              )}
            </Button>
          </div>
        </Form>
        <div className="mt-2 text-center">
          <small className="text-muted">
            🤖 Powered by Tambo AI • Natural language medical assessment
          </small>
        </div>
      </Card.Footer>

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
          display: inline-block;
          max-width: 100%;
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
    </Card>
  );
};

export default TamboAssessment;