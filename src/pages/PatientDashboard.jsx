import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, ListGroup, Alert, Spinner } from 'react-bootstrap';
import { FaCalendarAlt, FaHistory, FaVideo, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useAppointments } from '../context/AppointmentContext';
import ChatInput from '../components/medical/ChatInput';
import BodyDiagram from '../components/medical/BodyDiagram';
import PainScale from '../components/medical/PainScale';
import DurationPicker from '../components/medical/DurationPicker';
import SymptomChecklist from '../components/medical/SymptomChecklist';
import RiskMeter from '../components/medical/RiskMeter';
import RecommendationCard from '../components/medical/RecommendationCard';
import FollowUpQuestions from '../components/medical/FollowUpQuestions';
import EmergencyWarning from '../components/medical/EmergencyWarning';
import BookingInterface from '../components/patient/BookingInterface';
import VideoRoom from '../components/video/VideoRoom';
import Header from '../components/layout/Header';
import tamboService from '../utils/tamboService';
import dailyAPI from '../utils/dailyAPI';

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const { appointments, getPatientAppointments } = useAppointments();
  
  const [view, setView] = useState('home'); // home, assessment, booking, video
  const [currentStep, setCurrentStep] = useState('input');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  
  // Assessment data
  const [symptoms, setSymptoms] = useState('');
  const [bodyPart, setBodyPart] = useState(null);
  const [painLevel, setPainLevel] = useState(null);
  const [duration, setDuration] = useState(null);
  const [additionalSymptoms, setAdditionalSymptoms] = useState([]);
  const [followUpAnswers, setFollowUpAnswers] = useState({});
  const [followUpQuestions, setFollowUpQuestions] = useState([]);
  const [riskLevel, setRiskLevel] = useState(0);
  const [isEmergency, setIsEmergency] = useState(false);
  
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [videoRoomUrl, setVideoRoomUrl] = useState(null);

  const myAppointments = getPatientAppointments(user?.id);

  // Calculate risk level
  useEffect(() => {
    calculateRisk();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [painLevel, duration, bodyPart, additionalSymptoms, followUpAnswers]);

  const calculateRisk = () => {
    let risk = 0;

    if (painLevel) risk += painLevel * 4;
    
    if (duration) {
      if (duration.unit === 'months' || (duration.unit === 'weeks' && duration.amount > 2)) {
        risk += 20;
      } else if (duration.unit === 'weeks') {
        risk += 15;
      } else if (duration.unit === 'days' && duration.amount > 3) {
        risk += 10;
      } else {
        risk += 5;
      }
    }

    if (bodyPart) {
      if (bodyPart.id === 'chest') risk += 20;
      else if (bodyPart.id === 'head') risk += 15;
      else if (bodyPart.id === 'abdomen') risk += 10;
      else risk += 5;
    }

    const highRiskSymptoms = ['Shortness of breath', 'Chest pressure', 'Confusion', 'Vision changes', 'Blood in stool'];
    const hasHighRiskSymptom = additionalSymptoms.some(s => highRiskSymptoms.some(hrs => s.includes(hrs)));
    
    if (hasHighRiskSymptom) {
      risk += 20;
    } else {
      risk += Math.min(additionalSymptoms.length * 3, 15);
    }

    if (followUpAnswers && Object.keys(followUpAnswers).length > 0) {
      Object.entries(followUpAnswers).forEach(([key, value]) => {
        if (value === 'yes' && key.includes('radiation')) risk += 15;
        if (value === 'yes' && key.includes('breathing')) risk += 15;
        if (value === 'yes' && key.includes('worst')) risk += 10;
        if (value === 'yes' && key.includes('sudden')) risk += 10;
      });
    }

    setRiskLevel(Math.min(risk, 100));
  };

  const startAssessment = () => {
    setView('assessment');
    setCurrentStep('input');
    setSymptoms('');
    setBodyPart(null);
    setPainLevel(null);
    setDuration(null);
    setAdditionalSymptoms([]);
    setFollowUpAnswers({});
    setFollowUpQuestions([]);
    setRiskLevel(0);
    setIsEmergency(false);
    setAiMessage('');
    tamboService.reset();
  };

  // ASSESSMENT HANDLERS
  const handleSymptomSubmit = async (input) => {
    setSymptoms(input);
    setIsProcessing(true);
    tamboService.addToHistory('user', input);

    try {
      const aiDecision = await tamboService.getAIResponse(input, {});
      
      if (aiDecision.urgency === 'critical') {
        setIsEmergency(true);
        setCurrentStep('emergency');
        setAiMessage('Emergency symptoms detected! Immediate medical attention required.');
      } else {
        setCurrentStep(aiDecision.nextComponent);
        setAiMessage(aiDecision.aiMessage || '');
      }
    } catch (error) {
      console.error('AI decision error:', error);
      setCurrentStep('body');
      setAiMessage('Please select where you feel discomfort.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBodyPartSelect = async (part) => {
    setBodyPart(part);
    setIsProcessing(true);

    try {
      const aiDecision = await tamboService.getAIResponse(
        `Pain in ${part.name}`,
        { bodyPart: part, symptoms }
      );
      
      setAiMessage(aiDecision.aiMessage || 'Please rate your pain level.');
      
      setTimeout(() => {
        setCurrentStep(aiDecision.nextComponent);
        setIsProcessing(false);
      }, 800);
    } catch (error) {
      console.error('AI decision error:', error);
      setCurrentStep('pain');
      setIsProcessing(false);
    }
  };

  const handlePainSelect = async (level) => {
    setPainLevel(level);
    setIsProcessing(true);

    try {
      const aiDecision = await tamboService.getAIResponse(
        `Pain level ${level}`,
        { bodyPart, painLevel: level, symptoms }
      );
      
      setAiMessage(aiDecision.aiMessage || 'When did this symptom start?');
      
      setTimeout(() => {
        setCurrentStep(aiDecision.nextComponent);
        setIsProcessing(false);
      }, 800);
    } catch (error) {
      console.error('AI decision error:', error);
      setCurrentStep('duration');
      setIsProcessing(false);
    }
  };

  const handleDurationSelect = async (dur) => {
    setDuration(dur);
    setIsProcessing(true);

    try {
      const context = { bodyPart, painLevel, duration: dur, symptoms };
      await tamboService.getAIResponse(`Duration: ${dur.amount} ${dur.unit}`, context);

      if (tamboService.needsMoreInfo(context)) {
        const questions = tamboService.generateFollowUpQuestions(context);
        setFollowUpQuestions(questions);
        setCurrentStep('followup');
        setAiMessage('AI has generated specific questions to better assess your condition.');
      } else {
        setCurrentStep('symptoms');
        setAiMessage('Select any additional symptoms you\'re experiencing.');
      }
      
      setIsProcessing(false);
    } catch (error) {
      console.error('AI decision error:', error);
      setCurrentStep('symptoms');
      setIsProcessing(false);
    }
  };

  const handleSymptomsSelect = (symptomsArray) => {
    setAdditionalSymptoms(symptomsArray);
  };

  const handleFollowUpComplete = (answers) => {
    setFollowUpAnswers(answers);
    
    const criticalAnswers = [
      answers['chest-radiation'],
      answers['chest-breathing'],
      answers['head-worst'],
      answers['head-sudden']
    ];
    
    const hasCriticalYes = criticalAnswers.filter(a => a === 'yes').length >= 2;

    if (hasCriticalYes) {
      setIsEmergency(true);
      setCurrentStep('emergency');
      setAiMessage('Based on your responses, you need immediate medical attention!');
    } else {
      setCurrentStep('symptoms');
      setAiMessage('Now let\'s check for any additional symptoms.');
    }
  };

  const handleEmergencyAcknowledge = () => {
    setCurrentStep('recommendation');
  };

  const handleContinueToRecommendation = () => {
    setCurrentStep('recommendation');
  };

  const getRecommendation = () => {
    if (isEmergency || riskLevel >= 80) {
      return {
        severity: 'emergency',
        title: '🚨 EMERGENCY - Seek Immediate Care',
        description: 'Your symptoms indicate a potentially serious condition that requires immediate medical attention.',
        actions: [
          'Call 911 or go to nearest emergency room immediately',
          'Do NOT drive yourself - call ambulance or have someone drive you',
          'Have someone stay with you until help arrives',
          'Bring list of current medications and medical history'
        ],
        tips: []
      };
    } else if (riskLevel >= 60) {
      return {
        severity: 'high',
        title: 'Seek Medical Attention Within 24 Hours',
        description: 'Your symptoms warrant prompt professional evaluation by a healthcare provider.',
        actions: [
          'Schedule urgent care or doctor appointment today',
          'Monitor symptoms closely for any worsening',
          'Note any changes or new symptoms that develop',
          'Avoid strenuous physical activity',
          'Keep emergency contact information handy'
        ],
        tips: [
          'Rest in a comfortable position',
          'Stay well hydrated with water',
          'Keep your phone nearby',
          'Have someone check on you regularly',
          'Avoid alcohol and unnecessary medications'
        ]
      };
    } else if (riskLevel >= 40) {
      return {
        severity: 'moderate',
        title: 'Monitor and Consider Medical Consultation',
        description: 'Your symptoms should be evaluated by a doctor if they persist or worsen over the next 24-48 hours.',
        actions: [
          'Monitor symptoms for 24-48 hours',
          'See your doctor if no improvement or worsening occurs',
          'Keep a symptom diary noting changes',
          'Note any triggers or patterns you observe',
          'Seek care sooner if symptoms intensify'
        ],
        tips: [
          'Get adequate rest and sleep',
          'Stay well hydrated throughout the day',
          'Over-the-counter pain relief may help (follow label directions)',
          'Avoid known triggers if identified',
          'Light, gentle activity as tolerated',
          'Eat balanced, nutritious meals'
        ]
      };
    } else {
      return {
        severity: 'low',
        title: 'Self-Care Recommended',
        description: 'Your symptoms appear mild and may improve with self-care measures and rest.',
        actions: [
          'Continue monitoring your symptoms',
          'Use appropriate home remedies',
          'See a doctor if symptoms persist beyond 7 days',
          'Watch for any worsening of symptoms',
          'Return to normal activities as you feel able'
        ],
        tips: [
          'Get plenty of rest and relaxation',
          'Maintain proper hydration',
          'Eat a healthy, balanced diet',
          'Engage in light exercise as tolerated',
          'Practice stress management techniques',
          'Maintain good sleep hygiene'
        ]
      };
    }
  };

  const handleBookingComplete = (appointment) => {
    if (appointment) {
      setActiveAppointment(appointment);
      // If moderate or high risk, show booking option
      if (riskLevel >= 40) {
        setView('booking');
      } else {
        setView('home');
      }
    } else {
      setView('home');
    }
  };

  const startVideoCall = async (appointment) => {
    try {
      const room = await dailyAPI.createRoom(`appointment-${appointment.id}`);
      setVideoRoomUrl(room.url);
      setActiveAppointment(appointment);
      setView('video');
    } catch (error) {
      console.error('Error starting video call:', error);
      alert('Failed to start video call. Please try again.');
    }
  };

  const handleLeaveCall = () => {
    setVideoRoomUrl(null);
    setActiveAppointment(null);
    setView('home');
  };

  const getProgressPercentage = () => {
    const componentOrder = ['input', 'body', 'pain', 'duration', 'followup', 'symptoms', 'recommendation'];
    const currentIndex = componentOrder.indexOf(currentStep);
    if (currentIndex === -1) return 0;
    return ((currentIndex + 1) / componentOrder.length) * 100;
  };

  // RENDER FUNCTIONS
  const renderHome = () => (
    <>
      <Card className="shadow-custom mb-4 border-0">
        <Card.Body className="p-4">
          <Row className="align-items-center">
            <Col md={8}>
              <h2 className="h3 mb-2">Welcome back, {user?.name}! 👋</h2>
              <p className="text-muted mb-3">
                How are you feeling today? Start a symptom assessment or manage your appointments.
              </p>
              <Button variant="primary" size="lg" onClick={startAssessment}>
                🩺 Start New Assessment
              </Button>
            </Col>
            <Col md={4} className="text-center">
              <div style={{ fontSize: '8rem' }}>🏥</div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row>
        <Col md={8}>
          <Card className="shadow-custom mb-4">
            <Card.Header className="bg-white">
              <h5 className="mb-0">
                <FaCalendarAlt className="me-2 text-primary" />
                Upcoming Appointments
              </h5>
            </Card.Header>
            <Card.Body>
              {myAppointments.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <FaCalendarAlt size={48} className="mb-3 opacity-50" />
                  <p>No appointments scheduled</p>
                  <Button variant="outline-primary" onClick={startAssessment}>
                    Book Your First Consultation
                  </Button>
                </div>
              ) : (
                <ListGroup variant="flush">
                  {myAppointments.map((apt) => (
                    <ListGroup.Item key={apt.id} className="px-0">
                      <Row className="align-items-center">
                        <Col md={7}>
                          <h6 className="mb-1">{apt.doctorName}</h6>
                          <small className="text-muted">{apt.doctorSpecialty}</small>
                          <div className="mt-2">
                            <Badge bg="primary" className="me-2">{apt.date}</Badge>
                            <Badge bg="info">{apt.time}</Badge>
                          </div>
                        </Col>
                        <Col md={5} className="text-end">
                          <Badge bg={apt.status === 'scheduled' ? 'success' : 'secondary'} className="mb-2">
                            {apt.status}
                          </Badge>
                          <div>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => startVideoCall(apt)}
                              disabled={apt.status !== 'scheduled'}
                            >
                              <FaVideo className="me-1" />
                              Join Call
                            </Button>
                          </div>
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-custom mb-4">
            <Card.Header className="bg-white">
              <h6 className="mb-0">Quick Actions</h6>
            </Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item action onClick={startAssessment}>
                🩺 New Symptom Check
              </ListGroup.Item>
              <ListGroup.Item action>
                <FaHistory className="me-2" />
                Assessment History
              </ListGroup.Item>
              <ListGroup.Item action>
                📄 Medical Records
              </ListGroup.Item>
              <ListGroup.Item action onClick={logout}>
                <FaSignOutAlt className="me-2" />
                Logout
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </>
  );

  const renderAssessment = () => (
    <>
      {isProcessing && (
        <Alert variant="info" className="d-flex align-items-center fade-in mb-4">
          <Spinner animation="border" size="sm" className="me-2" />
          <span>🤖 AI is analyzing your symptoms...</span>
        </Alert>
      )}

      {aiMessage && !isProcessing && currentStep !== 'input' && currentStep !== 'emergency' && (
        <Alert variant="primary" className="fade-in mb-4">
          <strong>💡 AI Insight:</strong> {aiMessage}
        </Alert>
      )}

      <Row>
        <Col lg={8}>
          <div className="mb-4">
            {currentStep !== 'input' && currentStep !== 'emergency' && (
              <div className="mb-4">
                <small className="text-muted">Assessment Progress (AI-Guided)</small>
                <div className="progress" style={{ height: '8px' }}>
                  <div 
                    className="progress-bar progress-bar-striped progress-bar-animated bg-primary" 
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
              </div>
            )}

            {currentStep === 'input' && (
              <ChatInput onSubmit={handleSymptomSubmit} />
            )}

            {currentStep === 'emergency' && (
              <EmergencyWarning 
                symptoms={symptoms}
                onAcknowledge={handleEmergencyAcknowledge}
              />
            )}

            {currentStep === 'body' && (
              <>
                <div className="mb-3">
                  <Card className="bg-light">
                    <Card.Body className="py-2">
                      <p className="mb-0 small">
                        <strong>Symptoms:</strong> {symptoms}
                      </p>
                    </Card.Body>
                  </Card>
                </div>
                <BodyDiagram onSelect={handleBodyPartSelect} />
              </>
            )}

            {currentStep === 'pain' && (
              <>
                <div className="mb-3">
                  <Card className="bg-light">
                    <Card.Body className="py-2">
                      <p className="mb-1 small"><strong>Symptoms:</strong> {symptoms}</p>
                      <p className="mb-0 small"><strong>Location:</strong> {bodyPart?.emoji} {bodyPart?.name}</p>
                    </Card.Body>
                  </Card>
                </div>
                <PainScale onSelect={handlePainSelect} />
              </>
            )}

            {currentStep === 'duration' && (
              <>
                <div className="mb-3">
                  <Card className="bg-light">
                    <Card.Body className="py-2">
                      <p className="mb-1 small"><strong>Symptoms:</strong> {symptoms}</p>
                      <p className="mb-1 small"><strong>Location:</strong> {bodyPart?.emoji} {bodyPart?.name}</p>
                      <p className="mb-0 small"><strong>Pain Level:</strong> {painLevel}/10</p>
                    </Card.Body>
                  </Card>
                </div>
                <DurationPicker onSelect={handleDurationSelect} />
              </>
            )}

            {currentStep === 'followup' && (
              <>
                <div className="mb-3">
                  <Alert variant="info">
                    <strong>🤖 AI has generated specific questions</strong> based on your symptoms to better assess your condition.
                  </Alert>
                </div>
                <FollowUpQuestions 
                  questions={followUpQuestions}
                  onComplete={handleFollowUpComplete}
                />
              </>
            )}

            {currentStep === 'symptoms' && (
              <>
                <div className="mb-3">
                  <Card className="bg-light">
                    <Card.Body className="py-2">
                      <p className="mb-1 small"><strong>Symptoms:</strong> {symptoms}</p>
                      <p className="mb-1 small"><strong>Location:</strong> {bodyPart?.emoji} {bodyPart?.name}</p>
                      <p className="mb-1 small"><strong>Pain Level:</strong> {painLevel}/10</p>
                      <p className="mb-0 small"><strong>Duration:</strong> {duration?.amount} {duration?.unit}</p>
                    </Card.Body>
                  </Card>
                </div>
                <SymptomChecklist 
                  onSelect={handleSymptomsSelect}
                  primarySymptom={bodyPart}
                />
                <div className="text-center mt-4">
                  <Button 
                    variant="primary" 
                    size="lg"
                    onClick={handleContinueToRecommendation}
                  >
                    Continue to AI-Generated Results
                  </Button>
                </div>
              </>
            )}

            {currentStep === 'recommendation' && (
              <>
                <div className="mb-4">
                  <Card className="bg-light border-primary" style={{ borderWidth: '2px' }}>
                    <Card.Body>
                      <h5 className="h6 mb-3"><strong>📋 AI Assessment Summary</strong></h5>
                      <p className="mb-1 small"><strong>Symptoms:</strong> {symptoms}</p>
                      <p className="mb-1 small"><strong>Location:</strong> {bodyPart?.emoji} {bodyPart?.name}</p>
                      <p className="mb-1 small"><strong>Pain Level:</strong> {painLevel}/10</p>
                      <p className="mb-1 small"><strong>Duration:</strong> {duration?.amount} {duration?.unit}</p>
                      {additionalSymptoms.length > 0 && (
                        <p className="mb-1 small"><strong>Additional Symptoms:</strong> {additionalSymptoms.join(', ')}</p>
                      )}
                      <p className="mb-0 small"><strong>AI Risk Assessment:</strong> {riskLevel}%</p>
                    </Card.Body>
                  </Card>
                </div>

                <Alert variant="success" className="mb-4">
                  <strong>🤖 AI Analysis Complete:</strong> Your personalized care plan has been generated.
                </Alert>

                <RecommendationCard {...getRecommendation()} />

                {riskLevel >= 40 && (
                  <div className="text-center mt-4">
                    <Button variant="success" size="lg" onClick={() => setView('booking')}>
                      📅 Schedule Doctor Consultation
                    </Button>
                  </div>
                )}

                <div className="text-center mt-3">
                  <Button variant="outline-primary" onClick={() => setView('home')}>
                    Back to Dashboard
                  </Button>
                </div>
              </>
            )}

            <div className="text-center mt-4">
              <Button variant="outline-secondary" onClick={() => setView('home')}>
                Cancel Assessment
              </Button>
            </div>
          </div>
        </Col>
        
        <Col lg={4}>
          {(painLevel || bodyPart || duration) && 
           currentStep !== 'input' && 
           currentStep !== 'recommendation' && 
           currentStep !== 'emergency' && (
            <RiskMeter riskLevel={riskLevel} />
          )}
        </Col>
      </Row>
    </>
  );

  const renderBooking = () => (
    <BookingInterface 
      assessmentData={{
        symptoms,
        bodyPart,
        painLevel,
        duration,
        additionalSymptoms
      }}
      riskLevel={riskLevel}
      onBookingComplete={handleBookingComplete}
    />
  );

  const renderVideoCall = () => (
    <Row>
      <Col lg={12}>
        <Alert variant="success" className="mb-4">
          <strong>Video Consultation:</strong> You're connected with {activeAppointment?.doctorName}
        </Alert>
        
        <VideoRoom
          roomUrl={videoRoomUrl}
          userName={user?.name}
          onLeave={handleLeaveCall}
        />
      </Col>
    </Row>
  );

  // MAIN RENDER
  return (
    <>
      <Header />
      <Container fluid className="py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <Container>
          {view === 'home' && renderHome()}
          {view === 'assessment' && renderAssessment()}
          {view === 'booking' && renderBooking()}
          {view === 'video' && renderVideoCall()}
        </Container>
      </Container>
    </>
  );
};

export default PatientDashboard;