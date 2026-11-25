import React from 'react';
import { Button } from 'react-bootstrap';
import { FaCalendarAlt, FaFlag, FaUserMd } from 'react-icons/fa';

const RISK = {
  low: { label: 'Low risk', bg: '#e7f6ec', color: '#067647', bar: '#12b76a' },
  moderate: { label: 'Moderate risk', bg: '#e8f1fe', color: '#175cd3', bar: '#2e90fa' },
  high: { label: 'High risk', bg: '#fff4e5', color: '#b54708', bar: '#f79009' },
  emergency: { label: 'Emergency', bg: '#fdecea', color: '#b42318', bar: '#f04438' }
};

const AssessmentCard = ({ a, onBook }) => {
  const risk = RISK[a.riskLevel];

  return (
    <div className="as-card">
      {risk && (
        <div className="as-head" style={{ background: risk.bg, color: risk.color }}>
          <div className="as-head-top">
            <span>{risk.label}</span>
            <span>{a.riskScore}%</span>
          </div>
          <div className="as-meter">
            <div style={{ width: `${a.riskScore}%`, background: risk.bar }} />
          </div>
        </div>
      )}

      {a.conditions.length > 0 && (
        <div className="as-section">
          <div className="as-label">Possible conditions</div>
          {a.conditions.map((c, i) => (
            <div key={i} className="as-cond">
              <span className={`as-pill ${c.likelihood}`}>{c.likelihood}</span>
              <div>
                <strong>{c.name}</strong>
                <div className="text-muted small">{c.reasoning}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {a.redFlags.length > 0 && (
        <div className="as-section as-flags">
          <div className="as-label" style={{ color: '#b42318' }}>
            <FaFlag className="me-1" /> Warning signs to watch for
          </div>
          <ul className="as-list">{a.redFlags.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </div>
      )}

      {a.nextSteps.length > 0 && (
        <div className="as-section">
          <div className="as-label">Suggested next steps</div>
          <ul className="as-list">{a.nextSteps.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      )}

      <div className="as-foot">
        <small className="text-muted">
          <FaUserMd className="me-1" />
          <strong>{a.recommendedSpecialty}</strong> &nbsp;|&nbsp; Confidence {Math.round((a.confidence || 0) * 100)}%
        </small>
        {onBook && (
          <Button size="sm" variant="success" onClick={() => onBook(a)}>
            <FaCalendarAlt className="me-2" />
            Book appointment
          </Button>
        )}
      </div>
    </div>
  );
};

export default AssessmentCard;