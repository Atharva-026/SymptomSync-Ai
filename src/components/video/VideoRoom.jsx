import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Spinner } from 'react-bootstrap';
import { FaPhone } from 'react-icons/fa';

const VideoRoom = ({ roomUrl, onLeave, userName }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!roomUrl) {
      setError('No room URL provided');
      setIsLoading(false);
      return;
    }

    // Timer to remove loading spinner after 5 seconds (Jitsi takes time to handshake)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [roomUrl]);

  // Construct the secure URL with UI overrides
  // We use URL fragments (#) to pass config options directly to the Jitsi web app
  const constructJitsiUrl = () => {
    const baseUrl = roomUrl.split('#')[0]; // Clean base URL
    const config = [
      'config.prejoinPageEnabled=false',
      'config.disableDeepLinking=true',
      'interfaceConfig.SHOW_JITSI_WATERMARK=false',
      'interfaceConfig.SHOW_POWERED_BY=false',
      'config.startWithAudioMuted=false',
      'config.startWithVideoMuted=false',
      `userInfo.displayName="${userName || 'Patient'}"`
    ].join('&');
    
    return `${baseUrl}#${config}`;
  };

  if (error) {
    return (
      <Card className="shadow-custom border-danger text-center p-5">
        <Alert variant="danger">
          <h5>Connection Error</h5>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={onLeave}>Return to Dashboard</Button>
        </Alert>
      </Card>
    );
  }

  return (
    <div className="video-consultation-wrapper">
      {isLoading && (
        <Card className="shadow-custom mb-3 text-center p-5 border-0">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <h4>Connecting to your Doctor...</h4>
          <p className="text-muted">Setting up secure end-to-end encryption</p>
        </Card>
      )}

      <Card className="shadow-lg border-0 mb-3 overflow-hidden" 
            style={{ 
              borderRadius: '16px', 
              backgroundColor: '#000',
              // Keep visible but pushed off-screen if loading to prevent iframe "Internal Error"
              height: isLoading ? '1px' : '600px',
              opacity: isLoading ? 0 : 1
            }}>
        <iframe
          title="SymptomSync Video Consultation"
          src={constructJitsiUrl()}
          allow="camera; microphone; display-capture; autoplay; clipboard-write; encrypted-media; speaker-selection"
          style={{
            width: '100%',
            height: '100%',
            border: 'none'
          }}
        />
      </Card>
      
      <div className="text-center mt-3">
        <Button 
          variant="danger" 
          size="lg" 
          onClick={onLeave} 
          className="px-5 shadow-sm rounded-pill"
        >
          <FaPhone className="me-2" style={{ transform: 'rotate(135deg)' }} />
          End Consultation
        </Button>
      </div>
    </div>
  );
};

export default VideoRoom;