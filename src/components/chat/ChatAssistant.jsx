import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button, Alert, Badge } from 'react-bootstrap';
import {
  FaRobot, FaUser, FaPaperPlane, FaBars, FaPlus, FaFileImport, FaTimes, FaExclamationTriangle
} from 'react-icons/fa';
import chatService from '../../services/chatService';
import ChatSidebar from './ChatSidebar';
import QuestionCard from './QuestionCard';
import AssessmentCard from './AssessmentCard';
import ImportModal from './ImportModal';
import './chat.css';

const STARTERS = [
  { icon: '🩺', title: 'Check my symptoms', text: 'I want to check some symptoms I am having.' },
  { icon: '📖', title: 'Understand a condition', text: 'I want to understand a medical condition.' },
  { icon: '💊', title: 'Ask about my medicines', text: 'I have a question about my medicines.' }
];

const ChatAssistant = ({ onBookAppointment }) => {
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [context, setContext] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [pendingImport, setPendingImport] = useState(null); // { summary, count }
  const [showImportPreview, setShowImportPreview] = useState(false);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await chatService.listConversations();
      setConversations(res.data);
    } catch (e) {
      // non-critical
    }
  }, []);

  const loadContext = useCallback(async () => {
    try {
      const res = await chatService.getContext();
      setContext(res.data);
    } catch (e) {
      // non-critical
    }
  }, []);

  useEffect(() => {
    loadConversations();
    loadContext();
  }, [loadConversations, loadContext]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const newChat = () => {
    setMessages([]);
    setConversationId(null);
    setPendingImport(null);
    setShowImportPreview(false);
    setError('');
    setSidebarOpen(false);
  };

  const openConversation = async (id) => {
    try {
      const res = await chatService.getConversation(id);
      setConversationId(id);
      setMessages(res.data.messages);
      setPendingImport(null);
      setShowImportPreview(false);
      setError('');
      setSidebarOpen(false);
    } catch (e) {
      setError('Could not open that chat.');
    }
  };

  const deleteConversation = async (id) => {
    if (!window.confirm('Delete this chat? This cannot be undone.')) return;
    try {
      await chatService.deleteConversation(id);
      if (id === conversationId) newChat();
      loadConversations();
    } catch (e) {
      setError('Could not delete that chat.');
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

  const handleImport = async (ids) => {
    const res = await chatService.importContext(ids);
    setPendingImport({ summary: res.summary, count: res.count });
    setShowImport(false);
    setShowImportPreview(true);
  };

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const tempId = `u-${Date.now()}`;
    setError('');
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setMessages((prev) => [...prev, { _id: tempId, role: 'user', content }]);
    setLoading(true);

    try {
      const res = await chatService.sendMessage(content, conversationId, pendingImport?.summary);
      setConversationId(res.conversationId);
      setMessages((prev) => [...prev, res.message]);
      setPendingImport(null);
      setShowImportPreview(false);
      loadConversations();
      loadContext();
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      setInput(content);
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

  const autoGrow = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
  };

  const firstUserMessage = messages.find((m) => m.role === 'user')?.content || '';

  const handleBook = (assessment) => {
    onBookAppointment?.({
      symptoms: firstUserMessage,
      riskLevel: assessment.riskScore,
      recommendedSpecialty: assessment.recommendedSpecialty
    });
  };

  const lastMsg = messages[messages.length - 1];
  const activeQuestions =
    !loading && lastMsg?.role === 'assistant' && lastMsg.structured?.mode === 'asking'
      ? lastMsg.structured.questions
      : null;

  const activeTitle = conversations.find((c) => c._id === conversationId)?.title || 'New chat';

  const savedItems = context
    ? [
        ...context.conditions.map((c) => ({ label: c, bg: 'primary' })),
        ...context.medications.map((m) => ({ label: m, bg: 'info' })),
        ...context.allergies.map((a) => ({ label: a, bg: 'warning' }))
      ]
    : [];

  return (
    <div className="chat-shell">
      {sidebarOpen && <div className="chat-backdrop" onClick={() => setSidebarOpen(false)} />}

      <ChatSidebar
        conversations={conversations}
        activeId={conversationId}
        onSelect={openConversation}
        onNew={newChat}
        onDelete={deleteConversation}
        open={sidebarOpen}
      />

      <div className="chat-main">
        <div className="chat-topbar">
          <Button variant="light" size="sm" className="chat-menu-btn" onClick={() => setSidebarOpen(true)}>
            <FaBars />
          </Button>
          <div className="chat-topbar-title">{activeTitle}</div>
          <Button variant="outline-secondary" size="sm" onClick={() => setShowImport(true)}>
            <FaFileImport className="me-2" />
            Use past chats
          </Button>
          <Button variant="outline-primary" size="sm" onClick={newChat} title="New chat">
            <FaPlus />
          </Button>
        </div>

        {savedItems.length > 0 && (
          <div className="chat-memory">
            <span className="text-muted">Remembered about you:</span>
            {savedItems.map((s, i) => (
              <Badge key={i} bg={s.bg} text={s.bg === 'warning' ? 'dark' : undefined}>{s.label}</Badge>
            ))}
            <Button variant="link" size="sm" className="ms-auto p-0 text-danger" onClick={clearContext}>
              Clear
            </Button>
          </div>
        )}

        <div className="chat-messages">
          <div className="chat-thread">
            {messages.length === 0 && !loading && (
              <div className="chat-welcome">
                <FaRobot size={52} className="text-primary mb-3" />
                <h4>How can I help you today?</h4>
                <p className="text-muted mb-0">
                  I'll ask a few quick questions to understand your situation before giving an assessment.
                </p>
                <div className="chat-starters">
                  {STARTERS.map((s) => (
                    <button key={s.title} type="button" className="chat-starter" onClick={() => send(s.text)}>
                      <div style={{ fontSize: '1.5rem' }}>{s.icon}</div>
                      <div className="fw-semibold mt-1">{s.title}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => {
              const isUser = m.role === 'user';
              const s = m.structured;
              return (
                <div key={m._id} className={`chat-row ${isUser ? 'user' : ''}`}>
                  <div className={`chat-avatar ${isUser ? 'user' : 'ai'}`}>
                    {isUser ? <FaUser /> : <FaRobot />}
                  </div>
                  <div className="chat-content">
                    {!isUser && s?.isEmergency && (
                      <Alert variant="danger" className="mb-2 py-2">
                        <FaExclamationTriangle className="me-2" />
                        <strong>This may be an emergency.</strong> Call 112 (or 108 for an ambulance) or go to
                        the nearest emergency room now.
                      </Alert>
                    )}

                    <div className={`chat-bubble ${isUser ? 'user' : 'ai'}`}>
                      {isUser ? m.content : <ReactMarkdown>{m.content}</ReactMarkdown>}
                    </div>

                    {!isUser && s?.assessment && (
                      <AssessmentCard a={s.assessment} onBook={onBookAppointment ? handleBook : null} />
                    )}

                    {m === lastMsg && activeQuestions && activeQuestions.length > 0 && (
                      <QuestionCard key={m._id} questions={activeQuestions} onSubmit={send} disabled={loading} />
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="chat-row">
                <div className="chat-avatar ai"><FaRobot /></div>
                <div className="chat-bubble ai">
                  <div className="typing-dots"><span /><span /><span /></div>
                </div>
              </div>
            )}

            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="chat-composer">
          {pendingImport && (
            <div className="chat-import-chip">
              <div className="d-flex align-items-center gap-2">
                <FaFileImport className="text-success" />
                <span>
                  Context from {pendingImport.count} past chat{pendingImport.count > 1 ? 's' : ''} will be used
                </span>
                <Button variant="link" size="sm" className="p-0" onClick={() => setShowImportPreview((v) => !v)}>
                  {showImportPreview ? 'Hide' : 'View'}
                </Button>
                <Button
                  variant="link"
                  size="sm"
                  className="ms-auto p-0 text-muted"
                  title="Remove"
                  onClick={() => setPendingImport(null)}
                >
                  <FaTimes />
                </Button>
              </div>
              {showImportPreview && (
                <div className="mt-2 small text-muted" style={{ whiteSpace: 'pre-wrap' }}>
                  {pendingImport.summary}
                </div>
              )}
            </div>
          )}

          <div className="chat-composer-inner">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Type your symptoms or question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onInput={autoGrow}
              onKeyDown={handleKeyDown}
              disabled={loading}
              maxLength={2000}
            />
            <Button onClick={() => send()} disabled={loading || !input.trim()} style={{ width: 40, height: 40, padding: 0 }}>
              <FaPaperPlane />
            </Button>
          </div>
          <div className="chat-disclaimer">
            Guidance only, not a substitute for a doctor. In an emergency, call 112.
          </div>
        </div>
      </div>

      <ImportModal
        show={showImport}
        onHide={() => setShowImport(false)}
        conversations={conversations.filter((c) => c._id !== conversationId)}
        onImport={handleImport}
      />
    </div>
  );
};

export default ChatAssistant;