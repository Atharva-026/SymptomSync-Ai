import React, { useState } from 'react';
import { Card, Button, Badge, Spinner, Alert, Row, Col, Form } from 'react-bootstrap';
import providerService from '../../services/providerService';

console.log('HealthcareNavigator MODULE LOADED');
console.log('providerService imported as:', providerService);

const HealthcareNavigator = ({ symptoms, riskLevel }) => {
  const [city, setCity] = useState('');
  const [age, setAge] = useState('');
  const [comorbidities, setComorbidities] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [providers, setProviders] = useState([]);
  const [costEstimate, setCostEstimate] = useState(null);
  const [step, setStep] = useState('form');
  const [error, setError] = useState('');

  const getBudget = () => {
    if (riskLevel >= 75) return 'high';
    if (riskLevel >= 40) return 'medium';
    return 'low';
  };

  const handleSearch = async () => {
    if (!city.trim()) {
      setError('Please enter your city');
      return;
    }
    setError('');
    setLoading(true);
    
    console.log('=== SEARCH STARTED ===');
    console.log('symptoms:', symptoms);
    console.log('city:', city);
    console.log('providerService:', providerService);
    
    try {
      console.log('Step 1: Calling analyzeSymptoms...');
      const analysis = await providerService.analyzeSymptoms(
        symptoms, age, 'not specified', comorbidities
      );
      console.log('Step 1 DONE:', analysis);
      setAiAnalysis(analysis);

      console.log('Step 2: Calling getProviders...');
      const providerData = await providerService.getProviders(
        city, analysis.bodySystem || 'General', getBudget()
      );
      console.log('Step 2 DONE:', providerData);
      setProviders(providerData.providers || []);

      console.log('Step 3: Calling getCostEstimate...');
      if (analysis.possibleConditions?.[0]) {
        const tier = getBudget() === 'high' ? 'premium' 
                   : getBudget() === 'medium' ? 'mid' : 'budget';
        const cost = await providerService.getCostEstimate(
          analysis.possibleConditions[0],
          city, age, comorbidities, tier
        );
        console.log('Step 3 DONE:', cost);
        setCostEstimate(cost);
      }

      console.log('Setting step to results...');
      setStep('results');
      
    } catch (err) {
      console.log('=== CATCH BLOCK HIT ===');
      console.log('err.message:', err.message);
      console.log('err.response:', err.response);
      setError(`Error: ${err.response?.data?.message || err.response?.status || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (num) =>
    num ? `₹${Number(num).toLocaleString('en-IN')}` : '—';

  const getTierColor = (tier) =>
    tier === 'premium' ? 'warning' : tier === 'mid' ? 'info' : 'success';

  const getTierText = (tier) =>
    tier === 'premium' ? 'dark' : 'white';

  // ── FORM STEP ──
  if (step === 'form') return (
    <Card className="mt-4 border-2 border-primary shadow-sm">
      <Card.Header className="bg-primary text-white">
        <h6 className="mb-0">🏥 Find Hospitals & Estimate Treatment Cost</h6>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
        <Row className="g-3">
          <Col md={4}>
            <Form.Label className="small fw-bold">Your City *</Form.Label>
            <Form.Control
              placeholder="e.g. Mumbai, Nagpur, Delhi"
              value={city}
              onChange={e => setCity(e.target.value)}
            />
            <Form.Text className="text-muted small">
              Supported: Mumbai, Delhi, Pune, Nagpur, Bangalore, Chennai, Hyderabad, Ahmedabad
            </Form.Text>
          </Col>
          <Col md={4}>
            <Form.Label className="small fw-bold">Age (optional)</Form.Label>
            <Form.Control
              type="number"
              placeholder="e.g. 45"
              value={age}
              onChange={e => setAge(e.target.value)}
            />
          </Col>
          <Col md={4}>
            <Form.Label className="small fw-bold">Known Conditions (optional)</Form.Label>
            <Form.Control
              placeholder="e.g. diabetes, hypertension"
              value={comorbidities}
              onChange={e => setComorbidities(e.target.value)}
            />
          </Col>
        </Row>

        <Button
          variant="primary"
          className="mt-3 w-100 py-2"
          onClick={handleSearch}
          disabled={loading}
        >
          {loading
            ? <><Spinner size="sm" className="me-2" />Analyzing & Finding Hospitals...</>
            : '🔍 Find Best Hospitals & Estimate Costs'
          }
        </Button>

        <p className="text-muted small text-center mt-2 mb-0">
          ⚠️ Results are indicative only. Always consult a qualified doctor for medical decisions.
        </p>
      </Card.Body>
    </Card>
  );

  // ── RESULTS STEP ──
  return (
    <div className="mt-4">

      {/* AI Clinical Assessment */}
      {aiAnalysis && (
        <Card className="mb-3 shadow-sm">
          <Card.Header className="bg-light d-flex justify-content-between align-items-center">
            <strong>🤖 AI Clinical Assessment</strong>
            <Badge bg={
              aiAnalysis.riskLevel === 'emergency' ? 'danger' :
              aiAnalysis.riskLevel === 'high' ? 'warning' :
              aiAnalysis.riskLevel === 'moderate' ? 'info' : 'success'
            } text={aiAnalysis.riskLevel === 'high' ? 'dark' : 'white'}>
              {aiAnalysis.riskLevel?.toUpperCase()} — {aiAnalysis.riskScore}/100
            </Badge>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <p className="mb-1 small">
                  <strong>Condition:</strong> {aiAnalysis.normalizedSymptom}
                </p>
                <p className="mb-1 small">
                  <strong>ICD-10:</strong> {aiAnalysis.icd10_code} — {aiAnalysis.icd10_description}
                </p>
                <p className="mb-1 small">
                  <strong>Body System:</strong> {aiAnalysis.bodySystem}
                </p>
                <p className="mb-1 small">
                  <strong>Confidence:</strong> {Math.round((aiAnalysis.confidence || 0) * 100)}%
                </p>
              </Col>
              <Col md={6}>
                {aiAnalysis.redFlags?.length > 0 && (
                  <Alert variant="danger" className="py-2 mb-2 small">
                    <strong>🚨 Red Flags:</strong>
                    <ul className="mb-0 mt-1 ps-3">
                      {aiAnalysis.redFlags.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </Alert>
                )}
                {aiAnalysis.recommendations?.length > 0 && (
                  <div className="small">
                    <strong>Recommendations:</strong>
                    <ul className="mb-0 mt-1 ps-3">
                      {aiAnalysis.recommendations.slice(0, 3).map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}
              </Col>
            </Row>
            <p className="text-muted small mt-2 mb-0 fst-italic">{aiAnalysis.disclaimer}</p>
          </Card.Body>
        </Card>
      )}

      {/* Recommended Hospitals */}
      {providers.length > 0 && (
        <Card className="mb-3 shadow-sm">
          <Card.Header className="bg-light d-flex justify-content-between align-items-center">
            <strong>🏥 Recommended Hospitals in {city}</strong>
            <Badge bg="secondary">{providers.length} found</Badge>
          </Card.Header>
          <Card.Body className="p-0">
            {providers.map((h, i) => (
              <div
                key={h.id}
                className={`p-3 ${i < providers.length - 1 ? 'border-bottom' : ''}`}
              >
                <Row className="align-items-start">
                  <Col md={7}>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <strong>{i + 1}. {h.name}</strong>
                      {h.nabh && <Badge bg="success" className="small">NABH ✓</Badge>}
                      <Badge
                        bg={getTierColor(h.tier)}
                        text={getTierText(h.tier)}
                        className="small text-capitalize"
                      >
                        {h.tier}
                      </Badge>
                    </div>
                    <div className="text-muted small mt-1">
                      📍 {h.distance} &nbsp;|&nbsp;
                      ⭐ {h.rating} &nbsp;|&nbsp;
                      Rank Score: {h.rankScore}
                    </div>
                    <div className="mt-1">
                      {h.specializations?.slice(0, 3).map((s, j) => (
                        <Badge
                          key={j}
                          bg="light"
                          text="dark"
                          className="me-1 small border"
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                    {h.sentiment?.summary && (
                      <div className="text-muted small mt-1 fst-italic">
                        💬 "{h.sentiment.summary}"
                      </div>
                    )}
                  </Col>
                  <Col md={3}>
                    <div className="small text-muted">Estimated Cost</div>
                    <Badge
                      bg={
                        h.estimatedCostTier === 'High' ? 'danger' :
                        h.estimatedCostTier === 'Medium' ? 'warning' : 'success'
                      }
                      text={h.estimatedCostTier === 'Medium' ? 'dark' : 'white'}
                    >
                      {h.estimatedCostTier}
                    </Badge>
                    {h.sentiment?.score != null && (
                      <div className="text-muted small mt-1">
                        😊 {Math.round(h.sentiment.score * 100)}% positive reviews
                      </div>
                    )}
                  </Col>
                  <Col md={2} className="text-end">
                    <div className="small text-muted">{h.contact}</div>
                  </Col>
                </Row>
              </div>
            ))}
          </Card.Body>
        </Card>
      )}

      {/* Cost Estimate */}
      {costEstimate && (
        <Card className="mb-3 shadow-sm">
          <Card.Header className="bg-light d-flex justify-content-between align-items-center">
            <strong>💰 Treatment Cost Estimate — {city}</strong>
            <Badge bg="secondary" className="text-capitalize">{costEstimate.cityTier} pricing</Badge>
          </Card.Header>
          <Card.Body>
            <Row className="g-2 mb-3">
              {costEstimate.breakdown && Object.entries(costEstimate.breakdown).map(([key, val]) => {
                const label = key.replace(/([A-Z])/g, ' $1').trim();
                let display = '—';
                if (val?.min !== undefined && val?.max !== undefined) {
                  display = `${formatCurrency(val.min)} – ${formatCurrency(val.max)}`;
                } else if (val?.days) {
                  display = `${val.days.min}–${val.days.max} days (${val.roomType})`;
                  if (val.cost) {
                    display += ` | ${formatCurrency(val.cost.min)} – ${formatCurrency(val.cost.max)}`;
                  }
                }
                return (
                  <Col md={4} key={key}>
                    <div className="small text-muted text-capitalize">{label}</div>
                    <div className="fw-bold small">{display}</div>
                  </Col>
                );
              })}
            </Row>

            <hr className="my-2" />

            <div className="d-flex align-items-center gap-3 flex-wrap">
              <div>
                <span className="text-muted small">Total Estimate: </span>
                <span className="text-primary fw-bold fs-5">
                  {formatCurrency(costEstimate.totalEstimate?.min)} – {formatCurrency(costEstimate.totalEstimate?.max)}
                </span>
              </div>
              <Badge bg="light" text="dark" className="border small">
                Confidence: {Math.round((costEstimate.confidenceScore || 0) * 100)}%
              </Badge>
            </div>

            {costEstimate.comorbidityImpact?.length > 0 && (
              <Alert variant="warning" className="mt-2 py-2 small mb-1">
                <strong>⚠️ Comorbidity Impact:</strong> {costEstimate.comorbidityImpact.join(', ')}
              </Alert>
            )}

            {costEstimate.notes?.map((n, i) => (
              <div key={i} className="text-muted small">• {n}</div>
            ))}

            <p className="text-muted small mt-2 mb-0 fst-italic">{costEstimate.disclaimer}</p>
          </Card.Body>
        </Card>
      )}

      <Button
        variant="outline-secondary"
        size="sm"
        onClick={() => { setStep('form'); setAiAnalysis(null); setProviders([]); setCostEstimate(null); }}
      >
        🔄 Search Again
      </Button>
    </div>
  );
};

export default HealthcareNavigator;