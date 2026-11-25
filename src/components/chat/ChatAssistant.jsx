import React, { useState, useRef, useEffect } from 'react';
import { Card, Form, Button, Spinner, Badge, Alert, Table } from 'react-bootstrap';
import { FaRobot, FaUser, FaPaperPlane, FaCalendarAlt, FaExclamationTriangle, FaPlus } from 'react-icons/fa';
import chatService from '../../services/chatService';

const SUGGESTIONS = [
  'I have had a headache for two days',
  'What is Guillain-Barre syndrome?',
  'My father has diabetes and feels dizzy after meals'
];

const riskVariant = { low: 'success', moderate: 'info', high: 'warning', emergency: 'danger' };
const likelihoodVariant = { high: 'primary', medium: 'info', low: 'secondary' };

const AssessmentCard = ({ a, onBook }) => (
  <Card className="mt-3 border-0 bg-light">
    <Card.Body className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <strong>Assessment</strong>
        {a.riskLevel && (
          <Badge bg={riskVariant[a.riskLevel]}>
            {a.riskLevel.toUpperCase()} risk ({a.riskScore}%)
          </Badge>
        )}
      </div>

      {a.conditions.length > 0 && (
        <Table size="sm" bordered responsive className="bg-white mb-3">
          <thead>
            <tr>
              <th>Possible condition</th>
              <th>Likelihood</th>
              <th>Why</th>
            </tr>
          </thead>
          <tbody>
            {a.conditions.map((c, i) => (
              <tr key={i}>
                <td><strong>{c.name}</strong></td>
                <td><Badge bg={likelihoodVariant[c.likelihood]}>{c.likelihood}</Badge></td>
                <td>{c.reasoning}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {a.redFlags.length > 0 && (
        <div className="mb-2">
          <strong className="text-danger">Warning signs to watch for</strong>
          <ul className="mb-2">{a.redFlags.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </div>
      )}

      {a.nextSteps.length > 0 && (
        <div className="mb-2">
          <strong>Suggested next steps</strong>
          <ul className="mb-2">{a.nextSteps.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <small className="text-muted">
          Suggested specialist: <strong>{a.recommendedSpecialty}</strong>
          {' | '}Confidence: {Math.round((a.confidence || 0) * 100)}%
        </small>
        {onBook && (
          <Button size="sm" variant="success" onClick={() => onBook(a)}>
            <FaCalendarAlt className="me-2" />
            Book appointment
          </Button>
        )}
      </div>
    </Card.Body>
  </Card>
);

const ChatAssistant = ({ onBookAppointment }) => {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [context, setContext] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    loadContext();
  }, []);

  const loadContext = async () => {
    try {
      const res = await chatService.getContext();
      setContext(res.data);
    } catch (e) {
      // non-critical
    }
  };

  const clearContext = async () => {
    if (!window.confirm('Clear the health details saved from your chats?')) return;
    try {
      await chatService.clearContext();
      setContext({ conditions: [], medications: [], allergies: [] });
    } catch (e) {
      setError('Could not clear saved details.');
    }
  };

  const newChat = () => {
    setMessages([]);
    setConversationId(null);
    setError('');
  };

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    setError('');
    setInput('');
    setMessages((prev) => [...prev, { _id: `u-${Date.now()}`, role: 'user', content }]);
    setLoading(true);

    try {
      const res = await chatService.sendMessage(content, conversationId);
      setConversationId(res.conversationId);
      setMessages((prev) => [...prev, res.message]);
      loadContext();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reach the assistant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const firstUserMessage = messages.find((m) => m.role === 'user')?.content || '';

  const handleBook = (assessment) => {
    onBookAppointment?.({
      symptoms: firstUserMessage,
      riskLevel: assessment.riskScore,
      recommendedSpecialty: assessment.recommendedSpecialty
    });
  };

  const savedItems = context
    ? [
        ...context.conditions.map((c) => ({ label: c, bg: 'primary' })),
        ...context.medications.map((m) => ({ label: m, bg: 'info' })),
        ...context.allergies.map((a) => ({ label: a, bg: 'warning' }))
      ]
    : [];

  return (
    <Card className="shadow-lg border-0">
      <Card.Header className="bg-primary text-white py-3 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
          <FaRobot size={22} />
          <div>
            <h5 className="mb-0">SymptomSync AI Assistant</h5>
            <small className="opacity-75">Describe symptoms, ask about a condition, or discuss your health</small>
          </div>
        </div>
        <Button variant="light" size="sm" onClick={newChat}>
          <FaPlus className="me-1" /> New chat
        </Button>
      </Card.Header>

      {savedItems.length > 0 && (
        <div className="px-3 py-2 border-bottom bg-white d-flex align-items-center flex-wrap gap-2">
          <small className="text-muted">Remembered about you:</small>
          {savedItems.map((s, i) => (
            <Badge key={i} bg={s.bg} text={s.bg === 'warning' ? 'dark' : undefined}>{s.label}</Badge>
          ))}
          <Button variant="link" size="sm" className="ms-auto p-0 text-danger" onClick={clearContext}>
            Clear
          </Button>
        </div>
      )}

      <Card.Body style={{ height: '540px', overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
        {messages.length === 0 && !loading && (
          <div className="text-center py-4">
            <FaRobot size={64} className="text-primary opacity-50 mb-3" />
            <h5 className="text-primary">How can I help you today?</h5>
            <p className="text-muted">
              I will ask a few questions to understand your situation before giving an assessment.
            </p>
            <div className="d-flex flex-column align-items-center gap-2">
              {SUGGESTIONS.map((s) => (
                <Button key={s} variant="outline-primary" size="sm" onClick={() => send(s)}>
                  {s}
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => {
          const isUser = m.role === 'user';
          const s = m.structured;
          return (
            <div key={m._id} className={`d-flex gap-2 mb-3 ${isUser ? 'flex-row-reverse' : ''}`}>
              <div
                className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${
                  isUser ? 'bg-primary text-white' : 'bg-white text-primary border border-primary'
                }`}
                style={{ width: 36, height: 36 }}
              >
                {isUser ? <FaUser size={16} /> : <FaRobot size={16} />}
              </div>
              <div style={{ maxWidth: '85%' }}>
                {!isUser && s?.isEmergency && (
                  <Alert variant="danger" className="mb-2 py-2">
                    <FaExclamationTriangle className="me-2" />
                    <strong>This may be an emergency.</strong> Call 112 (or 108 for an ambulance) or go to
                    the nearest emergency room now.
                  </Alert>
                )}
                <div
                  className={`p-3 rounded-3 ${isUser ? 'bg-primary text-white' : 'bg-white border shadow-sm'}`}
                  style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6 }}
                >
                  {m.content}
                </div>
                {!isUser && s?.assessment && (
                  <AssessmentCard a={s.assessment} onBook={onBookAppointment ? handleBook : null} />
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="d-flex gap-2 mb-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center bg-white text-primary border border-primary"
              style={{ width: 36, height: 36 }}
            >
              <FaRobot size={16} />
            </div>
            <div className="p-3 rounded-3 bg-white border shadow-sm">
              <Spinner animation="grow" size="sm" className="me-1" />
              <Spinner animation="grow" size="sm" className="me-1" />
              <Spinner animation="grow" size="sm" />
            </div>
          </div>
        )}

        {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
        <div ref={bottomRef} />
      </Card.Body>

      <Card.Footer className="bg-white">
        <div className="d-flex gap-2 align-items-end">
          <Form.Control
            as="textarea"
            rows={2}
            placeholder="Type your symptoms or question... (Enter to send, Shift+Enter for a new line)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            maxLength={2000}
            style={{ resize: 'none' }}
          />
          <Button onClick={() => send()} disabled={loading || !input.trim()} style={{ height: 44, width: 44, padding: 0 }}>
            {loading ? <Spinner animation="border" size="sm" /> : <FaPaperPlane />}
          </Button>
        </div>
        <small className="text-muted d-block mt-2 text-center">
          This assistant gives guidance only and does not replace a doctor. In an emergency, call 112.
        </small>
      </Card.Footer>
    </Card>
  );
};

export default ChatAssistant;