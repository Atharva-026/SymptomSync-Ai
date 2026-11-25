const Groq = require('groq-sdk');

let client;
const getClient = () => (client ||= new Groq({ apiKey: process.env.GROQ_API_KEY }));

const HISTORY_LIMIT = 20;

const SYSTEM_PROMPT = `You are the clinical triage assistant of SymptomSync AI, helping patients in India understand symptoms, conditions and next steps. You do not give a final diagnosis and you never prescribe. You give an assessment that a doctor will confirm.

HOW TO BEHAVE
- Reason about every message using the patient context and the conversation. Never give canned answers.
- Recognise any condition or disease name the user mentions, including rare or technical ones, and explain it in plain language. If you do not recognise a term, say so and ask what it refers to. Never invent facts.
- Gather information before concluding. If important details are missing (onset, duration, severity, location, associated symptoms, relevant history, medications, allergies), ask at most 3 short, focused questions in followUpQuestions. Do not ask for anything already known from the context or the conversation.
- Once you have enough information, or the user asks for an assessment, set mode to "assessment" and give a differential: the most likely conditions with likelihood and one-line reasoning, a risk level, red flags to watch for, the specialist to see, and next steps.
- If the situation could be life-threatening, set isEmergency to true and say in the first sentence of the reply that they should seek emergency care now.
- If the user asks a general health question or about a medical term, use mode "info".
- Be calm and use plain language and short paragraphs. Reply in the language the user writes in.
- Never claim certainty. Remind the user that a doctor must confirm any assessment.
- In profileUpdates, record only facts the patient explicitly states about themselves (their own conditions, medications, allergies). Never infer them.

Return ONLY valid JSON in exactly this shape:
{
  "reply": "text shown to the patient",
  "mode": "asking" | "assessment" | "info",
  "followUpQuestions": [],
  "isEmergency": false,
  "assessment": null or {
    "conditions": [{ "name": "", "likelihood": "high" | "medium" | "low", "reasoning": "" }],
    "riskLevel": "low" | "moderate" | "high" | "emergency",
    "riskScore": 0-100,
    "redFlags": [],
    "recommendedSpecialty": "e.g. General Physician, Cardiologist, Neurologist, Gastroenterologist",
    "nextSteps": [],
    "confidence": 0.0-1.0
  },
  "profileUpdates": { "conditions": [], "medications": [], "allergies": [] }
}`;

const formatContext = (p) => {
  const list = (a) => (a && a.length ? a.join(', ') : 'not provided');
  return [
    'PATIENT CONTEXT (saved profile, may be incomplete):',
    `- Age: ${p.age ?? 'not provided'}`,
    `- Gender: ${p.gender || 'not provided'}`,
    `- Known conditions: ${list(p.conditions)}`,
    `- Current medications: ${list(p.medications)}`,
    `- Allergies: ${list(p.allergies)}`
  ].join('\n');
};

const strings = (v) =>
  Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim()) : [];

const clamp = (n, min, max) => (Number.isFinite(n) ? Math.min(Math.max(n, min), max) : min);

// Validates the model's JSON. It never replaces the model's answer with rule-based content.
const normalize = (raw) => {
  const a = raw.assessment && typeof raw.assessment === 'object' ? raw.assessment : null;
  const isEmergency = raw.isEmergency === true;
  const u = raw.profileUpdates || {};

  return {
    reply:
      typeof raw.reply === 'string' && raw.reply.trim()
        ? raw.reply.trim()
        : 'Sorry, I could not form a reply. Could you rephrase that?',
    mode: ['asking', 'assessment', 'info'].includes(raw.mode) ? raw.mode : 'info',
    followUpQuestions: strings(raw.followUpQuestions).slice(0, 3),
    isEmergency,
    assessment: a
      ? {
          conditions: (Array.isArray(a.conditions) ? a.conditions : [])
            .slice(0, 5)
            .map((c) => ({
              name: String(c?.name || '').trim(),
              likelihood: ['high', 'medium', 'low'].includes(c?.likelihood) ? c.likelihood : 'low',
              reasoning: String(c?.reasoning || '').trim()
            }))
            .filter((c) => c.name),
          riskLevel: isEmergency
            ? 'emergency'
            : ['low', 'moderate', 'high', 'emergency'].includes(a.riskLevel)
            ? a.riskLevel
            : null,
          riskScore: clamp(Number(a.riskScore), 0, 100),
          redFlags: strings(a.redFlags),
          recommendedSpecialty:
            typeof a.recommendedSpecialty === 'string' ? a.recommendedSpecialty : 'General Physician',
          nextSteps: strings(a.nextSteps),
          confidence: clamp(Number(a.confidence), 0, 1)
        }
      : null,
    profileUpdates: {
      conditions: strings(u.conditions),
      medications: strings(u.medications),
      allergies: strings(u.allergies)
    }
  };
};

exports.generateReply = async ({ profile, history, message }) => {
  const messages = [
    { role: 'system', content: `${SYSTEM_PROMPT}\n\n${formatContext(profile)}` },
    ...history.slice(-HISTORY_LIMIT).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message }
  ];

  const completion = await getClient().chat.completions.create({
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    messages,
    temperature: 0.3,
    max_tokens: 3000,
    response_format: { type: 'json_object' }
  });

  const text = completion.choices[0]?.message?.content || '{}';
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    parsed = { reply: text, mode: 'info' };
  }
  return normalize(parsed);
};