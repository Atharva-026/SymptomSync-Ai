import { emergencyKeywords } from '../config/tamboConfig';

class TamboService {
  constructor() {
    this.conversationHistory = [];
  }

  // Analyze user input and decide which component to show next
  analyzeInput(userInput, currentData = {}) {
    const input = userInput.toLowerCase();
    
    // Check for emergency keywords first
    if (this.hasEmergencyKeywords(input)) {
      return {
        component: 'emergency',
        reason: 'Emergency keywords detected',
        urgency: 'critical',
        message: 'Your symptoms require immediate medical attention.'
      };
    }

    // Determine next component based on what we already have
    const { bodyPart, painLevel, duration, additionalSymptoms } = currentData;

    // If no body part mentioned yet and pain/discomfort mentioned
    if (!bodyPart && this.mentionsPain(input)) {
      return {
        component: 'body',
        reason: 'Pain mentioned but location unclear',
        message: 'Let\'s identify where you\'re experiencing discomfort.'
      };
    }

    // If body part known but no pain level
    if (bodyPart && !painLevel) {
      return {
        component: 'pain',
        reason: 'Need to assess pain severity',
        message: 'How severe is your pain?'
      };
    }

    // If pain level known but no duration
    if (painLevel && !duration) {
      return {
        component: 'duration',
        reason: 'Need symptom timeline',
        message: 'When did this start?'
      };
    }

    // If duration known but no additional symptoms checked
    if (duration && !additionalSymptoms) {
      return {
        component: 'symptoms',
        reason: 'Need additional symptom information',
        message: 'Are you experiencing any other symptoms?'
      };
    }

    // Generate follow-up questions if needed
    if (this.needsMoreInfo(currentData)) {
      return {
        component: 'followup',
        reason: 'Need specific clarification',
        questions: this.generateFollowUpQuestions(currentData)
      };
    }

    // Default to recommendation if we have enough data
    return {
      component: 'recommendation',
      reason: 'Sufficient information collected',
      message: 'Here are your personalized recommendations.'
    };
  }

  // Check if input contains emergency keywords
  hasEmergencyKeywords(input) {
    return emergencyKeywords.some(keyword => input.includes(keyword));
  }

  // Check if input mentions pain
  mentionsPain(input) {
    const painKeywords = [
      'pain', 'hurt', 'ache', 'sore', 'discomfort', 
      'burning', 'sharp', 'dull', 'throbbing', 'cramping'
    ];
    return painKeywords.some(keyword => input.includes(keyword));
  }

  // Determine if we need more information
  needsMoreInfo(data) {
    const { bodyPart, painLevel } = data;
    
    // If chest pain with high severity, need more details
    if (bodyPart?.id === 'chest' && painLevel >= 7) {
      return true;
    }

    // If headache with high severity, need more details
    if (bodyPart?.id === 'head' && painLevel >= 8) {
      return true;
    }

    return false;
  }

  // Generate contextual follow-up questions
  generateFollowUpQuestions(data) {
    const { bodyPart, painLevel } = data;
    const questions = [];

    // Chest-specific questions
    if (bodyPart?.id === 'chest') {
      questions.push({
        id: 'chest-radiation',
        question: 'Is the pain spreading to your arm, jaw, or back?',
        type: 'yesno',
        critical: true
      });
      questions.push({
        id: 'chest-breathing',
        question: 'Are you having difficulty breathing?',
        type: 'yesno',
        critical: true
      });
      questions.push({
        id: 'chest-sweating',
        question: 'Are you experiencing unusual sweating?',
        type: 'yesno',
        critical: true
      });
    }

    // Head-specific questions
    if (bodyPart?.id === 'head') {
      questions.push({
        id: 'head-worst',
        question: 'Is this the worst headache you\'ve ever experienced?',
        type: 'yesno',
        critical: true
      });
      questions.push({
        id: 'head-sudden',
        question: 'Did the headache come on suddenly (like a thunderclap)?',
        type: 'yesno',
        critical: true
      });
      questions.push({
        id: 'head-vision',
        question: 'Are you experiencing vision changes or seeing spots?',
        type: 'yesno',
        critical: false
      });
    }

    // Abdomen-specific questions
    if (bodyPart?.id === 'abdomen') {
      questions.push({
        id: 'abdomen-location',
        question: 'Which part of your abdomen? (Upper, Lower, Left, Right, All over)',
        type: 'multiple',
        options: ['Upper', 'Lower', 'Left side', 'Right side', 'All over'],
        critical: false
      });
      questions.push({
        id: 'abdomen-eating',
        question: 'Does eating make it better or worse?',
        type: 'multiple',
        options: ['Better', 'Worse', 'No change'],
        critical: false
      });
    }

    // High pain level questions
    if (painLevel >= 8) {
      questions.push({
        id: 'pain-change',
        question: 'Is the pain getting worse, staying the same, or improving?',
        type: 'multiple',
        options: ['Getting worse', 'Staying the same', 'Improving'],
        critical: true
      });
    }

    return questions;
  }

  // Simulate AI response (in real implementation, this would call Tambo API)
  async getAIResponse(userInput, context) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const decision = this.analyzeInput(userInput, context);
    
    return {
      nextComponent: decision.component,
      reasoning: decision.reason,
      aiMessage: decision.message,
      questions: decision.questions || [],
      urgency: decision.urgency || 'normal'
    };
  }

  // Add message to conversation history
  addToHistory(role, content) {
    this.conversationHistory.push({
      role,
      content,
      timestamp: new Date().toISOString()
    });
  }

  // Reset conversation
  reset() {
    this.conversationHistory = [];
  }
}

const tamboServiceInstance = new TamboService();
export default tamboServiceInstance;