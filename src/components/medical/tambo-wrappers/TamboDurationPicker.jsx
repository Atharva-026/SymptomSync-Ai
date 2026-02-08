import React from 'react';
import DurationPicker from '../DurationPicker';
import { useTamboThreadInput } from '@tambo-ai/react';

const TamboDurationPicker = () => {
  const { setValue, submit } = useTamboThreadInput();

  const handleSelect = (duration) => {
    if (!duration || !duration.amount || !duration.unit) return; // Safety check
    
    const message = `I've had these symptoms for ${duration.amount} ${duration.unit}`;
    setValue(message);
    setTimeout(() => {
      submit();
    }, 100);
  };

  return <DurationPicker onSelect={handleSelect} />;
};

export default TamboDurationPicker;