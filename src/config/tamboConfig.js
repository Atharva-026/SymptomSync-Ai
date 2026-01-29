// Tambo Configuration
export const tamboConfig = {
  apiKey: process.env.REACT_APP_TAMBO_API_KEY || 'demo-key',
  model: 'gpt-4',
  maxTokens: 1000,
};

// Component registry for Tambo
export const componentRegistry = {
  chatInput: {
    name: 'ChatInput',
    description: 'Initial symptom input where user describes their condition',
    when: 'User starts new assessment or needs to describe symptoms',
    priority: 1
  },
  bodyDiagram: {
    name: 'BodyDiagram',
    description: 'Interactive body diagram for selecting pain location',
    when: 'User mentions body part or location is unclear',
    priority: 2
  },
  painScale: {
    name: 'PainScale',
    description: 'Pain intensity assessment from 1-10',
    when: 'User mentions pain, discomfort, or ache',
    priority: 3
  },
  durationPicker: {
    name: 'DurationPicker',
    description: 'Select when symptoms started',
    when: 'Need to understand symptom timeline',
    priority: 4
  },
  symptomChecklist: {
    name: 'SymptomChecklist',
    description: 'Additional related symptoms selection',
    when: 'After primary symptom identified, need more details',
    priority: 5
  },
  emergencyWarning: {
    name: 'EmergencyWarning',
    description: 'Critical warning for emergency symptoms',
    when: 'User mentions chest pain, difficulty breathing, severe headache, or other red flags',
    priority: 0 // Highest priority
  },
  followUpQuestions: {
    name: 'FollowUpQuestions',
    description: 'AI-generated contextual questions',
    when: 'Need more specific information based on symptoms',
    priority: 6
  },
  recommendationCard: {
    name: 'RecommendationCard',
    description: 'Final care recommendations',
    when: 'Assessment complete',
    priority: 10
  }
};

// Emergency keywords that trigger immediate warning
export const emergencyKeywords = [
  'chest pain',
  'can\'t breathe',
  'difficulty breathing',
  'choking',
  'severe bleeding',
  'unconscious',
  'seizure',
  'stroke',
  'heart attack',
  'chest pressure',
  'crushing pain',
  'worst headache',
  'suicidal',
  'overdose'
];

// Symptom to component mapping
export const symptomComponentMap = {
  pain: ['bodyDiagram', 'painScale', 'durationPicker'],
  headache: ['painScale', 'durationPicker', 'symptomChecklist'],
  fever: ['durationPicker', 'symptomChecklist'],
  nausea: ['durationPicker', 'symptomChecklist'],
  breathing: ['emergencyWarning', 'symptomChecklist'],
  chest: ['emergencyWarning', 'bodyDiagram', 'painScale'],
  abdomen: ['bodyDiagram', 'painScale', 'durationPicker'],
};

export default tamboConfig;