import React, { useState, useEffect } from 'react';
import { Container, Card, Alert, Spinner, Button, Badge, Row, Col } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaFilePdf, FaFileImage, FaDownload, FaArrowLeft, FaRobot } from 'react-icons/fa';
import medicalRecordService from '../services/medicalRecordService';
import { useAuth } from '../context/AuthContext';
import AIAnalysisModal from '../components/medical/AIAnalysisModal';

const ViewSharedRecord = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAIModal, setShowAIModal] = useState(false);

  useEffect(() => {
    fetchRecord();
  }, [token]);

  const fetchRecord = async () => {
    try {
      setLoading(true);
      const data = await medicalRecordService.getRecordByToken(token);
      setRecord(data);
    } catch (err) {
      setError(err || 'Failed to load record');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType === 'application/pdf') {
      return <FaFilePdf className="text-danger" size={64} />;
    }
    return <FaFileImage className="text-primary" size={64} />;
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading medical record...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <h5>Error</h5>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => navigate('/')}>
            Go Home
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!record) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <h5>Record Not Found</h5>
          <p>The medical record you're looking for doesn't exist or has been removed.</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Button variant="outline-secondary" className="mb-4" onClick={() => navigate(-1)}>
        <FaArrowLeft className="me-2" />
        Back
      </Button>

      <Card className="shadow-lg border-0">
        <Card.Header className="bg-primary text-white">
          <h4 className="mb-0">Medical Record</h4>
        </Card.Header>
        <Card.Body className="p-4">
          {/* Patient Info */}
          <Row className="mb-4">
            <Col md={8}>
              <h5 className="mb-3">{record.title}</h5>
              <p className="text-muted mb-2">
                <strong>Patient:</strong> {record.patient?.name}
              </p>
              <p className="text-muted mb-2">
                <strong>Date:</strong> {new Date(record.recordDate).toLocaleDateString()}
              </p>
              <p className="text-muted mb-0">
                <strong>Uploaded:</strong> {new Date(record.uploadDate).toLocaleDateString()}
              </p>
            </Col>
            <Col md={4} className="text-center">
              {getFileIcon(record.fileType)}
            </Col>
          </Row>

          {/* Description */}
          {record.description && (
            <Alert variant="info">
              <strong>Description:</strong>
              <p className="mb-0 mt-2">{record.description}</p>
            </Alert>
          )}

          {/* Tags */}
          {record.tags && record.tags.length > 0 && (
            <div className="mb-4">
              <strong className="d-block mb-2">Tags:</strong>
              {record.tags.map((tag, index) => (
                <Badge key={index} bg="secondary" className="me-2">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="d-grid gap-2 mb-4">
            <Button
              variant="primary"
              size="lg"
              as="a"
              href={`${process.env.REACT_APP_API_URL?.replace('/api', '')}${record.fileUrl}`}
              target="_blank"
            >
              <FaDownload className="me-2" />
              View Full Record
            </Button>
            <Button variant="outline-info" size="lg" onClick={() => setShowAIModal(true)}>
              <FaRobot className="me-2" />
              AI Analysis
            </Button>
          </div>

          {/* Doctor Access Info */}
          {user && user.role === 'doctor' && (
            <Alert variant="success">
              <strong>✓ Access Granted</strong>
              <p className="mb-0 mt-2">
                You now have access to this medical record. It has been added to your shared
                records dashboard.
              </p>
            </Alert>
          )}

          {/* Privacy Notice */}
          <Alert variant="warning" className="mb-0">
            <small>
              <strong>🔒 Privacy Protected:</strong> This record is shared securely. Access
              is tracked and can be revoked by the patient at any time.
            </small>
          </Alert>
        </Card.Body>
      </Card>

      {/* AI Analysis Modal */}
      <AIAnalysisModal
        show={showAIModal}
        onHide={() => setShowAIModal(false)}
        record={record}
      />
    </Container>
  );
};

export default ViewSharedRecord;