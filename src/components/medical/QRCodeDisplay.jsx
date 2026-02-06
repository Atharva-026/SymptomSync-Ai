import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Alert, Card } from 'react-bootstrap';
import { FaQrcode, FaDownload, FaCopy, FaCheckCircle } from 'react-icons/fa';
import QRCode from 'qrcode';

const QRCodeDisplay = ({ show, onHide, record }) => {
  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  const generateQRCode = useCallback(async () => {
    if (!record) return;
    
    try {
      // Create medical record data object
      const medicalRecordData = {
        type: 'MEDICAL_RECORD',
        recordId: record._id || record.id || '',
        patientName: record.patientName || 'Unknown',
        title: record.title || 'Medical Record',
        description: record.description || '',
        diagnosis: record.diagnosis || '',
        prescription: record.prescription || '',
        date: record.date || new Date().toISOString(),
        doctorName: record.doctorName || '',
      };

      // Convert to JSON string
      const jsonString = JSON.stringify(medicalRecordData);
      console.log('📱 Generating QR code with data:', jsonString);

      // Generate QR code as data URL
      const dataUrl = await QRCode.toDataURL(jsonString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrCodeDataUrl(dataUrl);
      console.log('✅ QR Code generated successfully');

    } catch (error) {
      console.error('❌ Error generating QR code:', error);
    }
  }, [record]);

  useEffect(() => {
    if (record && show) {
      generateQRCode();
    }
  }, [record, show, generateQRCode]);

  if (!record) return null;

  const shareUrl = record.shareToken 
    ? `${window.location.origin}/records/view/${record.shareToken}`
    : `${window.location.origin}/records/view/${record._id || record.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl) {
      alert('QR Code not generated yet. Please wait...');
      return;
    }

    // Create download link for QR code
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `${record.title || 'medical-record'}-QRCode.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <FaQrcode className="me-2" />
          Share Medical Record
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="info">
          <strong>📱 How to share:</strong>
          <ul className="mb-0 mt-2">
            <li>Show this QR code to your doctor</li>
            <li>Doctor scans with their phone camera or QR scanner</li>
            <li>Instant secure access to your record</li>
          </ul>
        </Alert>

        <Card className="border-0 bg-light mb-4">
          <Card.Body>
            <h6 className="mb-2">{record.title || 'Medical Record'}</h6>
            <p className="small text-muted mb-0">
              {record.description || 'No description'}
            </p>
          </Card.Body>
        </Card>

        {/* QR Code Display */}
        <div className="text-center mb-4">
          {qrCodeDataUrl ? (
            <div className="bg-white p-4 rounded shadow-sm d-inline-block">
              <img
                src={qrCodeDataUrl}
                alt="QR Code"
                style={{ width: '300px', height: '300px' }}
                className="img-fluid"
              />
            </div>
          ) : (
            <div className="bg-white p-4 rounded shadow-sm d-inline-block">
              <div style={{ width: '300px', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Generating QR Code...</span>
                </div>
              </div>
            </div>
          )}
          <p className="text-muted small mt-3">
            Scan this QR code with a smartphone camera or QR scanner app
          </p>
        </div>

        {/* Share Link */}
        <Card className="border-primary">
          <Card.Body>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <strong className="small">Share Link:</strong>
              <Button
                variant={copied ? 'success' : 'outline-primary'}
                size="sm"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <>
                    <FaCheckCircle className="me-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <FaCopy className="me-1" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
            <div className="bg-light p-2 rounded">
              <small className="text-break font-monospace">{shareUrl}</small>
            </div>
          </Card.Body>
        </Card>

        {/* Shared With */}
        {record.sharedWith && record.sharedWith.length > 0 && (
          <Alert variant="success" className="mt-3">
            <strong>Shared with {record.sharedWith.length} doctor(s):</strong>
            <ul className="mb-0 mt-2">
              {record.sharedWith.map((share, index) => (
                <li key={index}>
                  {share.doctor?.name || 'Unknown Doctor'} - 
                  {share.accessCount} access(es)
                </li>
              ))}
            </ul>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="d-flex gap-2 mt-4">
          <Button 
            variant="outline-primary" 
            onClick={handleDownloadQR} 
            className="flex-fill"
            disabled={!qrCodeDataUrl}
          >
            <FaDownload className="me-2" />
            Download QR Code
          </Button>
          <Button variant="primary" onClick={onHide} className="flex-fill">
            Done
          </Button>
        </div>

        <Alert variant="warning" className="mt-3 mb-0">
          <small>
            <strong>⚠️ Privacy Notice:</strong> Anyone with this QR code can view this
            record. Only share with trusted healthcare providers.
          </small>
        </Alert>
      </Modal.Body>
    </Modal>
  );
};

export default QRCodeDisplay;