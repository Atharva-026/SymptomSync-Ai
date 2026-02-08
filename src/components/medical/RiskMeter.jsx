// File: /src/components/medical/RiskMeter.jsx
// BULLETPROOF VERSION

import React from 'react';
import { Card, ProgressBar } from 'react-bootstrap';

const RiskMeter = ({ riskLevel }) => {
  // SAFETY: Handle null, undefined, NaN, strings, anything
  let safeRiskLevel = 50; // Default

  if (typeof riskLevel === 'number' && !isNaN(riskLevel)) {
    safeRiskLevel = Math.max(0, Math.min(100, riskLevel));
  } else if (typeof riskLevel === 'string') {
    const parsed = parseFloat(riskLevel);
    if (!isNaN(parsed)) {
      safeRiskLevel = Math.max(0, Math.min(100, parsed));
    }
  }

  const getRiskCategory = (score) => {
    if (score >= 80) return { label: 'EMERGENCY', color: 'danger', icon: '🚨' };
    if (score >= 60) return { label: 'HIGH', color: 'warning', icon: '⚠️' };
    if (score >= 40) return { label: 'MODERATE', color: 'info', icon: '📋' };
    return { label: 'LOW', color: 'success', icon: '✅' };
  };

  const risk = getRiskCategory(safeRiskLevel);

  return (
    <Card className="shadow-sm mb-4 border-0">
      <Card.Body>
        <div className="text-center mb-3">
          <h5 className="mb-2">
            {risk.icon} Risk Assessment
          </h5>
          <div className="display-4 fw-bold" style={{ color: `var(--bs-${risk.color})` }}>
            {Math.round(safeRiskLevel)}%
          </div>
          <div className={`badge bg-${risk.color} fs-6 mt-2`}>
            {risk.label} RISK
          </div>
        </div>

        <ProgressBar 
          now={safeRiskLevel} 
          variant={risk.color}
          style={{ height: '30px' }}
          className="mb-3"
        />

        <div className="d-flex justify-content-between text-muted small">
          <span>0% (No Risk)</span>
          <span>100% (Critical)</span>
        </div>
      </Card.Body>
    </Card>
  );
};

export default RiskMeter;