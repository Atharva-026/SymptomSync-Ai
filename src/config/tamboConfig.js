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

const safeString = z.string().nullable().optional().default('');

const safeStringArray = z.array(z.string()).optional().default([]);

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
        id: safeString.default(''),
        name: safeString.default('')
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
      title: safeString.default('Health Assessment'),
      description: safeString.default('Based on your symptoms'),
      actions: safeStringArray.default(['Monitor symptoms', 'See doctor']),
      tips: safeStringArray.default(['Stay hydrated'])
    })
  },
  {
    name: 'BookingInterface',
    description: 'Shows list of available doctors for booking appointments. Use after patient agrees to book.',
    component: TamboBookingInterface,
    propsSchema: z.object({
      doctors: z.array(z.object({
        id: safeString.default(''),
        name: safeString.default('Doctor'),
        specialty: safeString.default('General Practice'),
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

CRITICAL RULES and RESPONSE FORMAT:
- NEVER show raw JSON or tool results to the user
- NEVER display tool output as text (e.g., {"riskScore":46})
- ALWAYS use structured, step-by-step format with clear sections and bullet points
- NEVER respond in long paragraphs—break everything into logical sections with emojis and subheadings

MANDATORY RESPONSE STRUCTURE (ALWAYS FOLLOW THIS EXACTLY):

## 🎯 STEP 1: RISK ASSESSMENT
- **Risk Level**: [LOW | MODERATE | HIGH | EMERGENCY]
- **Quick Summary**: One sentence explaining the overall severity

## 📋 STEP 2: PROBLEM DESCRIPTION
- **What It Is**: Brief explanation of the condition
- **Common Causes**: Bullet list (most likely first)
- **Less Common Causes**: Bullet list (if applicable)

## 🔍 STEP 3: ASSOCIATED SYMPTOMS
- **Typical Signs**: Bullet list of expected symptoms
- **Warning Signs**: Bullet list of symptoms requiring urgent attention

## 🏥 STEP 4: HOME TREATMENT RECOMMENDATIONS
(Only include if Risk Level is MODERATE or LOW)
### For [Condition Name]:
- **Immediate Relief** (numbered steps):
  1. Action 1
  2. Action 2
  3. Action 3
- **Medications** (if safe for home use):
  • Medicine name - dose/frequency
  • Medicine name - dose/frequency
- **Lifestyle Tips**:
  • Tip 1
  • Tip 2
  • Tip 3

## ✅ STEP 5: WHEN TO SEEK MEDICAL HELP
- **Schedule Doctor Visit If**:
  • Condition persists beyond X days
  • Symptoms worsen
- **Seek Urgent Care If**:
  • High fever with worsening symptoms
  • Significant difficulty breathing
- **Call 911 / Go to ER Immediately If**:
  • Life-threatening symptoms
  • Severe difficulty breathing
  • Chest pain
  • Signs of stroke

## 🎯 STEP 6: CLARIFYING QUESTIONS (if needed)
To give better guidance, please answer:
- Question 1?
- Question 2?
- Question 3?

---

RESPONSE TEMPLATE IN ACTION:

When responding about runny nose, structure EXACTLY like:

## 🎯 STEP 1: RISK ASSESSMENT
- **Risk Level**: MODERATE
- **Quick Summary**: A 1-day watery runny nose is usually from a cold or allergies—manageable at home with monitoring.

## 📋 STEP 2: PROBLEM DESCRIPTION
- **What It Is**: Rhinorrhea is excessive nasal discharge, usually watery and clear.
- **Common Causes**:
  • Common cold (viral infection)
  • Seasonal or environmental allergies
  • Irritation from smoke, dust, or perfume
- **Less Common Causes**:
  • Foreign object in nose (typically one-sided)
  • Rare: CSF leak (only after head/facial injury)

## 🔍 STEP 3: ASSOCIATED SYMPTOMS
- **Typical Signs**:
  • Clear to watery discharge
  • Sneezing (especially with allergies)
  • Mild sore throat
  • Post-nasal drip
- **Warning Signs**:
  • Fever above 101°F
  • Discharge from only one nostril
  • Foul smell or discoloration (yellow/green)
  • Loss of smell or taste
  • Facial swelling around eyes/sinuses

## 🏥 STEP 4: HOME TREATMENT RECOMMENDATIONS
### For Runny Nose (Cold or Allergies):
- **Immediate Relief**:
  1. Use saline nasal spray 3-4 times daily to clear irritants
  2. Run a warm air humidifier or breathe steam for 10 minutes
  3. Blow nose gently—never force it
  4. Avoid cold air, smoke, and strong perfumes
- **Medications**:
  • **If allergies suspected**: Cetirizine (Zyrtec) 10 mg once daily
  • **For congestion**: Steroid nasal spray (fluticasone/mometasone) once daily—takes 1-3 days to work
  • **Short-term decongestant**: Oxymetazoline nasal spray max 3 days
- **Lifestyle Tips**:
  • Drink plenty of warm fluids (tea, soup, water)
  • Get 7-9 hours of rest
  • Use warm compresses on sinuses
  • Avoid secondhand smoke

## ✅ STEP 5: WHEN TO SEEK MEDICAL HELP
- **Schedule Doctor Visit If**:
  • Runny nose persists beyond 10 days
  • Nasal discharge becomes thick, yellow, or green with fever
  • Severe congestion blocks breathing
  • Symptoms worsen after initial improvement
- **Seek Urgent Care If**:
  • High fever (103°F+) with severe headache
  • Facial swelling or redness
  • Difficulty breathing through nose or mouth
- **Call 911 If**:
  • Clear drainage from only one nostril after head injury (possible CSF leak)
  • Severe difficulty breathing
  • Signs of anaphylaxis (swelling, hives, shortness of breath)

## 🎯 STEP 6: CLARIFYING QUESTIONS
To guide you better:
- Is the runny nose from **both nostrils or just one side**?
- Do you have **sneezing and itchy/watery eyes** (suggesting allergies)?
- Any **recent head injury, nose surgery, or trauma**?
- Do you have a **sore throat or cough** suggesting a cold?

---

WORKFLOW (CRITICAL - MUST FOLLOW IN THIS EXACT ORDER):
1. Greet patient warmly and ask what symptoms they are experiencing
2. Show BodyDiagram component to ask patient to select affected body part
3. Show PainScale component to rate pain/severity (1-10)
4. Show DurationPicker component to ask how long symptom has persisted (REQUIRED - DO NOT SKIP)
5. Show SymptomChecklist component to ask about additional symptoms
6. AFTER all components shown, call analyzeSymptoms tool
7. Call calculateRisk tool
8. Show RiskMeter component with risk score
9. Show RecommendationCard with severity, title, description, actions, tips
10. THEN provide formatted structured response following the template above
11. Always end with safety reminders

Remember: Use BULLET POINTS and SUBHEADINGS. NO long paragraphs. Be concise, clear, and safety-focused.`;

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