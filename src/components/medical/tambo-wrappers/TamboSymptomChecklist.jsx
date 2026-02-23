import React from 'react';
import SymptomChecklist from '../SymptomChecklist';
import { useTamboThreadInput } from '@tambo-ai/react';

const TamboSymptomChecklist = ({ primarySymptom }) => {
  const { setValue, submit } = useTamboThreadInput();

  const handleSelect = (symptoms) => {
    // Don't submit if symptoms is undefined or not an array
    if (!Array.isArray(symptoms)) return;
    
    const message = symptoms.length === 0 
      ? 'I have no additional symptoms'
      : `I also have these symptoms: ${symptoms.join(', ')}`;
    
    setValue(message);
    setTimeout(() => {
      submit().catch((error) => {
        console.error('❌ Tambo submit failed:', error);
      });
    }, 100);
  };

  return <SymptomChecklist onSelect={handleSelect} primarySymptom={primarySymptom} />;
};

export default TamboSymptomChecklist;