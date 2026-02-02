import React, { useState } from 'react';
import { Modal, Button, Alert, Card } from 'react-bootstrap';
import { FaQrcode, FaCamera } from 'react-icons/fa';
import QrScanner from 'react-qr-scanner';
import { useNavigate } from 'react-router-dom';

const QRScannerModal = ({ show, onHide }) => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(true);

  const handleScan = (data) => {
    if (data) {
      try {
        // Extract token from URL
        const url = new URL(data.text);
        const pathParts = url.pathname.split('/');
        const token = pathParts[pathParts.length - 1];

        if (token) {
          // Navigate to record view page
          navigate(`/records/view/${token}`);
          onHide();
        }
      } catch (err) {
        setError('Invalid QR code. Please scan a valid medical record QR code.');
      }
    }
  };

  const handleError = (err) => {
    console.error(err);
    setError('Camera access denied or not available. Please check permissions.');
  };

  const previewStyle = {
    height: 400,
    width: '100%',
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <FaQrcode className="me-2" />
          Scan Medical Record QR Code
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="info" className="mb-4">
          <FaCamera className="me-2" />
          Position the QR code within the camera frame
        </Alert>

        {error && <Alert variant="danger">{error}</Alert>}

        {scanning && (
          <div className="border rounded overflow-hidden mb-3">
            <QrScanner
              delay={300}
              style={previewStyle}
              onError={handleError}
              onScan={handleScan}
              constraints={{
                video: { facingMode: 'environment' }
              }}
            />
          </div>
        )}

        <Card className="bg-light">
          <Card.Body>
            <h6 className="mb-2">Instructions:</h6>
            <ol className="small mb-0">
              <li>Allow camera access when prompted</li>
              <li>Point your camera at the QR code</li>
              <li>Hold steady until the code is scanned</li>
              <li>You'll be redirected to view the record</li>
            </ol>
          </Card.Body>
        </Card>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default QRScannerModal;