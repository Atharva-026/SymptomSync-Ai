import React, { useEffect, useState } from 'react';
import { Card, ProgressBar } from 'react-bootstrap';
import { FaExclamationTriangle } from 'react-icons/fa';

const RiskMeter = ({ riskLevel }) => {
  const [animatedRisk, setAnimatedRisk] = useState(0);

  useEffect(() => {
    // Animate the risk meter
    const timer = setTimeout(() => {
      setAnimatedRisk(riskLevel);
    }, 300);
    return () => clearTimeout(timer);
  }, [riskLevel]);

  const getRiskConfig = (level) => {
    if (level >= 80) {
      return {
        variant: 'danger',
        label: 'CRITICAL - EMERGENCY',
        icon: '🔴',
        message: 'Seek immediate medical attention',
        bgColor: '#dc3545'
      };
    } else if (level >= 60) {
      return {
        variant: 'danger',
        label: 'HIGH RISK',
        icon: '🟠',
        message: 'See a doctor within 24 hours',
        bgColor: '#fd7e14'
      };
    } else if (level >= 40) {
      return {
        variant: 'warning',
        label: 'MODERATE RISK',
        icon: '🟡',
        message: 'Monitor and consult doctor if worsens',
        bgColor: '#ffc107'
      };
    } else if (level >= 20) {
      return {
        variant: 'info',
        label: 'LOW RISK',
        icon: '🔵',
        message: 'Self-care recommended',
        bgColor: '#0dcaf0'
      };
    } else {
      return {
        variant: 'success',
        label: 'MINIMAL RISK',
        icon: '🟢',
        message: 'Continue monitoring',
        bgColor: '#28a745'
      };
    }
  };

  const config = getRiskConfig(animatedRisk);

  return (
    <Card className="shadow-custom fade-in border-0" style={{ position: 'sticky', top: '20px' }}>
      <Card.Body className="p-4">
        <h4 className="h5 mb-3 d-flex align-items-center">
          <FaExclamationTriangle className="text-warning me-2" />
          Risk Assessment
        </h4>

        {/* Risk Meter Visual */}
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="small fw-bold">{config.icon} {config.label}</span>
            <span className="small text-muted">{animatedRisk}%</span>
          </div>
          
          <ProgressBar
            now={animatedRisk}
            variant={config.variant}
            className="mb-2"
            style={{ height: '25px' }}
            animated
          />

          {/* Gradient Background Bar */}
          <div
            className="rounded mb-3"
            style={{
              height: '10px',
              background: 'linear-gradient(to right, #28a745 0%, #0dcaf0 20%, #ffc107 40%, #fd7e14 60%, #dc3545 80%)',
              position: 'relative'
            }}
          >
            {/* Pointer */}
            <div
              style={{
                position: 'absolute',
                left: `${animatedRisk}%`,
                top: '-5px',
                width: '0',
                height: '0',
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '12px solid black',
                transform: 'translateX(-50%)',
                transition: 'left 0.5s ease'
              }}
            />
          </div>
        </div>

        {/* Message */}
        <div
          className="alert mb-0"
          style={{
            backgroundColor: `${config.bgColor}20`,
            borderColor: config.bgColor,
            color: '#000'
          }}
        >
          <strong>Recommendation:</strong> {config.message}
        </div>

        {/* Risk Factors */}
        <div className="mt-3 pt-3 border-top">
          <p className="small text-muted mb-2">
            <strong>Risk calculated based on:</strong>
          </p>
          <ul className="small mb-0" style={{ fontSize: '0.85rem' }}>
            <li>Pain severity level</li>
            <li>Symptom duration</li>
            <li>Body part affected</li>
            <li>Additional symptoms</li>
          </ul>
        </div>
      </Card.Body>
    </Card>
  );
};

export default RiskMeter;