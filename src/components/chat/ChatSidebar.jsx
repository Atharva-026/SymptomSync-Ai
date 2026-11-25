import React from 'react';
import { Button } from 'react-bootstrap';
import { FaPlus, FaTrash } from 'react-icons/fa';

const ORDER = ['Today', 'Yesterday', 'Previous 7 days', 'Older'];

const groupLabel = (date) => {
  const startOfDay = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const diff = Math.round((startOfDay(new Date()) - startOfDay(new Date(date))) / 86400000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff <= 7) return 'Previous 7 days';
  return 'Older';
};

const ChatSidebar = ({ conversations, activeId, onSelect, onNew, onDelete, open }) => {
  const groups = conversations.reduce((acc, c) => {
    const label = groupLabel(c.updatedAt);
    (acc[label] = acc[label] || []).push(c);
    return acc;
  }, {});

  return (
    <aside className={`chat-sidebar ${open ? 'open' : ''}`}>
      <div className="chat-sidebar-header">
        <Button variant="primary" className="w-100" onClick={onNew}>
          <FaPlus className="me-2" />
          New chat
        </Button>
      </div>

      <div className="chat-sidebar-list">
        {conversations.length === 0 && (
          <div className="chat-empty-history">Your saved chats will appear here.</div>
        )}

        {ORDER.filter((label) => groups[label]).map((label) => (
          <div key={label}>
            <div className="chat-group-label">{label}</div>
            {groups[label].map((c) => (
              <div
                key={c._id}
                className={`chat-history-item ${c._id === activeId ? 'active' : ''}`}
                onClick={() => onSelect(c._id)}
              >
                <span className="chat-history-title">{c.title}</span>
                <button
                  type="button"
                  className="chat-history-del"
                  title="Delete chat"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(c._id);
                  }}
                >
                  <FaTrash size={12} />
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
};

export default ChatSidebar;