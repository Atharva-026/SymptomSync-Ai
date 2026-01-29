import React from 'react';
import { Card, Badge, ListGroup, Alert } from 'react-bootstrap';
import { FaCheckCircle, FaExclamationTriangle, FaExclamationCircle, FaPhone } from 'react-icons/fa';

const RecommendationCard = ({ severity, title, description, actions, tips }) => {
  const severityConfig = {
    low: {
      variant: 'success',
      icon: FaCheckCircle,
      badge: '🟢 Low Risk',
      bgColor: '#d1f2eb',
      borderColor: '#28a745'
    },
    moderate: {
      variant: 'warning',
      icon: FaExclamationTriangle,
      badge: '🟡 Moderate Risk',
      bgColor: '#fff3cd',
      borderColor: '#ffc107'
    },
    high: {
      variant: 'danger',
      icon: FaExclamationCircle,
      badge: '🔴 High Risk',
      bgColor: '#f8d7da',
      borderColor: '#dc3545'
    },
    emergency: {
      variant: 'dark',
      icon: FaPhone,
      badge: '⚫ EMERGENCY',
      bgColor: '#212529',
      borderColor: '#212529',
      textColor: 'white'
    }
  };

  const config = severityConfig[severity] || severityConfig.low;
  const Icon = config.icon;

  return (
    <Card 
      className="shadow-custom fade-in" 
      style={{ 
        backgroundColor: config.bgColor,
        borderColor: config.borderColor,
        borderWidth: '3px',
        color: config.textColor || 'inherit'
      }}
    >
      <Card.Body className="p-4">
        <div className="d-flex align-items-start mb-3">
          <Icon size={32} className={`me-3 mt-1 text-${severity === 'emergency' ? 'white' : config.variant}`} />
          <div className="flex-grow-1">
            <Badge bg={config.variant} className="mb-2">
              {config.badge}
            </Badge>
            <h3 className="h4 fw-bold mb-2">{title}</h3>
            <p className="mb-0">{description}</p>
          </div>
        </div>

        {actions && actions.length > 0 && (
          <div className="mb-3">
            <h5 className="h6 fw-bold mb-2">Recommended Actions:</h5>
            <ListGroup variant={severity === 'emergency' ? 'dark' : 'flush'}>
              {actions.map((action, index) => (
                <ListGroup.Item 
                  key={index}
                  className="border-0 px-0 py-2"
                  style={{ 
                    backgroundColor: 'transparent',
                    color: config.textColor || 'inherit'
                  }}
                >
                  → {action}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        )}

        {tips && tips.length > 0 && (
          <div className="border-top pt-3" style={{ borderColor: severity === 'emergency' ? '#495057' : '#dee2e6' }}>
            <h5 className="h6 fw-bold mb-2">Self-Care Tips:</h5>
            <ul className="mb-0 ps-3">
              {tips.map((tip, index) => (
                <li key={index} className="mb-1 small">
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {severity === 'emergency' && (
          <Alert variant="danger" className="mt-4 mb-0 text-center">
            <h4 className="mb-2">📞 Call Emergency Services: 911</h4>
            <p className="mb-0 small">Do NOT drive yourself to the hospital</p>
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
};

export default RecommendationCard;