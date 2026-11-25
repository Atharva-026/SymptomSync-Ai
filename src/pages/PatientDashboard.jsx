import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, ListGroup, Alert } from 'react-bootstrap';
import { FaCalendarAlt, FaVideo, FaSignOutAlt, FaRobot } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

import MedicalRecordsDashboard from '../components/medical/MedicalRecordsDashboard';
import ChatAssistant from '../components/chat/ChatAssistant';
import BookingInterface from '../components/patient/BookingInterface';
import VideoRoom from '../components/video/VideoRoom';
import Header from '../components/layout/Header';
import videoService from '../utils/videoService';
import appointmentService from '../services/appointmentService';

const PatientDashboard = () => {
  const { user, logout } = useAuth();

  const [view, setView] = useState('home'); // home | chat | booking | video
  const [activeTab, setActiveTab] = useState('home'); // home | records
  const [myAppointments, setMyAppointments] = useState([]);
  const [bookingContext, setBookingContext] = useState(null);
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [videoRoomUrl, setVideoRoomUrl] = useState(null);

  useEffect(() => {
    if (user) fetchMyAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchMyAppointments = async () => {
    try {
      const appointments = await appointmentService.getAppointments();
      setMyAppointments(appointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const startBooking = (ctx) => {
    setBookingContext(ctx || null);
    setView('booking');
  };

  const handleBookingComplete = () => {
    fetchMyAppointments();
    setView('home');
  };

  const startVideoCall = async (appointment) => {
    try {
      const room = await videoService.createRoom(appointment._id);
      setVideoRoomUrl(room.url);
      setActiveAppointment(appointment);
      setView('video');
    } catch (error) {
      console.error('Error starting video call:', error);
      alert(`Failed to start video call: ${error.message || 'Please try again.'}`);
    }
  };

  const handleLeaveCall = () => {
    setVideoRoomUrl(null);
    setActiveAppointment(null);
    setView('home');
  };

  const renderHome = () => (
    <>
      <Card className="shadow-custom mb-4 border-0">
        <Card.Body className="p-4">
          <Row className="align-items-center">
            <Col md={8}>
              <h2 className="h3 mb-2">Welcome back, {user?.name}!</h2>
              <p className="text-muted mb-3">
                Chat with the AI assistant about your symptoms or reports, or manage your appointments.
              </p>
              <div className="d-flex gap-3 flex-wrap">
                <Button variant="primary" size="lg" onClick={() => setView('chat')}>
                  <FaRobot className="me-2" />
                  Chat with AI Assistant
                </Button>
                <Button variant="success" size="lg" onClick={() => startBooking(null)}>
                  <FaCalendarAlt className="me-2" />
                  Schedule Consultation
                </Button>
              </div>
            </Col>
            <Col md={4} className="text-center d-none d-md-block">
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
                  <Button variant="outline-primary" onClick={() => startBooking(null)}>
                    Book Your First Consultation
                  </Button>
                </div>
              ) : (
                <ListGroup variant="flush">
                  {myAppointments.map((apt) => (
                    <ListGroup.Item key={apt.id || apt._id} className="px-0">
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
                              <FaVideo className="me-1" /> Join Call
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
              <ListGroup.Item action onClick={() => setView('chat')}>
                <FaRobot className="me-2" /> AI Health Chat
              </ListGroup.Item>
              <ListGroup.Item action onClick={() => startBooking(null)}>
                <FaCalendarAlt className="me-2" /> Schedule Consultation
              </ListGroup.Item>
              <ListGroup.Item action onClick={() => setActiveTab('records')}>
                📄 Medical Records
              </ListGroup.Item>
              <ListGroup.Item action onClick={logout}>
                <FaSignOutAlt className="me-2" /> Logout
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </>
  );

  const renderChat = () => (
    <>
      <ChatAssistant onBookAppointment={startBooking} />
      <div className="text-center mt-3">
        <Button variant="link" className="text-muted" onClick={() => setView('home')}>
          Back to Dashboard
        </Button>
      </div>
    </>
  );

  const renderBooking = () => (
    <BookingInterface
      assessmentData={{
        symptoms: bookingContext?.symptoms || '',
        recommendedSpecialty: bookingContext?.recommendedSpecialty,
        bodyPart: null,
        painLevel: null,
        duration: null,
        additionalSymptoms: []
      }}
      riskLevel={bookingContext?.riskLevel || 0}
      onBookingComplete={handleBookingComplete}
    />
  );

  const renderVideoCall = () => (
    <Row>
      <Col lg={12}>
        <Alert variant="success" className="mb-4">
          <strong>Video Consultation:</strong> You're connected with {activeAppointment?.doctorName}
        </Alert>
        <VideoRoom roomUrl={videoRoomUrl} userName={user?.name} onLeave={handleLeaveCall} />
      </Col>
    </Row>
  );

  return (
    <>
      <Header />
      <Container fluid className="py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <Container>
          {view === 'home' && activeTab === 'home' && renderHome()}
          {view === 'home' && activeTab === 'records' && (
            <>
              <Button variant="link" className="mb-3 p-0" onClick={() => setActiveTab('home')}>
                ← Back to Dashboard
              </Button>
              <MedicalRecordsDashboard />
            </>
          )}
          {view === 'chat' && renderChat()}
          {view === 'booking' && renderBooking()}
          {view === 'video' && renderVideoCall()}
        </Container>
      </Container>
    </>
  );
};

export default PatientDashboard;