const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  // mode, questions, isEmergency, assessment (assistant messages only)
  structured: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

const conversationSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, default: 'New chat' },
  // Summary of earlier chats the patient chose to import
  importedContext: { type: String, default: '' },
  // Latest doctor brief generated for the booking preview
  brief: { type: mongoose.Schema.Types.Mixed },
  briefMessageCount: { type: Number },
  messages: [messageSchema]
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);