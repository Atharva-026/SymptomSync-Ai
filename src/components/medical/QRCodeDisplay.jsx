import React, { useState, useEffect } from 'react';
import { Modal, Button, Alert, Card, Form, Spinner } from 'react-bootstrap';
import { FaQrcode, FaDownload, FaCopy, FaCheckCircle, FaBan } from 'react-icons/fa';
import QRCode from 'qrcode';
import medicalRecordService from '../../services/medicalRecordService';

const DURATIONS = [
  { hours: 1, label: '1 hour' },
  { hours: 6, label: '6 hours' },
  { hours: 24, label: '24 hours' },
  { hours: 72, label: '3 days' },
];

const QRCodeDisplay = ({ show, onHide, record }) => {
  const [hours, setHours] = useState(24);
  const [link, setLink] = useState(null); // { url, expiresAt }
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Start fresh every time the modal opens or a different record is chosen.
  // A link is only created on request, and its token is shown just once.
  useEffect(() => {
    setLink(null);
    setQrCodeDataUrl('');
    setError('');
    setCopied(false);
  }, [show, record?._id]);

  if (!record) return null;

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      const created = await medicalRecordService.createShareLink(record._id, hours);
      // The QR contains ONLY an expiring link - no medical details.
      const dataUrl = await QRCode.toDataURL(created.url, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      });
      setLink({ url: created.url, expiresAt: created.expiresAt });
      setQrCodeDataUrl(dataUrl);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to create QR code');
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async () => {
    if (!window.confirm('Stop all active QR links for this record?')) return;
    try {
      await medicalRecordService.revokeShareLinks(record._id);
      setLink(null);
      setQrCodeDataUrl('');
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to revoke links');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(link.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl) return;
    const anchor = document.createElement('a');
    anchor.href = qrCodeDataUrl;
    anchor.download = `${record.title || 'medical-record'}-QRCode.png`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
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
          <strong>📱 How it works:</strong>
          <ul className="mb-0 mt-2">
            <li>Create a QR code that works for a limited time only</li>
            <li>Your doctor scans it - no account needed</li>
            <li>The link stops working automatically when the time is up</li>
          </ul>
        </Alert>

        <Card className="border-0 bg-light mb-4">
          <Card.Body>
            <h6 className="mb-2">{record.title || 'Medical Record'}</h6>
            <p className="small text-muted mb-0">{record.description || 'No description'}</p>
          </Card.Body>
        </Card>

        {error && <Alert variant="danger">{error}</Alert>}

        {!link ? (
          <div className="text-center mb-4">
            <Form.Group className="mb-3 d-inline-block text-start">
              <Form.Label>QR code is valid for</Form.Label>
              <Form.Select
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                disabled={generating}
              >
                {DURATIONS.map((d) => (
                  <option key={d.hours} value={d.hours}>
                    {d.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <div>
              <Button variant="primary" onClick={handleGenerate} disabled={generating}>
                {generating ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FaQrcode className="me-2" />
                    Create QR Code
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-4">
              <div className="bg-white p-4 rounded shadow-sm d-inline-block">
                <img
                  src={qrCodeDataUrl}
                  alt="QR Code"
                  style={{ width: '300px', height: '300px' }}
                  className="img-fluid"
                />
              </div>
              <p className="text-muted small mt-3 mb-0">
                Valid until <strong>{new Date(link.expiresAt).toLocaleString()}</strong>
              </p>
            </div>

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
                  <small className="text-break font-monospace">{link.url}</small>
                </div>
              </Card.Body>
            </Card>
          </>
        )}

        {/* Shared With */}
        {record.sharedWith && record.sharedWith.length > 0 && (
          <Alert variant="success" className="mt-3">
            <strong>Shared with {record.sharedWith.length} doctor(s):</strong>
            <ul className="mb-0 mt-2">
              {record.sharedWith.map((share, index) => (
                <li key={index}>
                  {share.doctor?.name || 'Unknown Doctor'} - {share.accessCount} access(es)
                </li>
              ))}
            </ul>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="d-flex gap-2 mt-4">
          {link && (
            <>
              <Button variant="outline-primary" onClick={handleDownloadQR} className="flex-fill">
                <FaDownload className="me-2" />
                Download QR Code
              </Button>
              <Button variant="outline-danger" onClick={handleRevoke} className="flex-fill">
                <FaBan className="me-2" />
                Stop Sharing
              </Button>
            </>
          )}
          <Button variant="primary" onClick={onHide} className="flex-fill">
            Done
          </Button>
        </div>

        <Alert variant="warning" className="mt-3 mb-0">
          <small>
            <strong>⚠️ Privacy Notice:</strong> Anyone who scans this QR code can view the
            record until it expires. Only show it to trusted healthcare providers, and use
            "Stop Sharing" if it was seen by the wrong person.
          </small>
        </Alert>
      </Modal.Body>
    </Modal>
  );
};

export default QRCodeDisplay;
