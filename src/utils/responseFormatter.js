/**
 * Response Formatter Utility
 * Converts long-form medical advice into structured step-by-step format
 */

// Filter out JSON tool results - they should never be shown to user
const filterJsonResponses = (text) => {
  // Remove complete JSON objects and component references
  let cleaned = text
    // Remove function/component references like "to=functions.show_component_DurationPicker"
    .replace(/\b(to|from|handler|ref|func|call)\s*=\s*functions\.\w+/g, '')
    // Remove raw JSON objects with ": " pattern
    .replace(/\{"[^"]*":\s*[^}]*\}/g, '')
    // Remove opening of JSON objects
    .replace(/\{"[^"]+"\s*:/g, '')
    // Remove JSON separators
    .replace(/\}\s*\{/g, '')
    // Remove JSON patterns
    .replace(/\{[^}]*"([a-zA-Z]+)"\s*:/g, '')
    // Remove lines that are just JSON or component calls
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      // Skip pure JSON lines
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) return false;
      // Skip component reference lines
      if (trimmed.match(/^(to|from|handler|ref|call|func)=/)) return false;
      // Skip lines with only JSON-like patterns
      if (trimmed.match(/^["\w]+\s*:\s*[^,]*$/)) return false;
      return true;
    })
    .join('\n')
    .trim();
  
  return cleaned;
};

export const formatMedicalResponse = (text) => {
  if (!text || typeof text !== 'string') return text;

  // Step 1: Filter out raw JSON tool results
  let filteredText = filterJsonResponses(text);
  
  // If response is less than 200 chars, assume it's a greeting or question
  if (filteredText.length < 200) {
    return filteredText;
  }

  // Step 2: Check if response is already in correct 6-step format
  const isFormatted = /[🎯📋🔍🏥✅].*STEP\s+[1-6]|RISK ASSESSMENT|PROBLEM DESCRIPTION|ASSOCIATED SYMPTOMS|HOME TREATMENT|WHEN TO SEEK|CLARIFYING QUESTIONS/.test(filteredText);
  
  // Clean up any markdown symbols
  let cleanedText = filteredText;
  cleanedText = cleanedText.replace(/^#{1,6}\s+/gm, ''); // Remove heading markers (at line start)
  cleanedText = cleanedText.replace(/\*\*([^*]+)\*\*/g, '$1'); // Remove bold markers
  cleanedText = cleanedText.replace(/^-\s+/gm, '• '); // Convert dash lists to bullet points
  
  // Ensure proper line breaks around major headings
  cleanedText = cleanedText.replace(/\n([🎯📋🔍🏥✅][^\n]*STEP\s*\d+)/g, '\n\n$1'); // Add spacing before headings
  cleanedText = cleanedText.replace(/([🎯📋🔍🏥✅][^\n]*STEP\s*\d+)([^\n])/g, '$1\n$2'); // Ensure heading ends with newline

  // If already formatted, just return cleaned version
  if (isFormatted) {
    return cleanedText;
  }

  // Otherwise, try to restructure paragraph response
  return restructureParagraphResponse(cleanedText);
};

/**
 * Restructures a paragraph response into step-by-step format
 */
const restructureParagraphResponse = (text) => {
  const structured = [];

  // Step 1: Extract risk level
  const riskLevel = extractRiskLevel(text);
  structured.push(formatStep1RiskAssessment(text, riskLevel));

  // Step 2: Problem description
  structured.push(formatStep2ProblemDescription(text));

  // Step 3: Associated symptoms
  structured.push(formatStep3AssociatedSymptoms(text));

  // Step 4: Home treatment
  const homeText = formatStep4HomeTreatment(text);
  if (homeText) structured.push(homeText);

  // Step 5: When to seek help
  structured.push(formatStep5WhenToSeekHelp(text));

  // Step 6: Clarifying questions
  const questionsText = formatStep6ClarifyingQuestions(text);
  if (questionsText) structured.push(questionsText);

  return structured.filter((s) => s && s.trim()).join('\n\n');
};

/**
 * Step 1: Risk Assessment
 */
const formatStep1RiskAssessment = (text, riskLevel) => {
  let summary = extractSummary(text);

  return `🎯 STEP 1: RISK ASSESSMENT
Risk Level: ${riskLevel}
Quick Summary: ${summary}`;
};

/**
 * Step 2: Problem Description
 */
const formatStep2ProblemDescription = (text) => {
  const commonCauses = extractCommonCauses(text);
  const lessCommon = extractLesserCauses(text);

  let content = `📋 STEP 2: PROBLEM DESCRIPTION`;

  // Extract what the problem is
  const description = extractProblemDescription(text);
  if (description) {
    content += `\n\nWhat It Is:\n${description}`;
  }

  // Common causes
  if (commonCauses.length > 0) {
    content += `\n\nCommon Causes:`;
    commonCauses.forEach((cause) => {
      content += `\n• ${cause}`;
    });
  } else {
    content += `\n\nCommon Causes:`;
    content += `\n• Viral infection (cold)`;
    content += `\n• Allergies`;
    content += `\n• Environmental irritants`;
  }

  // Less common causes
  if (lessCommon.length > 0) {
    content += `\n\nLess Common Causes:`;
    lessCommon.forEach((cause) => {
      content += `\n• ${cause}`;
    });
  }

  return content;
};

/**
 * Step 3: Associated Symptoms
 */
const formatStep3AssociatedSymptoms = (text) => {
  const typicalSigns = extractTypicalSigns(text);
  const warningSigns = extractWarningSigns(text);

  let content = `🔍 STEP 3: ASSOCIATED SYMPTOMS`;

  if (typicalSigns.length > 0) {
    content += `\n\nTypical Signs:`;
    typicalSigns.forEach((sign) => {
      content += `\n• ${sign}`;
    });
  }

  if (warningSigns.length > 0) {
    content += `\n\nWarning Signs:`;
    warningSigns.forEach((sign) => {
      content += `\n• ${sign}`;
    });
  } else {
    content += `\n\nWarning Signs:`;
    content += `\n• Severe symptoms`;
    content += `\n• Worsening symptoms`;
    content += `\n• Fever or chills`;
  }

  return content;
};

/**
 * Step 4: Home Treatment
 */
const formatStep4HomeTreatment = (text) => {
  if (
    !text.includes('home') &&
    !text.includes('treatment') &&
    !text.includes('relief') &&
    !text.includes('natural')
  ) {
    return null;
  }

  const treatments = extractHomeTreatments(text);
  const medications = extractMedications(text);
  const tips = extractTips(text);

  if (treatments.length === 0 && medications.length === 0 && tips.length === 0) {
    return null;
  }

  let content = `🏥 STEP 4: HOME TREATMENT RECOMMENDATIONS`;

  if (treatments.length > 0) {
    content += `\n\nImmediate Relief:`;
    treatments.forEach((treatment, idx) => {
      content += `\n${idx + 1}. ${treatment}`;
    });
  }

  if (medications.length > 0) {
    content += `\n\nMedications:`;
    medications.forEach((med) => {
      content += `\n• ${med}`;
    });
  }

  if (tips.length > 0) {
    content += `\n\nLifestyle Tips:`;
    tips.forEach((tip) => {
      content += `\n• ${tip}`;
    });
  }

  return content;
};

/**
 * Step 5: When to Seek Help
 */
const formatStep5WhenToSeekHelp = (text) => {
  const doctorConditions = extractDoctorConditions(text);
  const urgentConditions = extractUrgentConditions(text);
  const emergencyConditions = extractEmergencyConditions(text);

  let content = `✅ STEP 5: WHEN TO SEEK MEDICAL HELP`;

  if (doctorConditions.length > 0) {
    content += `\n\nSchedule Doctor Visit If:`;
    doctorConditions.forEach((cond) => {
      content += `\n• ${cond}`;
    });
  } else {
    content += `\n\nSchedule Doctor Visit If:`;
    content += `\n• Symptoms persist beyond 7-10 days`;
    content += `\n• Symptoms worsen`;
  }

  if (urgentConditions.length > 0) {
    content += `\n\nSeek Urgent Care If:`;
    urgentConditions.forEach((cond) => {
      content += `\n• ${cond}`;
    });
  } else {
    content += `\n\nSeek Urgent Care If:`;
    content += `\n• High fever with worsening symptoms`;
  }

  if (emergencyConditions.length > 0) {
    content += `\n\nCall 911 If:`;
    emergencyConditions.forEach((cond) => {
      content += `\n• ${cond}`;
    });
  }

  return content;
};

/**
 * Step 6: Clarifying Questions
 */
const formatStep6ClarifyingQuestions = (text) => {
  const questions = extractQuestions(text);

  if (questions.length === 0) {
    return null;
  }

  let content = `🎯 STEP 6: CLARIFYING QUESTIONS\n\nTo guide you better:`;
  questions.forEach((q) => {
    content += `\n• ${q}`;
  });

  return content;
};

// ====== EXTRACTION HELPERS ======

const extractRiskLevel = (text) => {
  const lowerText = text.toLowerCase();

  if (
    lowerText.includes('emergency') ||
    lowerText.includes('call 911') ||
    lowerText.includes('go to er')
  ) {
    return 'EMERGENCY';
  }
  if (
    lowerText.includes('urgent') ||
    lowerText.includes('severe') ||
    lowerText.includes('immediately')
  ) {
    return 'HIGH';
  }
  if (lowerText.includes('moderate') || lowerText.includes('consult')) {
    return 'MODERATE';
  }
  return 'LOW';
};

const extractSummary = (text) => {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim());
  const firstSentence = sentences[0]?.trim() || text.substring(0, 100);
  return firstSentence.length > 200 ? firstSentence.substring(0, 200) + '...' : firstSentence;
};

const extractProblemDescription = (text) => {
  const match = text.match(
    /(?:is|caused by|from|most commonly|usually) ([^.!?\n]{20,150})/i
  );
  return match ? match[1].trim() : null;
};

const extractCommonCauses = (text) => {
  const causes = [];
  const lines = text.split('\n');

  for (const line of lines) {
    if (
      line.match(
        /(?:cold|allergy|allergies|viral|infection|allergen|irritant|trigger|cause)/i
      )
    ) {
      const cleaned = line.replace(/^[-*•]\s*/, '').trim();
      if (cleaned.length > 5 && cleaned.length < 150) {
        causes.push(cleaned);
      }
    }
  }

  return [...new Set(causes)].slice(0, 4);
};

const extractLesserCauses = (text) => {
  const lowerText = text.toLowerCase();
  const causes = [];

  if (lowerText.includes('rare') || lowerText.includes('uncommon')) {
    const match = text.match(
      /(?:rare|uncommon|less common)[:\s]*([^.]+)/i
    );
    if (match) {
      const items = match[1].split(/[,;]/).slice(0, 3);
      causes.push(...items.map((i) => i.trim()));
    }
  }

  return [...new Set(causes)].filter((c) => c.length > 3);
};

const extractTypicalSigns = (text) => {
  const signs = [];
  const keywords = [
    'discharge',
    'runny',
    'sneezing',
    'itchy',
    'watery',
    'congestion',
    'cough',
    'sore throat',
  ];

  for (const keyword of keywords) {
    if (text.toLowerCase().includes(keyword)) {
      signs.push(capitalizeFirst(keyword));
    }
  }

  return signs;
};

const extractWarningSigns = (text) => {
  const signs = [];
  const lowerText = text.toLowerCase();

  if (lowerText.includes('fever')) signs.push('Fever above 100.4°F');
  if (lowerText.includes('headache')) signs.push('Severe or persistent headache');
  if (lowerText.includes('breathing')) signs.push('Difficulty breathing');
  if (lowerText.includes('vision')) signs.push('Vision changes');
  if (lowerText.includes('stiff neck')) signs.push('Stiff neck');
  if (lowerText.includes('swelling')) signs.push('Facial swelling or redness');
  if (lowerText.includes('yellow') || lowerText.includes('green'))
    signs.push('Thick yellow or green discharge');

  return signs;
};

const extractHomeTreatments = (text) => {
  const treatments = [];
  const keywords = [
    { pattern: /saline/i, text: 'Use saline nasal spray or rinse 2-3 times daily' },
    { pattern: /steam/i, text: 'Use warm steam or humidifier for 10 minutes' },
    { pattern: /rinse/i, text: 'Gentle nasal rinse to clear irritants' },
    { pattern: /compress/i, text: 'Apply warm compress over nose and cheeks' },
    { pattern: /fluid/i, text: 'Drink plenty of water and warm fluids' },
    { pattern: /elevation|head/i, text: 'Sleep with head elevated on extra pillow' },
    { pattern: /shower/i, text: 'Take warm showers to inhale steam' },
  ];

  for (const item of keywords) {
    if (item.pattern.test(text)) {
      treatments.push(item.text);
    }
  }

  return treatments;
};

const extractMedications = (text) => {
  const meds = [];
  const keywords = [
    {
      pattern: /cetirizine|zyrtec|loratadine/i,
      text: 'Cetirizine (Zyrtec) or Loratadine (Claritin) once daily if allergies',
    },
    {
      pattern: /steroid|fluticasone|mometasone/i,
      text: 'Steroid nasal spray (fluticasone/mometasone) once daily',
    },
    {
      pattern: /decongestant|oxymetazoline|xylometazoline/i,
      text: 'Decongestant nasal spray (max 3 days)',
    },
  ];

  for (const med of keywords) {
    if (med.pattern.test(text)) {
      meds.push(med.text);
    }
  }

  return meds;
};

const extractTips = (text) => {
  const tips = [];
  const keywords = [
    { pattern: /rest/i, text: 'Get adequate rest and sleep' },
    { pattern: /hydrat/i, text: 'Stay well hydrated with water and fluids' },
    { pattern: /avoid|trigger|smoke|dust|perfume/i, text: 'Avoid environmental triggers' },
    { pattern: /wash|clean|bedding/i, text: 'Wash bedding regularly' },
    {
      pattern: /window|pollen|close/i,
      text: 'Keep windows closed during high pollen seasons',
    },
  ];

  for (const tip of keywords) {
    if (tip.pattern.test(text)) {
      tips.push(tip.text);
    }
  }

  return tips;
};

const extractDoctorConditions = (text) => {
  const conditions = [];
  const lowerText = text.toLowerCase();

  if (lowerText.includes('10 days') || lowerText.includes('week'))
    conditions.push('Symptoms persist beyond 7-10 days without improvement');
  if (lowerText.includes('worse') || lowerText.includes('worsen'))
    conditions.push('Symptoms worsen after initially improving');
  if (lowerText.includes('yellow') || lowerText.includes('green'))
    conditions.push('Thick yellow or green discharge with fever');

  return conditions;
};

const extractUrgentConditions = (text) => {
  const conditions = [];
  const lowerText = text.toLowerCase();

  if (lowerText.includes('fever')) conditions.push('High fever (103°F+)');
  if (lowerText.includes('headache')) conditions.push('Severe headache with fever');
  if (lowerText.includes('swelling') || lowerText.includes('facial'))
    conditions.push('Facial swelling or redness around eyes');
  if (lowerText.includes('breathing'))
    conditions.push('Significant difficulty breathing');

  return conditions;
};

const extractEmergencyConditions = (text) => {
  const conditions = [];
  const lowerText = text.toLowerCase();

  if (lowerText.includes('csfhead injury'))
    conditions.push('Clear drainage from one nostril after head injury (possible CSF leak)');
  if (lowerText.includes('severe breathing') || lowerText.includes('can\'t breathe'))
    conditions.push('Severe difficulty breathing');
  if (lowerText.includes('chest pain')) conditions.push('Chest pain or pressure');

  return conditions;
};

const extractQuestions = (text) => {
  const questions = [];
  const lines = text.split('\n');

  for (const line of lines) {
    if (line.includes('?')) {
      const cleaned = line.replace(/^[-*•]\s*/, '').trim();
      if (cleaned.length > 10 && cleaned.length < 200) {
        questions.push(cleaned);
      }
    }
  }

  // Ensure we have some default questions
  if (questions.length === 0) {
    questions.push(
      'Is the symptom on both sides or just one?',
      'Do you have additional symptoms like fever or headache?',
      'Have you had any recent injuries or medical procedures?'
    );
  }

  return questions.slice(0, 3);
};

const capitalizeFirst = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export default formatMedicalResponse;
