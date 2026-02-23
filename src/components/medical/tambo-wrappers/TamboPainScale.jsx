import React from 'react';
import PainScale from '../PainScale';
import { useTamboThreadInput } from '@tambo-ai/react';

const TamboPainScale = () => {
  const { setValue, submit } = useTamboThreadInput();

  const handleSelect = (painLevel) => {
    if (!painLevel || painLevel < 1 || painLevel > 10) return; // Safety check
    
    const message = `My pain level is ${painLevel} out of 10`;
    setValue(message);
    setTimeout(() => {
      submit().catch((error) => {
        console.error('❌ Tambo submit failed:', error);
      });
    }, 100);
  };

  return <PainScale onSelect={handleSelect} />;
};

export default TamboPainScale;