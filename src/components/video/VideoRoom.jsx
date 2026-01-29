import React, { useEffect, useCallback, useState } from 'react';
import DailyIframe from '@daily-co/daily-js';
import { Card, Button, Alert, Spinner } from 'react-bootstrap';
import { FaPhone, FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash } from 'react-icons/fa';

const VideoRoom = ({ roomUrl, onLeave, userName }) => {
  const [callFrame, setCallFrame] = useState(null);
  const [isJoining, setIsJoining] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [participants, setParticipants] = useState({});
  const [callDuration, setCallDuration] = useState(0);

  // Initialize Daily.co call
  useEffect(() => {
    if (!roomUrl) return;

    const frame = DailyIframe.createFrame({
      showLeaveButton: false,
      showFullscreenButton: true,
      iframeStyle: {
        width: '100%',
        height: '600px',
        border: '0',
        borderRadius: '12px',
      },
    });

    setCallFrame(frame);

    // Join the call
    frame
      .join({ url: roomUrl, userName })
      .then(() => {
        setIsJoining(false);
        console.log('Successfully joined call');
      })
      .catch((error) => {
        console.error('Error joining call:', error);
        setIsJoining(false);
      });

    // Event listeners
    frame.on('participant-joined', (event) => {
      console.log('Participant joined:', event.participant);
      setParticipants(frame.participants());
    });

    frame.on('participant-left', (event) => {
      console.log('Participant left:', event.participant);
      setParticipants(frame.participants());
    });

    frame.on('left-meeting', () => {
      console.log('You left the meeting');
      if (onLeave) onLeave();
    });

    // Cleanup
    return () => {
      if (frame) {
        frame.destroy();
      }
    };
  }, [roomUrl, userName, onLeave]);

  // Call duration timer
  useEffect(() => {
    if (!isJoining && callFrame) {
      const timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isJoining, callFrame]);

  const toggleMute = () => {
    if (callFrame) {
      callFrame.setLocalAudio(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (callFrame) {
      callFrame.setLocalVideo(!isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const leaveCall = () => {
    if (callFrame) {
      callFrame.leave();
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isJoining) {
    return (
      <Card className="shadow-custom">
        <Card.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <h4>Connecting to video call...</h4>
          <p className="text-muted">Please wait while we set up your connection</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div>
      {/* Call Info Bar */}
      <Alert variant="info" className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <strong>In Call:</strong> {Object.keys(participants).length} participant(s)
        </div>
        <div>
          <strong>Duration:</strong> {formatDuration(callDuration)}
        </div>
      </Alert>

      {/* Video Container */}
      <Card className="shadow-lg border-0 mb-3">
        <div id="daily-call-container" />
      </Card>

      {/* Control Buttons */}
      <Card className="shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-center gap-3">
            <Button
              variant={isMuted ? 'danger' : 'secondary'}
              size="lg"
              className="rounded-circle"
              style={{ width: '60px', height: '60px' }}
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
            </Button>

            <Button
              variant={isVideoOff ? 'danger' : 'secondary'}
              size="lg"
              className="rounded-circle"
              style={{ width: '60px', height: '60px' }}
              onClick={toggleVideo}
              title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
            >
              {isVideoOff ? <FaVideoSlash /> : <FaVideo />}
            </Button>

            <Button
              variant="danger"
              size="lg"
              className="rounded-circle"
              style={{ width: '60px', height: '60px' }}
              onClick={leaveCall}
              title="Leave Call"
            >
              <FaPhone style={{ transform: 'rotate(135deg)' }} />
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default VideoRoom;