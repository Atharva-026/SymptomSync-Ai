import React from 'react';
import { Row, Col, Badge, Alert } from 'react-bootstrap';

const RISK = { low: 'success', moderate: 'info', high: 'warning', emergency: 'danger' };
const LIKELIHOOD = { high: 'danger', medium: 'warning', low: 'secondary' };

const Section = ({ title, children }) => (
  <div className="mb-3">
    <div className="text-uppercase text-muted fw-bold mb-1" style={{ fontSize: '0.72rem', letterSpacing: '0.06em' }}>
      {title}
    </div>
    {children}
  </div>
);

const List = ({ items, empty = 'None reported' }) =>
  items && items.length ? (
    <ul className="mb-0 ps-3">
      {items.map((x, i) => <li key={i}>{x}</li>)}
    </ul>
  ) : (
    <span className="text-muted">{empty}</span>
  );

const join = (arr) => (arr && arr.length ? arr.join(', ') : 'None reported');

const BriefPreview = ({ brief }) => {
  if (!brief) return null;
  const a = brief.aiAssessment;
  const stated = brief.statedHistory || {};

  return (
    <div style={{ fontSize: '0.95rem' }}>
      {brief.isEmergency && (
        <Alert variant="danger" className="py-2">
          The assistant flagged this as a possible emergency.
        </Alert>
      )}

      <Section title="Chief complaint">{brief.chiefComplaint}</Section>
      <Section title="History">{brief.history}</Section>

      <Row>
        <Col md={6}>
          <Section title="Reported symptoms"><List items={brief.pertinentPositives} /></Section>
        </Col>
        <Col md={6}>
          <Section title="Denied symptoms"><List items={brief.pertinentNegatives} /></Section>
        </Col>
      </Row>

      <Section title="Patient-stated background">
        <div><strong>Age / gender:</strong> {brief.patient?.age ?? 'Not provided'} / {brief.patient?.gender || 'Not provided'}</div>
        <div><strong>Conditions:</strong> {join(stated.conditions)}</div>
        <div><strong>Medications:</strong> {join(stated.medications)}</div>
        <div><strong>Allergies:</strong> {join(stated.allergies)}</div>
      </Section>

      {a && (
        <Section title="AI assessment">
          <div className="mb-2">
            {a.riskLevel && (
              <Badge bg={RISK[a.riskLevel] || 'secondary'} className="me-2">
                {a.riskLevel.toUpperCase()} risk ({a.riskScore}%)
              </Badge>
            )}
            <small className="text-muted">
              Suggested specialist: {a.recommendedSpecialty} | Confidence {Math.round((a.confidence || 0) * 100)}%
            </small>
          </div>
          {a.conditions?.map((c, i) => (
            <div key={i} className="mb-1">
              <Badge bg={LIKELIHOOD[c.likelihood] || 'secondary'} className="me-2">{c.likelihood}</Badge>
              <strong>{c.name}</strong>
              <div className="text-muted small ms-1">{c.reasoning}</div>
            </div>
          ))}
          {a.redFlags?.length > 0 && (
            <div className="mt-2">
              <strong className="text-danger">Red flags:</strong>
              <List items={a.redFlags} />
            </div>
          )}
        </Section>
      )}

      {brief.openQuestions?.length > 0 && (
        <Section title="To clarify with the patient"><List items={brief.openQuestions} /></Section>
      )}
    </div>
  );
};

export default BriefPreview;