import React, { useState } from 'react';
import { Button } from 'react-bootstrap';

const EMPTY = { selected: [], other: '', otherOpen: false };

const QuestionCard = ({ questions, onSubmit, disabled }) => {
  const [answers, setAnswers] = useState({});

  const get = (id) => answers[id] || EMPTY;

  const update = (id, fn) =>
    setAnswers((prev) => ({ ...prev, [id]: fn(prev[id] || EMPTY) }));

  const toggleOption = (q, opt) =>
    update(q.id, (a) => {
      if (q.type === 'multi') {
        const selected = a.selected.includes(opt)
          ? a.selected.filter((x) => x !== opt)
          : [...a.selected, opt];
        return { ...a, selected };
      }
      const already = a.selected.includes(opt);
      return { ...a, selected: already ? [] : [opt], otherOpen: false, other: '' };
    });

  const toggleOther = (q) =>
    update(q.id, (a) => ({
      ...a,
      otherOpen: !a.otherOpen,
      other: a.otherOpen ? '' : a.other,
      selected: q.type === 'single' && !a.otherOpen ? [] : a.selected
    }));

  const answerText = (q) => {
    const a = get(q.id);
    const parts = [...a.selected];
    if (a.other.trim()) parts.push(a.other.trim());
    return parts.join(', ');
  };

  const answered = questions.filter((q) => answerText(q));

  const handleSubmit = () => {
    const text = answered.map((q) => `${q.question} — ${answerText(q)}`).join('\n');
    onSubmit(text);
  };

  return (
    <div className="q-card">
      <div className="q-card-head">
        <span>A few quick questions</span>
        <span>{answered.length}/{questions.length} answered</span>
      </div>

      {questions.map((q, i) => {
        const a = get(q.id);
        return (
          <div key={q.id} className="q-block">
            <div className="q-title">
              <span className="q-num">{i + 1}</span>
              <span>{q.question}</span>
              {q.type === 'multi' && <small className="text-muted">Select all that apply</small>}
            </div>

            <div className="q-options">
              {q.options.map((opt) => (
                <button
                  type="button"
                  key={opt}
                  className={`q-chip ${a.selected.includes(opt) ? 'selected' : ''}`}
                  onClick={() => toggleOption(q, opt)}
                  disabled={disabled}
                >
                  {opt}
                </button>
              ))}
              <button
                type="button"
                className={`q-chip q-chip-other ${a.otherOpen ? 'selected' : ''}`}
                onClick={() => toggleOther(q)}
                disabled={disabled}
              >
                Something else
              </button>
            </div>

            {a.otherOpen && (
              <input
                className="form-control form-control-sm q-other-input"
                placeholder="Describe in your own words..."
                value={a.other}
                maxLength={200}
                disabled={disabled}
                autoFocus
                onChange={(e) => update(q.id, (x) => ({ ...x, other: e.target.value }))}
              />
            )}
          </div>
        );
      })}

      <div className="q-footer">
        <small className="text-muted">You can also type your own reply below.</small>
        <Button size="sm" onClick={handleSubmit} disabled={disabled || answered.length === 0}>
          Continue
        </Button>
      </div>
    </div>
  );
};

export default QuestionCard;