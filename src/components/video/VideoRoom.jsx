import React, { useEffect, useRef, useState } from 'react';
import DailyIframe from '@daily-co/daily-js';
import { Card, Button, Alert, Spinner } from 'react-bootstrap';
import { FaPhone, FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash } from 'react-icons/fa';

const VideoRoom = ({ roomUrl, onLeave, userName }) => {
  const callFrameRef = useRef(null);
  const containerRef = useRef(null);
  const mountedRef = useRef(true);
  
  const [isJoining, setIsJoining] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [participants, setParticipants] = useState({});
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    mountedRef.current = true;
    
    if (!roomUrl) {
      setError('No room URL provided');
      setIsJoining(false);
      return;
    }

    const initializeCall = async () => {
      try {
        // Destroy any existing instance
        if (callFrameRef.current) {
          try {
            await callFrameRef.current.destroy();
          } catch (err) {
            console.warn('Error destroying previous frame:', err);
          }
          callFrameRef.current = null;
          // clear any global reference as well
          if (window.__daily_instance__) window.__daily_instance__ = null;
        }

        // Wait a bit to ensure cleanup
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!mountedRef.current) return;

        // Prevent duplicate global DailyIframe instances (some environments may leave a stray instance)
        if (window.__daily_instance__) {
          try {
            await window.__daily_instance__.leave();
            await window.__daily_instance__.destroy();
          } catch (err) {
            console.warn('Error destroying global Daily instance:', err);
          }
          window.__daily_instance__ = null;
        }

        // Create new frame (retry once if creation fails due to leftover instance)
        let frame;
        try {
          frame = DailyIframe.createFrame(containerRef.current, {
            url: roomUrl,
            showLeaveButton: false,
            showFullscreenButton: true,
            iframeStyle: {
              width: '100%',
              height: '600px',
              border: '0',
              borderRadius: '12px',
            },
          });
        } catch (createErr) {
          console.warn('Error creating Daily frame, attempting recovery:', createErr);
          if (window.__daily_instance__) {
            try {
              await window.__daily_instance__.destroy();
            } catch (err) {
              console.warn('Second attempt destroy failed:', err);
            }
            window.__daily_instance__ = null;
          }
          // retry
          frame = DailyIframe.createFrame(containerRef.current, {
            showLeaveButton: false,
            showFullscreenButton: true,
            iframeStyle: {
              width: '100%',
              height: '600px',
              border: '0',
              borderRadius: '12px',
            },
          });
        }

        callFrameRef.current = frame;
        // expose globally so other mounts can detect and clean it up
        window.__daily_instance__ = frame;

        // Set up event listeners
        frame
          .on('joined-meeting', () => {
            if (!mountedRef.current) return;
            console.log('✅ Joined meeting successfully');
            setIsJoining(false);
            setParticipants(frame.participants());
          })
          .on('participant-joined', (event) => {
            if (!mountedRef.current) return;
            console.log('👤 Participant joined:', event.participant.user_name);
            setParticipants(frame.participants());
          })
          .on('participant-left', (event) => {
            if (!mountedRef.current) return;
            console.log('👋 Participant left:', event.participant.user_name);
            setParticipants(frame.participants());
          })
          .on('left-meeting', () => {
            console.log('You left the meeting');
            if (mountedRef.current && onLeave) {
              onLeave();
            }
          })
          .on('error', (err) => {
            if (!mountedRef.current) return;
            console.error('❌ Call error:', err);
            setError(err.errorMsg || 'An error occurred during the call');
            setIsJoining(false);
          });

        // Join the call (iframe already created with the correct URL)
        console.debug('Joining Daily frame with URL:', roomUrl);
        try {
          await frame.join({ userName: userName || 'Guest' });
        } catch (joinErr) {
          console.error('❌ Error during frame.join():', joinErr);
          // If join fails due to postMessage/origin mismatch, try forcing iframe src as fallback
          try {
            if (!containerRef.current) {
              throw new Error('Container not available for retry');
            }
            const iframe = containerRef.current.querySelector('iframe');
            if (iframe && iframe.src !== roomUrl) {
              console.warn('Forcing iframe.src to roomUrl as fallback to fix origin mismatch');
              iframe.src = roomUrl;
            }
            // try joining again
            await new Promise((res) => setTimeout(res, 300));
            await frame.join({ userName: userName || 'Guest' });
          } catch (retryErr) {
            console.error('Retry join failed:', retryErr);
            throw retryErr;
          }
        }

      } catch (err) {
        if (!mountedRef.current) return;
        console.error('❌ Error initializing call:', err);
        setError('Failed to initialize video call. Please try again.');
        setIsJoining(false);
      }
    };

    initializeCall();

    // Cleanup
    return () => {
      mountedRef.current = false;
      
      const cleanup = async () => {
        if (callFrameRef.current) {
          try {
            await callFrameRef.current.leave();
            await callFrameRef.current.destroy();
            callFrameRef.current = null;
            if (window.__daily_instance__) window.__daily_instance__ = null;
          } catch (err) {
            console.error('Error during cleanup:', err);
          }
        }
      };
      
      cleanup();
    };
  }, [roomUrl, userName, onLeave]);

  // Call duration timer
  useEffect(() => {
    if (!isJoining && callFrameRef.current && mountedRef.current) {
      const timer = setInterval(() => {
        if (mountedRef.current) {
          setCallDuration((prev) => prev + 1);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isJoining]);

  const toggleMute = () => {
    if (callFrameRef.current) {
      callFrameRef.current.setLocalAudio(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (callFrameRef.current) {
      callFrameRef.current.setLocalVideo(!isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const leaveCall = async () => {
    if (callFrameRef.current) {
      try {
        await callFrameRef.current.leave();
      } catch (err) {
        console.error('Error leaving call:', err);
        // Force callback even if leave fails
        if (onLeave) onLeave();
      }
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <Card className="shadow-custom border-danger">
        <Card.Body className="text-center py-5">
          <Alert variant="danger">
            <h5>Video Call Error</h5>
            <p>{error}</p>
            <Button variant="outline-danger" onClick={onLeave}>
              Return to Dashboard
            </Button>
          </Alert>
        </Card.Body>
      </Card>
    );
  }

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
        <div ref={containerRef} style={{ minHeight: '600px' }} />
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