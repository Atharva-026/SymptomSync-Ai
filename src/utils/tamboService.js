import { emergencyKeywords, tamboConfig } from '../config/tamboConfig';

class TamboService {
  constructor() {
    this.conversationHistory = [];
    this.client = null;
    this.initializeClient();
  }

  // Initialize Tambo AI client
  initializeClient() {
    try {
      // Initialize with Tambo SDK if available
      // This would be replaced with actual Tambo client initialization
      this.client = {
        apiKey: tamboConfig.apiKey,
        model: tamboConfig.model,
        ready: true
      };
    } catch (error) {
      console.warn('⚠️ Tambo client initialization failed, using fallback:', error);
      this.client = null;
    }
  }

  // Call Tambo API to analyze symptom input
  async analyzeWithTambo(userInput, context) {
    try {
      if (!this.client || !this.client.apiKey) {
        console.warn('⚠️ Tambo API key not configured, using local analysis');
        return this.analyzeInputLocally(userInput, context);
      }

      // Build the prompt for Tambo
      const systemPrompt = this.buildSystemPrompt(context);
      
      // In a real implementation, this would call Tambo API
      // For now, we'll use a fallback implementation
      const response = await this.callTamboAPI(userInput, systemPrompt, context);
      
      return response;
    } catch (error) {
      console.error('❌ Tambo API error:', error);
      // Fallback to local analysis
      return this.analyzeInputLocally(userInput, context);
    }
  }

  // Call actual Tambo API
  async callTamboAPI(userInput, systemPrompt, context) {
    // This is a placeholder - replace with actual Tambo API call
    // Example structure for when Tambo SDK is properly integrated:
    /*
    try {
      const response = await fetch('https://api.tambo.ai/v1/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.client.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.client.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userInput }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });
      
      const data = await response.json();
      return this.parseTamboResponse(data, context);
    } catch (error) {
      console.error('Tambo API call failed:', error);
      throw error;
    }
    */
    
    // For now, use local analysis
    return this.analyzeInputLocally(userInput, context);
  }

  // Build system prompt for medical symptom analysis
  buildSystemPrompt(context) {
    return `You are a medical AI assistant helping to analyze patient symptoms. 
    Your role is to:
    1. Identify the primary symptom
    2. Determine the next assessment step needed (body location, pain level, duration, follow-up questions)
    3. Detect emergency symptoms that require immediate attention
    4. Generate contextual follow-up questions based on the symptom profile
    
    Current context: ${JSON.stringify(context)}
    
    Respond with JSON containing:
    - nextComponent: which component to show next
    - aiMessage: message to display to user
    - questions: array of follow-up questions if needed
    - urgency: 'critical', 'high', 'normal'`;
  }

  // Parse Tambo API response
  parseTamboResponse(apiResponse, context) {
    try {
      const parsed = JSON.parse(apiResponse.choices[0].message.content);
      return {
        nextComponent: parsed.nextComponent,
        reasoning: 'AI Analysis',
        aiMessage: parsed.aiMessage,
        questions: parsed.questions || [],
        urgency: parsed.urgency || 'normal'
      };
    } catch (error) {
      console.error('Failed to parse Tambo response:', error);
      return this.analyzeInputLocally('', context);
    }
  }

  // Local fallback analysis
  analyzeInputLocally(userInput, currentData = {}) {
    const input = userInput.toLowerCase();
    
    // Check for emergency keywords first
    if (this.hasEmergencyKeywords(input)) {
      return {
        component: 'emergency',
        reason: 'Emergency keywords detected',
        urgency: 'critical',
        message: 'Your symptoms require immediate medical attention.',
        questions: []
      };
    }

    // Determine next component based on what we already have
    const { bodyPart, painLevel, duration, additionalSymptoms } = currentData;

    // If no body part mentioned yet and pain/discomfort mentioned
    if (!bodyPart && this.mentionsPain(input)) {
      return {
        component: 'body',
        reason: 'Pain mentioned but location unclear',
        message: 'Let\'s identify where you\'re experiencing discomfort.',
        questions: []
      };
    }

    // If body part known but no pain level
    if (bodyPart && !painLevel) {
      return {
        component: 'pain',
        reason: 'Need to assess pain severity',
        message: 'How severe is your pain?',
        questions: []
      };
    }

    // If pain level known but no duration
    if (painLevel && !duration) {
      return {
        component: 'duration',
        reason: 'Need symptom timeline',
        message: 'When did this start?',
        questions: []
      };
    }

    // If duration known but no additional symptoms checked
    if (duration && !additionalSymptoms) {
      return {
        component: 'symptoms',
        reason: 'Need additional symptom information',
        message: 'Are you experiencing any other symptoms?',
        questions: []
      };
    }

    // Generate follow-up questions if needed
    if (this.needsMoreInfo(currentData)) {
      return {
        component: 'followup',
        reason: 'Need specific clarification',
        message: 'Let me ask you a few more questions to better understand your condition.',
        questions: this.generateFollowUpQuestions(currentData)
      };
    }

    // Default to recommendation if we have enough data
    return {
      component: 'recommendation',
      reason: 'Sufficient information collected',
      message: 'Here are your personalized recommendations.',
      questions: []
    };
  }

  // Check if input contains emergency keywords
  hasEmergencyKeywords(input) {
    return emergencyKeywords.some(keyword => input.toLowerCase().includes(keyword.toLowerCase()));
  }

  // Check if input mentions pain
  mentionsPain(input) {
    const painKeywords = [
      'pain', 'hurt', 'ache', 'sore', 'discomfort', 
      'burning', 'sharp', 'dull', 'throbbing', 'cramping', 'tender'
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

  // Main method to get AI response (calls Tambo with fallback)
  async getAIResponse(userInput, context) {
    this.addToHistory('user', userInput);
    
    try {
      const response = await this.analyzeWithTambo(userInput, context);
      this.addToHistory('assistant', response.aiMessage);
      
      return {
        nextComponent: response.component,
        reasoning: response.reasoning,
        aiMessage: response.aiMessage,
        questions: response.questions || [],
        urgency: response.urgency || 'normal'
      };
    } catch (error) {
      console.error('Error getting AI response:', error);
      // Return safe fallback response
      return {
        nextComponent: 'symptoms',
        reasoning: 'Error in analysis, proceeding with symptom checklist',
        aiMessage: 'Let me ask more about your symptoms.',
        questions: [],
        urgency: 'normal'
      };
    }
  }

  // Add message to conversation history
  addToHistory(role, content) {
    this.conversationHistory.push({
      role,
      content,
      timestamp: new Date().toISOString()
    });
  }

  // Get conversation history
  getHistory() {
    return this.conversationHistory;
  }

  // Reset conversation
  reset() {
    this.conversationHistory = [];
  }
}

const tamboServiceInstance = new TamboService();
export default tamboServiceInstance;