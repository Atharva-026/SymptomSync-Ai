import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Button, Alert, Card, Row, Col } from 'react-bootstrap';
import { FaQrcode, FaCamera, FaCheckCircle, FaTimes } from 'react-icons/fa';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';

const QRScannerModal = ({ show, onHide, onRecordScanned }) => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [scannedData, setScannedData] = useState(null);
  const html5QrcodeScannerRef = useRef(null);
  const isInitialized = useRef(false);

  const onScanSuccess = useCallback((decodedText, decodedResult) => {
    try {
      console.log('📷 Raw QR scan data:', decodedText);

      // Check if empty or undefined
      if (!decodedText || decodedText === 'undefined' || decodedText === 'null') {
        throw new Error('Empty QR code data');
      }

      console.log('✅ Extracted QR text:', decodedText);

      // Try to parse as URL first (for share links)
      try {
        const url = new URL(decodedText);
        const pathParts = url.pathname.split('/');
        const token = pathParts[pathParts.length - 1];

        if (token && token.length > 10) {
          console.log('✅ Found share token:', token);
          
          // Stop scanner before navigating
          if (html5QrcodeScannerRef.current) {
            html5QrcodeScannerRef.current.clear().catch(err => 
              console.warn('Error clearing scanner:', err)
            );
            html5QrcodeScannerRef.current = null;
            isInitialized.current = false;
          }
          
          navigate(`/records/view/${token}`);
          onHide();
          return;
        }
      } catch (urlError) {
        // Not a URL, try parsing as JSON medical record
        console.log('Not a URL, trying JSON parse...');
      }

      // Try to parse as JSON medical record data
      try {
        const jsonData = JSON.parse(decodedText);
        console.log('✅ Parsed medical record data:', jsonData);

        // Validate it's a medical record
        if (jsonData.type === 'MEDICAL_RECORD' || jsonData.recordId) {
          setScannedData(jsonData);
          setError('');
          
          // Stop scanner after successful scan
          if (html5QrcodeScannerRef.current) {
            html5QrcodeScannerRef.current.clear().catch(err => 
              console.warn('Error clearing scanner:', err)
            );
            html5QrcodeScannerRef.current = null;
            isInitialized.current = false;
          }
          
          // Call callback if provided
          if (onRecordScanned) {
            onRecordScanned(jsonData);
          }
          
          // DON'T auto-close - let doctor review and close manually
        } else {
          throw new Error('Invalid medical record format');
        }
      } catch (jsonError) {
        console.error('❌ JSON parse failed:', jsonError);
        throw new Error('Invalid QR code. Please scan a valid medical record QR code.');
      }

    } catch (err) {
      console.error('❌ QR Scan Error:', err);
      setError(err.message || 'Failed to read QR code. Please try again.');
    }
  }, [navigate, onHide, onRecordScanned]);

  const onScanError = useCallback((errorMessage) => {
    // Ignore common scanning errors (these happen continuously while scanning)
    if (!errorMessage.includes('NotFoundException')) {
      console.warn('QR Scan Warning:', errorMessage);
    }
  }, []);

  useEffect(() => {
    if (show && !isInitialized.current && !scannedData) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const element = document.getElementById('qr-reader');
        
        if (element && !html5QrcodeScannerRef.current) {
          try {
            const scanner = new Html5QrcodeScanner(
              'qr-reader',
              { 
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
              },
              false
            );

            scanner.render(onScanSuccess, onScanError);
            html5QrcodeScannerRef.current = scanner;
            isInitialized.current = true;
            console.log('✅ QR Scanner initialized');
          } catch (err) {
            console.error('❌ Failed to initialize scanner:', err);
            setError('Failed to initialize camera. Please check permissions.');
          }
        }
      }, 100);

      return () => clearTimeout(timer);
    }

    // Cleanup when modal closes
    if (!show && html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current.clear().catch(err => {
        console.warn('Failed to clear scanner:', err);
      });
      html5QrcodeScannerRef.current = null;
      isInitialized.current = false;
    }
  }, [show, scannedData, onScanSuccess, onScanError]);

  const handleClose = () => {
    // Clean up scanner
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current.clear().catch(err => {
        console.warn('Failed to clear scanner:', err);
      });
      html5QrcodeScannerRef.current = null;
      isInitialized.current = false;
    }
    
    setError('');
    setScannedData(null);
    onHide();
  };

  const handleScanAnother = () => {
    setScannedData(null);
    setError('');
    isInitialized.current = false;
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <FaQrcode className="me-2" />
          {scannedData ? 'Medical Record Details' : 'Scan Medical Record QR Code'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!scannedData && (
          <Alert variant="info" className="mb-4">
            <FaCamera className="me-2" />
            Position the QR code within the camera frame
          </Alert>
        )}

        {error && (
          <Alert variant="danger" onClose={() => setError('')} dismissible>
            {error}
          </Alert>
        )}

        {scannedData ? (
          <>
            <Alert variant="success" className="mb-4">
              <div className="d-flex align-items-center">
                <FaCheckCircle size={24} className="me-3 text-success" />
                <div>
                  <strong>Medical Record Scanned Successfully!</strong>
                  <div className="small mt-1">Review the details below</div>
                </div>
              </div>
            </Alert>

            <Card className="border-primary mb-4">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">📋 Patient Medical Record</h5>
              </Card.Header>
              <Card.Body>
                <Row className="mb-3">
                  <Col md={6}>
                    <div className="mb-3">
                      <strong className="text-muted small d-block">Patient Name</strong>
                      <div className="h6">{scannedData.patientName || 'N/A'}</div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong className="text-muted small d-block">Record ID</strong>
                      <div className="font-monospace small">{scannedData.recordId || 'N/A'}</div>
                    </div>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={12}>
                    <div className="mb-3">
                      <strong className="text-muted small d-block">Title</strong>
                      <div className="h6">{scannedData.title || 'N/A'}</div>
                    </div>
                  </Col>
                </Row>

                {scannedData.description && (
                  <Row className="mb-3">
                    <Col md={12}>
                      <div className="mb-3">
                        <strong className="text-muted small d-block">Description</strong>
                        <div>{scannedData.description}</div>
                      </div>
                    </Col>
                  </Row>
                )}

                {scannedData.diagnosis && (
                  <Row className="mb-3">
                    <Col md={12}>
                      <div className="mb-3">
                        <strong className="text-muted small d-block">Diagnosis</strong>
                        <div>{scannedData.diagnosis}</div>
                      </div>
                    </Col>
                  </Row>
                )}

                {scannedData.prescription && (
                  <Row className="mb-3">
                    <Col md={12}>
                      <div className="mb-3">
                        <strong className="text-muted small d-block">Prescription</strong>
                        <div>{scannedData.prescription}</div>
                      </div>
                    </Col>
                  </Row>
                )}

                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong className="text-muted small d-block">Date</strong>
                      <div>{scannedData.date ? new Date(scannedData.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'N/A'}</div>
                    </div>
                  </Col>
                  {scannedData.doctorName && (
                    <Col md={6}>
                      <div className="mb-3">
                        <strong className="text-muted small d-block">Doctor</strong>
                        <div>{scannedData.doctorName}</div>
                      </div>
                    </Col>
                  )}
                </Row>
              </Card.Body>
            </Card>

            <Alert variant="info">
              <small>
                <strong>💡 Note:</strong> This information has been extracted from the patient's QR code. 
                You can review the details and take necessary action.
              </small>
            </Alert>
          </>
        ) : (
          <>
            <div id="qr-reader" style={{ width: '100%' }}></div>

            <Card className="bg-light mt-3">
              <Card.Body>
                <h6 className="mb-2">Instructions:</h6>
                <ol className="small mb-0">
                  <li>Allow camera access when prompted</li>
                  <li>Point your camera at the QR code</li>
                  <li>Hold steady until the code is scanned</li>
                  <li>Review the medical record details</li>
                </ol>
              </Card.Body>
            </Card>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        {scannedData ? (
          <div className="w-100 d-flex gap-2">
            <Button variant="outline-primary" onClick={handleScanAnother} className="flex-fill">
              <FaQrcode className="me-2" />
              Scan Another
            </Button>
            <Button variant="primary" onClick={handleClose} className="flex-fill">
              <FaCheckCircle className="me-2" />
              Done
            </Button>
          </div>
        ) : (
          <Button variant="secondary" onClick={handleClose}>
            <FaTimes className="me-2" />
            Cancel
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default QRScannerModal;