import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  ListGroup,
  Alert,
  Spinner,
  Modal,
} from 'react-bootstrap';
import {
  FaUpload,
  FaQrcode,
  FaEye,
  FaTrash,
  FaShare,
  FaRobot,
  FaFilePdf,
  FaFileImage,
  FaDownload,
} from 'react-icons/fa';
import medicalRecordService from '../../services/medicalRecordService';
import UploadRecordModal from './UploadRecordModal';
import QRCodeDisplay from './QRCodeDisplay';
import AIAnalysisModal from './AIAnalysisModal';
import ShareRecordModal from './ShareRecordModal';

const MedicalRecordsDashboard = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const data = await medicalRecordService.getMyRecords();
      setRecords(data);
    } catch (err) {
      setError(err || 'Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (newRecord) => {
    setRecords([newRecord, ...records]);
    setShowUploadModal(false);
  };

  const handleShowQR = (record) => {
    setSelectedRecord(record);
    setShowQRModal(true);
  };

  const handleShowAIAnalysis = (record) => {
    setSelectedRecord(record);
    setShowAIModal(true);
  };

  const handleShowShare = (record) => {
    setSelectedRecord(record);
    setShowShareModal(true);
  };

  const handleDelete = async (recordId) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await medicalRecordService.deleteRecord(recordId);
        setRecords(records.filter((r) => r._id !== recordId));
      } catch (err) {
        alert('Failed to delete record');
      }
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType === 'application/pdf') {
      return <FaFilePdf className="text-danger" size={32} />;
    }
    return <FaFileImage className="text-primary" size={32} />;
  };

  const getRecordTypeBadge = (type) => {
    const badges = {
      lab_report: { bg: 'primary', text: '🧪 Lab Report' },
      prescription: { bg: 'success', text: '💊 Prescription' },
      scan: { bg: 'info', text: '🔬 Scan' },
      xray: { bg: 'warning', text: '🦴 X-Ray' },
      other: { bg: 'secondary', text: '📄 Other' },
    };
    const badge = badges[type] || badges.other;
    return <Badge bg={badge.bg}>{badge.text}</Badge>;
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading medical records...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h2 className="h3 mb-2">📋 My Medical Records</h2>
          <p className="text-muted">Upload, manage, and share your medical documents</p>
        </Col>
        <Col xs="auto">
          <Button variant="primary" size="lg" onClick={() => setShowUploadModal(true)}>
            <FaUpload className="me-2" />
            Upload New Record
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <h3 className="h2 text-primary mb-0">{records.length}</h3>
              <p className="text-muted mb-0">Total Records</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <h3 className="h2 text-success mb-0">
                {records.filter((r) => r.sharedWith?.length > 0).length}
              </h3>
              <p className="text-muted mb-0">Shared Records</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <h3 className="h2 text-info mb-0">
                {records.filter((r) => r.aiAnalysis).length}
              </h3>
              <p className="text-muted mb-0">AI Analyzed</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Records List */}
      {records.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5">
            <div style={{ fontSize: '5rem' }}>📄</div>
            <h5 className="mb-3">No medical records yet</h5>
            <p className="text-muted mb-4">
              Upload your medical documents to keep them organized and easily share with doctors
            </p>
            <Button variant="primary" onClick={() => setShowUploadModal(true)}>
              <FaUpload className="me-2" />
              Upload Your First Record
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row>
          {records.map((record) => (
            <Col md={6} lg={4} key={record._id} className="mb-4">
              <Card className="shadow-sm h-100 hover-card">
                <Card.Body>
                  <div className="d-flex align-items-start mb-3">
                    <div className="me-3">{getFileIcon(record.fileType)}</div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1 fw-bold">{record.title}</h6>
                      <small className="text-muted">
                        {new Date(record.uploadDate).toLocaleDateString()}
                      </small>
                    </div>
                  </div>

                  {getRecordTypeBadge(record.recordType)}

                  {record.description && (
                    <p className="small text-muted mt-2 mb-3">
                      {record.description.substring(0, 100)}
                      {record.description.length > 100 && '...'}
                    </p>
                  )}

                  {/* Tags */}
                  {record.tags && record.tags.length > 0 && (
                    <div className="mb-3">
                      {record.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} bg="light" text="dark" className="me-1">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Shared Status */}
                  {record.sharedWith && record.sharedWith.length > 0 && (
                    <Alert variant="success" className="py-2 mb-3 small">
                      Shared with {record.sharedWith.length} doctor(s)
                    </Alert>
                  )}

                  {/* AI Analysis Status */}
                  {record.aiAnalysis && (
                    <Alert variant="info" className="py-2 mb-3 small">
                      <FaRobot className="me-1" />
                      AI Analysis Available
                    </Alert>
                  )}

                  {/* Action Buttons */}
                  <div className="d-grid gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleShowQR(record)}
                    >
                      <FaQrcode className="me-2" />
                      Show QR Code
                    </Button>
                    <div className="btn-group">
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => handleShowAIAnalysis(record)}
                      >
                        <FaRobot className="me-1" />
                        AI Analysis
                      </Button>
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => handleShowShare(record)}
                      >
                        <FaShare className="me-1" />
                        Share
                      </Button>
                    </div>
                    <div className="btn-group">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        as="a"
                        href={`${process.env.REACT_APP_API_URL?.replace('/api', '')}${record.fileUrl}`}
                        target="_blank"
                      >
                        <FaEye className="me-1" />
                        View
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(record._id)}
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Modals */}
      <UploadRecordModal
        show={showUploadModal}
        onHide={() => setShowUploadModal(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      <QRCodeDisplay
        show={showQRModal}
        onHide={() => setShowQRModal(false)}
        record={selectedRecord}
      />

      <AIAnalysisModal
        show={showAIModal}
        onHide={() => setShowAIModal(false)}
        record={selectedRecord}
      />

      <ShareRecordModal
        show={showShareModal}
        onHide={() => setShowShareModal(false)}
        record={selectedRecord}
      />
    </Container>
  );
};

export default MedicalRecordsDashboard;