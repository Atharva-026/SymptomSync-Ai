import { z } from 'zod';
import ChatInput from '../components/medical/ChatInput';
import BodyDiagram from '../components/medical/BodyDiagram';
import PainScale from '../components/medical/PainScale';
import DurationPicker from '../components/medical/DurationPicker';
import SymptomChecklist from '../components/medical/SymptomChecklist';
import RiskMeter from '../components/medical/RiskMeter';
import RecommendationCard from '../components/medical/RecommendationCard';

// ===== TAMBO COMPONENTS =====

export const tamboComponents = [
  {
    name: 'ChatInput',
    description: 'Text input for patient to describe symptoms in natural language',
    component: ChatInput,
    propsSchema: z.object({
      placeholder: z.string().optional().default('Describe your symptoms...')
    })
  },
  {
    name: 'BodyDiagram',
    description: 'Interactive body diagram for selecting symptom location.',
    component: BodyDiagram,
    propsSchema: z.object({})
  },
  {
    name: 'PainScale',
    description: 'Pain rating scale from 1-10.',
    component: PainScale,
    propsSchema: z.object({})
  },
  {
    name: 'DurationPicker',
    description: 'Selector for how long symptoms have persisted.',
    component: DurationPicker,
    propsSchema: z.object({})
  },
  {
    name: 'SymptomChecklist',
    description: 'Checklist of additional symptoms.',
    component: SymptomChecklist,
    propsSchema: z.object({
      primarySymptom: z.object({
        id: z.string(),
        name: z.string()
      }).optional().describe('The primary body part or symptom already identified')
    })
  },
  {
    name: 'RiskMeter',
    description: 'Visual risk assessment meter (0-100%)',
    component: RiskMeter,
    propsSchema: z.object({
      riskLevel: z.number().min(0).max(100).describe('Risk percentage score')
    })
  },
  {
    name: 'RecommendationCard',
    description: 'Card showing personalized health recommendations',
    component: RecommendationCard,
    propsSchema: z.object({
      severity: z.enum(['low', 'moderate', 'high', 'emergency']),
      title: z.string(),
      description: z.string(),
      actions: z.array(z.string()),
      tips: z.array(z.string()).optional()
    })
  }
];

// ===== CUSTOM TOOLS =====

export const tamboTools = [
  {
    name: 'analyzeSymptoms',
    description: 'Analyze symptoms to identify possible conditions',
    tool: async ({ symptoms, age, gender }) => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/assessments/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ symptoms, age, gender })
        });
        if (!response.ok) throw new Error('Failed to analyze symptoms');
        return await response.json();
      } catch (error) {
        return { error: error.message, possibleConditions: [], recommendations: ['Consult a professional.'] };
      }
    },
    inputSchema: z.object({
      symptoms: z.array(z.string()),
      age: z.number().optional(),
      gender: z.string().optional()
    }),
    outputSchema: z.object({
      possibleConditions: z.array(z.string()),
      recommendations: z.array(z.string()),
      analysis: z.string().optional(),
      error: z.string().optional()
    })
  },
  {
    name: 'calculateRisk',
    description: 'Calculate health risk score (0-100)',
    tool: async ({ painLevel, duration, bodyPart, symptoms }) => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/assessments/risk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ painLevel, duration, bodyPart, symptoms })
        });
        if (response.ok) return await response.json();
      } catch (error) {
        console.warn('Backend unavailable, using local fallback');
      }

      // Local Logic
      let risk = 0;
      if (painLevel) risk += painLevel * 4;
      if (duration) {
        if (duration.unit === 'months' || (duration.unit === 'weeks' && duration.amount > 2)) risk += 20;
        else risk += 10;
      }
      const part = typeof bodyPart === 'string' ? bodyPart.toLowerCase() : (bodyPart?.id || '');
      if (part.includes('chest')) risk += 20;
      else if (part.includes('head')) risk += 15;
      
      const finalRisk = Math.min(risk + (symptoms.length * 5), 100);
      return {
        riskScore: finalRisk,
        riskLevel: finalRisk >= 80 ? 'emergency' : finalRisk >= 60 ? 'high' : finalRisk >= 40 ? 'moderate' : 'low'
      };
    },
    inputSchema: z.object({
      painLevel: z.number().min(1).max(10),
      duration: z.object({
        amount: z.number(),
        unit: z.enum(['hours', 'days', 'weeks', 'months'])
      }),
      bodyPart: z.any().describe('Affected body part string or object'),
      symptoms: z.array(z.string())
    }),
    outputSchema: z.object({
      riskScore: z.number(),
      riskLevel: z.string(),
      factors: z.array(z.object({ factor: z.string(), impact: z.string() })).optional()
    })
  },
  {
    name: 'bookAppointment',
    description: 'Book a doctor appointment',
    tool: async ({ doctorId, date, time, assessmentId }) => {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ doctorId, date, time, assessmentId })
      });
      return await response.json();
    },
    inputSchema: z.object({
      doctorId: z.string(),
      date: z.string(),
      time: z.string(),
      assessmentId: z.string().optional()
    }),
    outputSchema: z.object({
      success: z.boolean().optional(),
      message: z.string().optional(),
      appointmentId: z.string().optional(),
      error: z.string().optional()
    })
  },
  {
    name: 'getMedicalHistory',
    description: 'Fetch patient medical history',
    tool: async ({ patientId }) => {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/medical-records?patientId=${patientId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return await response.json();
    },
    inputSchema: z.object({ patientId: z.string() }),
    outputSchema: z.object({
      records: z.array(z.any()),
      error: z.string().optional()
    })
  }
];

export const emergencyKeywords = [
  'chest pain', "can't breathe", 'unconscious', 'stroke', 'heart attack', 'suicidal'
];

export const systemPrompt = `You are SymptomSync AI, a professional medical assistant. 
Follow this structured workflow:
1. Greet and ask for symptoms (text only).
2. Show BodyDiagram.
3. Show PainScale.
4. Show DurationPicker.
5. Show SymptomChecklist.
6. Run calculateRisk tool, then show RiskMeter and RecommendationCard.
7. Offer bookAppointment if risk is moderate or higher.`;

export const tamboConfig = {
  apiKey: process.env.REACT_APP_TAMBO_API_KEY || '',
  model: 'claude-3-5-sonnet-20240620',
  maxTokens: 2000,
  temperature: 0.7
};

// Fixed anonymous default export
const config = {
  components: tamboComponents,
  tools: tamboTools,
  systemPrompt,
  emergencyKeywords,
  tamboConfig
};

export default config;