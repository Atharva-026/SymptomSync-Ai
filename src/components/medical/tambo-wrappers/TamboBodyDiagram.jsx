import React from 'react';
import BodyDiagram from '../BodyDiagram';
import { useTamboThreadInput } from '@tambo-ai/react';

const TamboBodyDiagram = () => {
  const { setValue, submit } = useTamboThreadInput();

  const handleSelect = (bodyPart) => {
    if (!bodyPart || !bodyPart.name) return; // Safety check
    
    const message = `I selected ${bodyPart.emoji || ''} ${bodyPart.name} as the affected area`;
    setValue(message);
    setTimeout(() => {
      submit();
    }, 100); // Increased delay
  };

  return <BodyDiagram onSelect={handleSelect} />;
};

export default TamboBodyDiagram;