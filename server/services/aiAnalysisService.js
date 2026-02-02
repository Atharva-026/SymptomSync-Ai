const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const pdf = require('pdf-parse');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'YOUR_API_KEY');

// Extract text from PDF
async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    return null;
  }
}

// Extract text from image (would need OCR - simplified here)
async function extractTextFromImage(filePath) {
  // For images, you'd typically use OCR like Tesseract
  // For now, we'll return a placeholder
  return "Image analysis not yet implemented. Please use PDF format for detailed analysis.";
}

// Analyze medical record with AI
async function analyzeWithAI(filePath, fileType) {
  try {
    let extractedText = '';

    // Extract text based on file type
    if (fileType === 'application/pdf') {
      extractedText = await extractTextFromPDF(filePath);
    } else if (fileType.startsWith('image/')) {
      extractedText = await extractTextFromImage(filePath);
    } else {
      throw new Error('Unsupported file type for AI analysis');
    }

    if (!extractedText) {
      throw new Error('Could not extract text from file');
    }

    // Prepare prompt for Gemini
    const prompt = `
You are a medical AI assistant. Analyze the following medical report and provide a simple, patient-friendly explanation.

Medical Report Content:
${extractedText}

Please provide:
1. A brief summary (2-3 sentences in simple language)
2. Key findings (bullet points)
3. Any abnormal values or concerning results
4. General recommendations (not medical advice, just observations)

Format your response as JSON with these fields:
{
  "summary": "brief summary here",
  "keyFindings": ["finding 1", "finding 2"],
  "abnormalValues": ["abnormal 1", "abnormal 2"],
  "recommendations": ["recommendation 1", "recommendation 2"]
}

Keep language simple and avoid medical jargon. Explain any medical terms used.
    `;

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      return analysis;
    }

    // Fallback if JSON parsing fails
    return {
      summary: text.substring(0, 500),
      keyFindings: ['Analysis completed - please review full text'],
      abnormalValues: [],
      recommendations: ['Consult with your doctor for detailed interpretation']
    };

  } catch (error) {
    console.error('AI Analysis Error:', error);
    
    // Return fallback analysis
    return {
      summary: 'Unable to perform AI analysis at this time. Please consult with your healthcare provider for interpretation.',
      keyFindings: ['Manual review recommended'],
      abnormalValues: [],
      recommendations: ['Share this report with your doctor for professional interpretation']
    };
  }
}

module.exports = {
  analyzeWithAI
};