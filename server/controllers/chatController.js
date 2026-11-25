const Conversation = require('../models/Conversation');
const PatientContext = require('../models/PatientContext');
const User = require('../models/User');
const { generateReply, summarizeConversations } = require('../services/chatService');

const calcAge = (user) => {
  if (!user) return null;
  if (typeof user.age === 'number') return user.age;
  if (user.dateOfBirth) {
    return Math.floor((Date.now() - new Date(user.dateOfBirth)) / 31557600000);
  }
  return null;
};

const unique = (arr) => [...new Set(arr.map((s) => s.slice(0, 100)))].slice(0, 10);

const aiError = (res, error) => {
  console.error('Chat error:', error);
  if (error.status === 429) {
    return res.status(429).json({ success: false, message: 'The AI is busy right now. Please try again in a minute.' });
  }
  return res.status(502).json({
    success: false,
    message: 'The AI service is unavailable. Please try again.',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

// POST /api/chat/message  { message, conversationId?, importedContext? }
exports.sendMessage = async (req, res) => {
  try {
    const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    if (message.length > 2000) {
      return res.status(400).json({ success: false, message: 'Message is too long (max 2000 characters)' });
    }

    const imported =
      typeof req.body.importedContext === 'string' ? req.body.importedContext.trim().slice(0, 3000) : '';

    let conversation;
    if (req.body.conversationId) {
      conversation = await Conversation.findOne({ _id: req.body.conversationId, patient: req.user.id });
      if (!conversation) {
        return res.status(404).json({ success: false, message: 'Conversation not found' });
      }
      if (imported) {
        conversation.importedContext = [conversation.importedContext, imported]
          .filter(Boolean)
          .join('\n\n')
          .slice(0, 4000);
      }
    } else {
      conversation = new Conversation({
        patient: req.user.id,
        title: message.slice(0, 60),
        importedContext: imported
      });
    }
    const isNew = conversation.isNew;

    const [user, ctx] = await Promise.all([
      User.findById(req.user.id).select('age gender dateOfBirth'),
      PatientContext.findOne({ patient: req.user.id })
    ]);

    const profile = {
      age: calcAge(user),
      gender: user?.gender,
      conditions: ctx?.conditions,
      medications: ctx?.medications,
      allergies: ctx?.allergies
    };

    const reply = await generateReply({
      profile,
      history: conversation.messages,
      message,
      importedContext: conversation.importedContext
    });

    conversation.messages.push({ role: 'user', content: message });
    conversation.messages.push({
      role: 'assistant',
      content: reply.reply,
      structured: {
        mode: reply.mode,
        questions: reply.questions,
        isEmergency: reply.isEmergency,
        assessment: reply.assessment
      }
    });
    if (isNew && reply.title) conversation.title = reply.title;
    await conversation.save();

    const u = reply.profileUpdates;
    if (u.conditions.length || u.medications.length || u.allergies.length) {
      await PatientContext.findOneAndUpdate(
        { patient: req.user.id },
        {
          $addToSet: {
            conditions: { $each: unique(u.conditions) },
            medications: { $each: unique(u.medications) },
            allergies: { $each: unique(u.allergies) }
          }
        },
        { upsert: true }
      );
    }

    res.json({
      success: true,
      conversationId: conversation._id,
      title: conversation.title,
      message: conversation.messages[conversation.messages.length - 1]
    });
  } catch (error) {
    aiError(res, error);
  }
};

// POST /api/chat/import  { conversationIds: [] }  -> short summary of the chosen chats
exports.importContext = async (req, res) => {
  try {
    const ids = Array.isArray(req.body.conversationIds) ? req.body.conversationIds.slice(0, 3) : [];
    if (!ids.length) {
      return res.status(400).json({ success: false, message: 'Select at least one chat to import' });
    }

    const conversations = await Conversation.find({ _id: { $in: ids }, patient: req.user.id }).sort('-updatedAt');
    if (!conversations.length) {
      return res.status(404).json({ success: false, message: 'Chats not found' });
    }

    const summary = await summarizeConversations(conversations);
    if (!summary) {
      return res.status(502).json({ success: false, message: 'Could not summarise those chats. Please try again.' });
    }

    res.json({ success: true, summary, count: conversations.length });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid chat selection' });
    }
    aiError(res, error);
  }
};

// GET /api/chat/conversations
exports.listConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ patient: req.user.id })
      .select('title updatedAt')
      .sort('-updatedAt');
    res.json({ success: true, data: conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/chat/conversations/:id
exports.getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ _id: req.params.id, patient: req.user.id });
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    res.json({ success: true, data: conversation });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/chat/conversations/:id
exports.deleteConversation = async (req, res) => {
  try {
    const result = await Conversation.deleteOne({ _id: req.params.id, patient: req.user.id });
    if (!result.deletedCount) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    res.json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/chat/context
exports.getContext = async (req, res) => {
  try {
    const ctx = await PatientContext.findOne({ patient: req.user.id });
    res.json({
      success: true,
      data: ctx || { conditions: [], medications: [], allergies: [] }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/chat/context
exports.clearContext = async (req, res) => {
  try {
    await PatientContext.deleteOne({ patient: req.user.id });
    res.json({ success: true, message: 'Saved health context cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};