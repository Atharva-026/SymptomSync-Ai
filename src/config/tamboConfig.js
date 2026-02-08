import { z } from 'zod';

// Import WRAPPER components
import TamboBodyDiagram from '../components/medical/tambo-wrappers/TamboBodyDiagram';
import TamboPainScale from '../components/medical/tambo-wrappers/TamboPainScale';
import TamboDurationPicker from '../components/medical/tambo-wrappers/TamboDurationPicker';
import TamboSymptomChecklist from '../components/medical/tambo-wrappers/TamboSymptomChecklist';
import TamboBookingInterface from '../components/medical/tambo-wrappers/TamboBookingInterface';

// Import display components
import RiskMeter from '../components/medical/RiskMeter';
import RecommendationCard from '../components/medical/RecommendationCard';

// ===== TAMBO COMPONENTS =====

export const tamboComponents = [
  {
    name: 'BodyDiagram',
    description: 'Interactive body diagram for selecting symptom location.',
    component: TamboBodyDiagram,
    propsSchema: z.object({})
  },
  {
    name: 'PainScale',
    description: 'Pain rating scale from 1-10.',
    component: TamboPainScale,
    propsSchema: z.object({})
  },
  {
    name: 'DurationPicker',
    description: 'Time duration selector.',
    component: TamboDurationPicker,
    propsSchema: z.object({})
  },
  {
    name: 'SymptomChecklist',
    description: 'Checklist of additional symptoms.',
    component: TamboSymptomChecklist,
    propsSchema: z.object({
      primarySymptom: z.object({
        id: z.string(),
        name: z.string()
      }).optional()
    })
  },
  {
    name: 'RiskMeter',
    description: 'Visual risk assessment meter',
    component: RiskMeter,
    propsSchema: z.object({
      riskLevel: z.number().min(0).max(100).default(50)
    })
  },
  {
    name: 'RecommendationCard',
    description: 'Health recommendations based on risk assessment.',
    component: RecommendationCard,
    propsSchema: z.object({
      severity: z.enum(['low', 'moderate', 'high', 'emergency']).default('moderate'),
      title: z.string().nullable().default('Health Assessment'),
      description: z.string().nullable().default('Based on your symptoms'),
      actions: z.array(z.string()).default(['Monitor symptoms', 'See doctor']),
      tips: z.array(z.string()).nullable().default(['Stay hydrated'])
    })
  },
  {
    name: 'BookingInterface',
    description: 'Shows list of available doctors for booking appointments. Use after patient agrees to book.',
    component: TamboBookingInterface,
    propsSchema: z.object({
      doctors: z.array(z.object({
        id: z.string(),
        name: z.string(),
        specialty: z.string(),
        available: z.boolean().optional()
      })).default([])
    })
  }
];

// ===== CUSTOM TOOLS =====

export const tamboTools = [
  {
    name: 'analyzeSymptoms',
    description: 'Analyze patient symptoms to identify possible conditions',
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
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        console.log('✅ Symptom analysis:', data);
        return data;
      } catch (error) {
        console.error('❌ analyzeSymptoms:', error);
        return { 
          possibleConditions: ['Analysis unavailable'],
          recommendations: ['Consult a professional'],
          error: error.message 
        };
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
      error: z.string().optional()
    })
  },
  
  {
    name: 'calculateRisk',
    description: 'Calculate health risk score (0-100) based on symptoms and pain level',
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
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        console.log('✅ Risk calculation:', data);
        return {
          riskScore: data.riskScore || 50,
          riskLevel: data.riskLevel || 'moderate',
          factors: data.factors || []
        };
      } catch (error) {
        console.error('❌ calculateRisk:', error);
        let risk = 0;
        if (painLevel) risk += painLevel * 4;
        if (duration?.unit === 'months') risk += 20;
        risk += (symptoms?.length || 0) * 5;
        const finalRisk = Math.min(risk, 100);
        return {
          riskScore: finalRisk,
          riskLevel: finalRisk >= 80 ? 'emergency' : finalRisk >= 60 ? 'high' : finalRisk >= 40 ? 'moderate' : 'low'
        };
      }
    },
    inputSchema: z.object({
      painLevel: z.number(),
      duration: z.object({ amount: z.number(), unit: z.string() }),
      bodyPart: z.any(),
      symptoms: z.array(z.string())
    }),
    outputSchema: z.object({
      riskScore: z.number(),
      riskLevel: z.enum(['low', 'moderate', 'high', 'emergency'])
    })
  },
  
  {
    name: 'getDoctorsList',
    description: 'Fetch available doctors for booking. Call this when patient wants to book appointment.',
    tool: async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/doctors`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch doctors');
        const doctors = await response.json();
        console.log('✅ Doctors fetched:', doctors);
        return {
          doctors: doctors.map(d => ({
            id: d._id || d.id,
            name: d.name,
            specialty: d.specialty || 'General Practice',
            available: true
          }))
        };
      } catch (error) {
        console.error('❌ getDoctorsList:', error);
        // Return mock data as fallback
        return {
          doctors: [
            { id: '1', name: ' Sarah Johnson', specialty: 'General Practice', available: true },
            { id: '2', name: 'Michael Chen', specialty: 'Internal Medicine', available: true },
            { id: '3', name: 'Emily Rodriguez', specialty: 'Family Medicine', available: true }
          ]
        };
      }
    },
    inputSchema: z.object({}),
    outputSchema: z.object({
      doctors: z.array(z.object({
        id: z.string(),
        name: z.string(),
        specialty: z.string(),
        available: z.boolean()
      }))
    })
  }
];

// ===== EXPORTS FOR SERVICE COMPATIBILITY =====
export const emergencyKeywords = [
  'chest pain', "can't breathe", 'unconscious', 'stroke', 'heart attack', 'severe bleeding'
];

export const systemPrompt = `You are SymptomSync AI, a professional medical assessment assistant.

CRITICAL RULES:
- NEVER show raw JSON or tool results to the user
- NEVER display tool output as text (e.g., {"riskScore":46})
- Tool results are for YOUR use only - interpret them and show components

WORKFLOW:
1. Greet and ask about symptoms
2. Show BodyDiagram component
3. Show PainScale component
4. Show DurationPicker component
5. Show SymptomChecklist component
6. Call analyzeSymptoms tool (DO NOT show result as text)
7. Call calculateRisk tool (DO NOT show result as text)
8. Show RiskMeter component using the riskScore NUMBER
9. Show RecommendationCard component with proper props

AFTER CALLING calculateRisk TOOL:
You receive: {riskScore: 46, riskLevel: "moderate"}

CORRECT ACTION:
- First, show RiskMeter component with riskLevel={46}
- Then, show RecommendationCard component with:
  * severity="moderate"
  * title="Monitor and Consider Medical Consultation"
  * description="Your symptoms indicate moderate concern. See a doctor if they persist or worsen."
  * actions=["Monitor symptoms for 24-48 hours", "See doctor if no improvement", "Track symptoms", "Seek care if worsening"]
  * tips=["Get adequate rest", "Stay hydrated", "Avoid strenuous activity"]

WRONG ACTION (DO NOT DO THIS):
- Showing: {"riskScore":46,"riskLevel":"moderate"}
- Displaying raw tool output
- Writing JSON as text

COMPONENT PROP REQUIREMENTS:
RiskMeter:
- riskLevel={NUMBER} - Use the riskScore from calculateRisk

RecommendationCard (ALL required):
- severity: "low" | "moderate" | "high" | "emergency"
- title: String (clear, actionable title)
- description: String (explain what this level means)
- actions: Array of 3-5 actionable steps
- tips: Array of 3-5 health tips

SEVERITY TEMPLATES:

LOW (riskScore 0-39):
- title: "Self-Care Recommended"
- description: "Your symptoms appear mild and may improve with rest and self-care."
- actions: ["Monitor your symptoms", "Rest and stay hydrated", "Use over-the-counter remedies if needed", "Contact doctor if symptoms worsen"]
- tips: ["Get plenty of rest", "Drink fluids regularly", "Avoid irritants", "Track your symptoms"]

MODERATE (riskScore 40-59):
- title: "Medical Consultation Recommended"
- description: "Your symptoms warrant professional evaluation within 24-48 hours."
- actions: ["Schedule doctor appointment soon", "Monitor symptoms closely", "Keep symptom diary", "Seek urgent care if worsening"]
- tips: ["Rest as much as possible", "Stay well hydrated", "Avoid strenuous activity", "Follow care instructions"]

HIGH (riskScore 60-79):
- title: "Seek Medical Attention Today"
- description: "Your symptoms require prompt medical evaluation within 24 hours."
- actions: ["See doctor TODAY", "Visit urgent care if unavailable", "Monitor for worsening", "Have emergency contacts ready"]
- tips: ["Do not delay seeking care", "Bring medical history", "List current medications", "Have someone with you"]

EMERGENCY (riskScore 80-100):
- title: "🚨 EMERGENCY - Immediate Care Required"
- description: "Your symptoms indicate a potentially serious condition requiring immediate attention."
- actions: ["Call 911 or go to ER NOW", "Do NOT drive yourself", "Bring medications list", "Alert family/friends"]
- tips: ["Act immediately", "Stay calm", "Have someone stay with you", "Follow emergency responder instructions"]

Be professional, empathetic, and helpful.`;

export const tamboConfig = {
  apiKey: process.env.REACT_APP_TAMBO_API_KEY || '',
  model: 'claude-3-5-sonnet-20241022',
  maxTokens: 2000,
  temperature: 0.7
};

const config = {
  components: tamboComponents,
  tools: tamboTools,
  systemPrompt,
  emergencyKeywords,
  tamboConfig
};

export default config;