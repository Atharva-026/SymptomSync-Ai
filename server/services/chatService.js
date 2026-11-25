const Groq = require('groq-sdk');

let client;
const getClient = () => (client ||= new Groq({ apiKey: process.env.GROQ_API_KEY }));
const getModel = () => process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const HISTORY_LIMIT = 20;

const SYSTEM_PROMPT = `You are the clinical triage assistant of SymptomSync AI, helping patients in India understand symptoms, conditions and next steps. You do not give a final diagnosis and you never prescribe. You give an assessment that a doctor will confirm.

HOW TO BEHAVE
- Reason about every message using the patient context, any imported history, and the conversation. Never give canned answers.
- Recognise any condition or disease name the user mentions, including rare or technical ones, and explain it in plain language. If you do not recognise a term, say so and ask what it refers to. Never invent facts.
- Gather information before concluding. If important details are missing, ask up to 3 multiple-choice questions in "questions". Never ask for anything already known from the context or the conversation.
- Each question needs 2 to 6 short, specific options (for example "Mild (1-3)", "Front of head", "Fever"). Use type "single" when the options are mutually exclusive and "multi" when several can apply. Do NOT add an "Other" option; the app adds "Something else" automatically.
- When you ask questions, keep "reply" to one or two warm sentences and do not repeat the questions inside "reply".
- When you have enough information, or the user asks for an assessment, set mode to "assessment". Keep "reply" to a short plain-language summary of 2 to 4 sentences. Put the details in "assessment" and do not repeat them in "reply".
- For general health questions or explanations of a medical term, use mode "info". Answer clearly in short paragraphs, using simple markdown (bold and bullet lists) where it helps. Stay under about 200 words unless the user asks for more detail.
- If the situation could be life-threatening, set isEmergency to true and say in the first sentence of the reply that they should seek emergency care now.
- Be calm and use plain language. Reply in the language the user writes in.
- Never claim certainty. A doctor must confirm any assessment.
- In profileUpdates, record only facts the patient explicitly states about themselves (their own conditions, medications, allergies). Never infer them.
- "conversationTitle" is a 3 to 6 word title for the chat topic, for example "Frontal headache for two days".

Return ONLY valid JSON in exactly this shape:
{
  "reply": "text shown to the patient",
  "mode": "asking" | "assessment" | "info",
  "conversationTitle": "",
  "questions": [{ "id": "q1", "question": "", "type": "single" | "multi", "options": [] }],
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

const normalizeQuestions = (v) =>
  (Array.isArray(v) ? v : [])
    .map((q, i) => ({
      id: `q${i + 1}`,
      question: String(q?.question || '').trim(),
      type: q?.type === 'multi' ? 'multi' : 'single',
      options: strings(q?.options).slice(0, 6)
    }))
    .filter((q) => q.question && q.options.length >= 2)
    .slice(0, 3);

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
    title: typeof raw.conversationTitle === 'string' ? raw.conversationTitle.trim().slice(0, 80) : '',
    questions: normalizeQuestions(raw.questions),
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

exports.generateReply = async ({ profile, history, message, importedContext }) => {
  let system = `${SYSTEM_PROMPT}\n\n${formatContext(profile)}`;
  if (importedContext) {
    system +=
      '\n\nIMPORTED HISTORY (a summary of the patient\'s earlier chats, imported by the patient). ' +
      'Treat it as background and use it only where relevant:\n' +
      importedContext;
  }

  const messages = [
    { role: 'system', content: system },
    ...history.slice(-HISTORY_LIMIT).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message }
  ];

  const completion = await getClient().chat.completions.create({
    model: getModel(),
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

// Condenses past chats into a short brief the assistant can use as context
exports.summarizeConversations = async (conversations) => {
  const transcript = conversations
    .map((c) => {
      const lines = c.messages
        .slice(-30)
        .map((m) => `${m.role === 'user' ? 'Patient' : 'Assistant'}: ${m.content}`);
      return `--- Chat "${c.title}" (${new Date(c.updatedAt).toDateString()}) ---\n${lines.join('\n')}`;
    })
    .join('\n\n')
    .slice(0, 12000);

  const completion = await getClient().chat.completions.create({
    model: getModel(),
    messages: [
      {
        role: 'system',
        content:
          "You condense a patient's earlier health chats into a brief for an AI triage assistant. " +
          'Write at most 180 words of plain text covering: symptoms discussed and their timeline, ' +
          'assessments or advice given, health facts the patient stated (conditions, medications, allergies), ' +
          'and anything left unresolved. Use only what is in the transcript. Do not add or infer anything.'
      },
      { role: 'user', content: transcript }
    ],
    temperature: 0.2,
    max_tokens: 1500
  });

  return (completion.choices[0]?.message?.content || '').trim();
};