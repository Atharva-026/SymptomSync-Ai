import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, ListGroup, Alert } from 'react-bootstrap';
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
import BookingInterface from '../components/patient/BookingInterface';
import VideoRoom from '../components/video/VideoRoom';
import Header from '../components/layout/Header';
import dailyAPI from '../utils/dailyAPI';

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const { appointments, getPatientAppointments } = useAppointments();
  
  const [view, setView] = useState('home'); // home, assessment, booking, video
  const [currentStep, setCurrentStep] = useState('input');
  const [assessmentData, setAssessmentData] = useState({});
  const [riskLevel, setRiskLevel] = useState(0);
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [videoRoomUrl, setVideoRoomUrl] = useState(null);

  const myAppointments = getPatientAppointments(user?.id);

  const startAssessment = () => {
    setView('assessment');
    setCurrentStep('input');
    setAssessmentData({});
    setRiskLevel(0);
  };

  const handleAssessmentComplete = (data, risk) => {
    setAssessmentData(data);
    setRiskLevel(risk);
    
    // If moderate or high risk, suggest booking
    if (risk >= 40) {
      setView('booking');
    }
  };

  const handleBookingComplete = (appointment) => {
    if (appointment) {
      setActiveAppointment(appointment);
      setView('home');
    } else {
      setView('home');
    }
  };

  const startVideoCall = async (appointment) => {
    try {
      // Create Daily.co room
      const room = await dailyAPI.createRoom(`appointment-${appointment.id}`);
      const token = await dailyAPI.createMeetingToken(room.name, user.name, false);
      
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

  // Render different views
  const renderView = () => {
    switch (view) {
      case 'assessment':
        return renderAssessment();
      case 'booking':
        return <BookingInterface 
          assessmentData={assessmentData}
          riskLevel={riskLevel}
          onBookingComplete={handleBookingComplete}
        />;
      case 'video':
        return renderVideoCall();
      default:
        return renderHome();
    }
  };

  const renderHome = () => (
    <>
      {/* Welcome Card */}
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

      {/* Upcoming Appointments */}
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
                            <Badge bg="primary" className="me-2">
                              {apt.date}
                            </Badge>
                            <Badge bg="info">{apt.time}</Badge>
                          </div>
                        </Col>
                        <Col md={5} className="text-end">
                          <Badge 
                            bg={apt.status === 'scheduled' ? 'success' : 'secondary'}
                            className="mb-2"
                          >
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

        {/* Quick Actions */}
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

  const renderAssessment = () => {
    // Similar to your existing assessment flow
    // I'll provide a simplified version
    return (
      <Row>
        <Col lg={8}>
          <Card className="shadow-custom">
            <Card.Body className="p-4">
              <h4 className="mb-4">AI-Powered Symptom Assessment</h4>
              {/* Add your existing assessment components here */}
              <ChatInput onSubmit={(symptoms) => {
                setAssessmentData({ ...assessmentData, symptoms });
                setCurrentStep('body');
              }} />
              
              <div className="text-center mt-4">
                <Button variant="outline-secondary" onClick={() => setView('home')}>
                  Cancel Assessment
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          {riskLevel > 0 && <RiskMeter riskLevel={riskLevel} />}
        </Col>
      </Row>
    );
  };

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

  return (
    <>
      <Header />
      <Container fluid className="py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <Container>
          {renderView()}
        </Container>
      </Container>
    </>
  );
};

export default PatientDashboard;