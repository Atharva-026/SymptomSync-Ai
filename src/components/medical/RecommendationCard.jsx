// File: /src/components/medical/RecommendationCard.jsx
// BULLETPROOF VERSION - Handles all null/undefined cases

import React from 'react';
import { Card, Badge, ListGroup, Alert } from 'react-bootstrap';
import { FaExclamationTriangle, FaCheckCircle, FaInfoCircle, FaExclamationCircle } from 'react-icons/fa';

const RecommendationCard = ({ 
  severity, 
  title, 
  description, 
  actions, 
  tips 
}) => {
  // COMPREHENSIVE DEFAULTS - Handle null, undefined, empty string
  const safeSeverity = severity || 'moderate';
  const safeTitle = title || 'Health Assessment';
  const safeDescription = description || 'Based on your symptoms, here are our recommendations.';
  const safeActions = Array.isArray(actions) && actions.length > 0 
    ? actions 
    : ['Monitor your symptoms', 'Consult a healthcare professional if symptoms worsen'];
  const safeTips = Array.isArray(tips) && tips.length > 0 
    ? tips 
    : ['Stay hydrated', 'Get adequate rest'];

  const getSeverityConfig = () => {
    switch (safeSeverity) {
      case 'emergency':
        return {
          icon: FaExclamationTriangle,
          color: 'danger',
          bgClass: 'bg-danger bg-opacity-10',
          borderClass: 'border-danger'
        };
      case 'high':
        return {
          icon: FaExclamationCircle,
          color: 'warning',
          bgClass: 'bg-warning bg-opacity-10',
          borderClass: 'border-warning'
        };
      case 'moderate':
        return {
          icon: FaInfoCircle,
          color: 'info',
          bgClass: 'bg-info bg-opacity-10',
          borderClass: 'border-info'
        };
      case 'low':
      default:
        return {
          icon: FaCheckCircle,
          color: 'success',
          bgClass: 'bg-success bg-opacity-10',
          borderClass: 'border-success'
        };
    }
  };

  const config = getSeverityConfig();
  const Icon = config.icon;

  return (
    <Card className={`shadow-sm border-2 ${config.borderClass} mb-4`}>
      <Card.Header className={`${config.bgClass} border-0`}>
        <div className="d-flex align-items-center gap-3">
          <div className={`text-${config.color}`} style={{ fontSize: '24px' }}>
            <Icon />
          </div>
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2 mb-1">
              <Badge bg={config.color} className="text-uppercase">
                {safeSeverity} Risk
              </Badge>
            </div>
            <h5 className="mb-0">{safeTitle}</h5>
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        <p className="text-muted mb-4">{safeDescription}</p>

        {safeActions && safeActions.length > 0 && (
          <div className="mb-4">
            <h6 className="text-dark mb-3">
              <strong>Recommended Actions:</strong>
            </h6>
            <ListGroup variant="flush">
              {safeActions.map((action, index) => (
                <ListGroup.Item 
                  key={index} 
                  className="ps-0 border-0 py-2"
                >
                  <div className="d-flex gap-2">
                    <span className={`text-${config.color} fw-bold`}>
                      {index + 1}.
                    </span>
                    <span>{action}</span>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        )}

        {safeTips && safeTips.length > 0 && (
          <Alert variant={config.color} className="mb-0">
            <h6 className="alert-heading mb-2">
              <strong>💡 Health Tips:</strong>
            </h6>
            <ul className="mb-0 ps-3">
              {safeTips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </Alert>
        )}
      </Card.Body>

      {safeSeverity === 'emergency' && (
        <Card.Footer className="bg-danger text-white">
          <strong>⚠️ EMERGENCY:</strong> If symptoms worsen or you feel this is life-threatening, 
          call 911 or go to the nearest emergency room immediately.
        </Card.Footer>
      )}
    </Card>
  );
};

export default RecommendationCard;