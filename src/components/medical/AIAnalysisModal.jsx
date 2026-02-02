import React, { useState, useEffect } from 'react';
import { Modal, Button, Alert, Card, Spinner, Badge, ListGroup } from 'react-bootstrap';
import { FaRobot, FaCheckCircle, FaExclamationTriangle, FaLightbulb } from 'react-icons/fa';
import medicalRecordService from '../../services/medicalRecordService';

const AIAnalysisModal = ({ show, onHide, record }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show && record) {
      loadAnalysis();
    }
  }, [show, record]);

  const loadAnalysis = async () => {
    if (!record) return;

    // If already analyzed, use cached data
    if (record.aiAnalysis && record.aiAnalysis.summary) {
      setAnalysis(record.aiAnalysis);
      return;
    }

    // Request new analysis
    setLoading(true);
    setError('');

    try {
      const result = await medicalRecordService.analyzeRecord(record._id);
      setAnalysis(result);
    } catch (err) {
      setError(err || 'Failed to analyze record');
    } finally {
      setLoading(false);
    }
  };

  if (!record) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>
          <FaRobot className="me-2 text-primary" />
          AI Analysis
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Record Info */}
        <Card className="border-0 bg-light mb-4">
          <Card.Body>
            <h6 className="mb-1">{record.title}</h6>
            <small className="text-muted">
              Uploaded: {new Date(record.uploadDate).toLocaleDateString()}
            </small>
          </Card.Body>
        </Card>

        {error && <Alert variant="danger">{error}</Alert>}

        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" className="mb-3" />
            <p className="text-muted">
              AI is analyzing your medical record...
              <br />
              <small>This may take 10-30 seconds</small>
            </p>
          </div>
        )}

        {!loading && analysis && (
          <>
            {/* Powered By */}
            <div className="text-center mb-4">
              <Badge bg="primary" className="px-3 py-2">
                <FaRobot className="me-2" />
                Powered by Google Gemini AI
              </Badge>
            </div>

            {/* Summary */}
            <Card className="border-primary mb-4">
              <Card.Header className="bg-primary text-white">
                <strong>📋 Summary</strong>
              </Card.Header>
              <Card.Body>
                <p className="mb-0">{analysis.summary}</p>
              </Card.Body>
            </Card>

            {/* Key Findings */}
            {analysis.keyFindings && analysis.keyFindings.length > 0 && (
              <Card className="border-success mb-4">
                <Card.Header className="bg-success text-white">
                  <FaCheckCircle className="me-2" />
                  <strong>Key Findings</strong>
                </Card.Header>
                <ListGroup variant="flush">
                  {analysis.keyFindings.map((finding, index) => (
                    <ListGroup.Item key={index}>
                      <div className="d-flex align-items-start">
                        <span className="badge bg-success me-2 mt-1">{index + 1}</span>
                        <span>{finding}</span>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card>
            )}

            {/* Abnormal Values */}
            {analysis.abnormalValues && analysis.abnormalValues.length > 0 && (
              <Card className="border-warning mb-4">
                <Card.Header className="bg-warning text-dark">
                  <FaExclamationTriangle className="me-2" />
                  <strong>Values Requiring Attention</strong>
                </Card.Header>
                <ListGroup variant="flush">
                  {analysis.abnormalValues.map((value, index) => (
                    <ListGroup.Item key={index} className="bg-warning bg-opacity-10">
                      <div className="d-flex align-items-start">
                        <FaExclamationTriangle className="text-warning me-2 mt-1" />
                        <span>{value}</span>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card>
            )}

            {/* Recommendations */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <Card className="border-info mb-4">
                <Card.Header className="bg-info text-white">
                  <FaLightbulb className="me-2" />
                  <strong>Recommendations</strong>
                </Card.Header>
                <ListGroup variant="flush">
                  {analysis.recommendations.map((rec, index) => (
                    <ListGroup.Item key={index}>
                      <div className="d-flex align-items-start">
                        <FaLightbulb className="text-info me-2 mt-1" />
                        <span>{rec}</span>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card>
            )}

            {/* Analysis Info */}
            {analysis.analyzedAt && (
              <Alert variant="info" className="mb-0">
                <small>
                  <strong>Analyzed:</strong>{' '}
                  {new Date(analysis.analyzedAt).toLocaleString()}
                  {analysis.model && ` • Model: ${analysis.model}`}
                </small>
              </Alert>
            )}
          </>
        )}

        {!loading && !analysis && !error && (
          <div className="text-center py-4">
            <FaRobot size={64} className="text-muted mb-3" />
            <p className="text-muted">No analysis available yet</p>
            <Button variant="primary" onClick={loadAnalysis}>
              Generate AI Analysis
            </Button>
          </div>
        )}

        {/* Disclaimer */}
        <Alert variant="warning" className="mt-4 mb-0">
          <small>
            <strong>⚠️ Medical Disclaimer:</strong> This AI analysis is for informational
            purposes only and should not replace professional medical advice. Always consult
            with your healthcare provider for medical decisions.
          </small>
        </Alert>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AIAnalysisModal;