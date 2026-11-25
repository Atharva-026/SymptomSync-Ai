import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';

const MAX = 3;

const ImportModal = ({ show, onHide, conversations, onImport }) => {
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const toggle = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < MAX ? [...prev, id] : prev
    );

  const handleImport = async () => {
    setBusy(true);
    setError('');
    try {
      await onImport(selected);
      setSelected([]);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not import those chats. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="h5">Use past chats as context</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted small">
          The assistant will read a short summary of the chats you pick, so you don't have to repeat yourself.
          You can review the summary before you send your next message. Choose up to {MAX}.
        </p>

        {error && <Alert variant="danger">{error}</Alert>}

        {conversations.length === 0 ? (
          <div className="text-muted">You have no saved chats yet.</div>
        ) : (
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {conversations.map((c) => (
              <Form.Check
                key={c._id}
                type="checkbox"
                id={`imp-${c._id}`}
                className="mb-2"
                checked={selected.includes(c._id)}
                disabled={!selected.includes(c._id) && selected.length >= MAX}
                onChange={() => toggle(c._id)}
                label={
                  <span>
                    {c.title}
                    <small className="text-muted ms-2">{new Date(c.updatedAt).toLocaleDateString()}</small>
                  </span>
                }
              />
            ))}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={busy}>Cancel</Button>
        <Button variant="primary" onClick={handleImport} disabled={busy || selected.length === 0}>
          {busy ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Summarising...
            </>
          ) : (
            `Import ${selected.length || ''} chat${selected.length === 1 ? '' : 's'}`
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ImportModal;