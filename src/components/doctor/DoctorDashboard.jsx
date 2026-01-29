import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert } from 'react-bootstrap';
import { FaCalendarCheck, FaVideo, FaUserInjured, FaSignOutAlt, FaClock } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useAppointments } from '../../context/AppointmentContext';
import Header from '../layout/Header';
import AppointmentQueue from './AppointmentQueue';
import PatientDetailsModal from './PatientDetailsModal';
import VideoRoom from '../video/VideoRoom';
import dailyAPI from '../../utils/dailyAPI';

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const { getDoctorAppointments, startVideoCall } = useAppointments();
  
  const [view, setView] = useState('home'); // home, video
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [videoRoomUrl, setVideoRoomUrl] = useState(null);
  const [activeCall, setActiveCall] = useState(null);

  const myAppointments = getDoctorAppointments(user?.id);
  
  // Filter appointments by status
  const scheduledAppointments = myAppointments.filter(apt => apt.status === 'scheduled');
  const completedAppointments = myAppointments.filter(apt => apt.status === 'completed');
  const urgentAppointments = scheduledAppointments.filter(apt => apt.isUrgent || apt.riskLevel >= 60);

  const handleStartCall = async (appointment) => {
    try {
      // Create Daily.co room
      const room = await dailyAPI.createRoom(`appointment-${appointment.id}`);
      
      // Update appointment with room URL
      startVideoCall(appointment.id, room.url);
      
      setVideoRoomUrl(room.url);
      setActiveCall(appointment);
      setView('video');
    } catch (error) {
      console.error('Error starting video call:', error);
      alert('Failed to start video call. Please try again.');
    }
  };

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const handleLeaveCall = async () => {
    if (activeCall) {
      // Could add logic to save call notes, mark as completed, etc.
    }
    setVideoRoomUrl(null);
    setActiveCall(null);
    setView('home');
  };

  const renderHome = () => (
    <>
      {/* Doctor Info Card */}
      <Card className="shadow-custom mb-4 border-0">
        <Card.Body className="p-4">
          <Row className="align-items-center">
            <Col md={8}>
              <h2 className="h3 mb-2">Welcome, {user?.name}! 👨‍⚕️</h2>
              <p className="text-muted mb-0">
                {user?.specialty} • {user?.experience} experience
              </p>
              <p className="text-muted">
                You have <strong>{scheduledAppointments.length}</strong> appointments scheduled today
              </p>
            </Col>
            <Col md={4} className="text-end">
              <div style={{ fontSize: '6rem' }}>👨‍⚕️</div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="shadow-sm border-0 text-center">
            <Card.Body>
              <FaCalendarCheck size={32} className="text-primary mb-2" />
              <h3 className="mb-0">{scheduledAppointments.length}</h3>
              <small className="text-muted">Scheduled</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm border-0 text-center">
            <Card.Body>
              <FaUserInjured size={32} className="text-danger mb-2" />
              <h3 className="mb-0">{urgentAppointments.length}</h3>
              <small className="text-muted">Urgent Cases</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm border-0 text-center">
            <Card.Body>
              <FaVideo size={32} className="text-success mb-2" />
              <h3 className="mb-0">
                {myAppointments.filter(apt => apt.status === 'in-progress').length}
              </h3>
              <small className="text-muted">In Progress</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm border-0 text-center">
            <Card.Body>
              <FaClock size={32} className="text-info mb-2" />
              <h3 className="mb-0">{completedAppointments.length}</h3>
              <small className="text-muted">Completed Today</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Urgent Cases Alert */}
      {urgentAppointments.length > 0 && (
        <Alert variant="danger" className="mb-4">
          <strong>⚠️ {urgentAppointments.length} Urgent Case(s) Require Attention!</strong>
          <p className="mb-0 mt-2">
            High-risk patients are waiting. Please prioritize these consultations.
          </p>
        </Alert>
      )}

      {/* Appointment Queue */}
      <Row>
        <Col lg={12}>
          <AppointmentQueue
            appointments={scheduledAppointments}
            onStartCall={handleStartCall}
            onViewDetails={handleViewDetails}
          />
        </Col>
      </Row>

      {/* Completed Appointments */}
      {completedAppointments.length > 0 && (
        <Row className="mt-4">
          <Col lg={12}>
            <Card className="shadow-custom">
              <Card.Header className="bg-white">
                <h5 className="mb-0">Recently Completed</h5>
              </Card.Header>
              <Card.Body>
                {completedAppointments.slice(0, 3).map((apt) => (
                  <div key={apt.id} className="mb-2 p-2 bg-light rounded">
                    <Row className="align-items-center">
                      <Col md={6}>
                        <strong>{apt.patientName}</strong>
                        <small className="d-block text-muted">{apt.assessmentData?.symptoms}</small>
                      </Col>
                      <Col md={3}>
                        <small className="text-muted">{apt.date} at {apt.time}</small>
                      </Col>
                      <Col md={3} className="text-end">
                        <Badge bg="success">Completed</Badge>
                      </Col>
                    </Row>
                  </div>
                ))}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Logout Button */}
      <div className="text-center mt-4">
        <Button variant="outline-danger" onClick={logout}>
          <FaSignOutAlt className="me-2" />
          Logout
        </Button>
      </div>
    </>
  );

  const renderVideoCall = () => (
    <>
      <Alert variant="success" className="mb-4">
        <Row className="align-items-center">
          <Col md={8}>
            <strong>Video Consultation:</strong> {activeCall?.patientName}
            <div className="mt-1 small">
              Risk Level: {activeCall?.riskLevel}% | Symptoms: {activeCall?.assessmentData?.symptoms}
            </div>
          </Col>
          <Col md={4} className="text-end">
            <Button
              variant="outline-light"
              size="sm"
              onClick={() => handleViewDetails(activeCall)}
            >
              View Full Assessment
            </Button>
          </Col>
        </Row>
      </Alert>
      
      <VideoRoom
        roomUrl={videoRoomUrl}
        userName={user?.name}
        onLeave={handleLeaveCall}
      />
    </>
  );

  return (
    <>
      <Header />
      <Container fluid className="py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <Container>
          {view === 'home' ? renderHome() : renderVideoCall()}
        </Container>
      </Container>

      {/* Patient Details Modal */}
      <PatientDetailsModal
        show={showDetailsModal}
        onHide={() => setShowDetailsModal(false)}
        appointment={selectedAppointment}
      />
    </>
  );
};

export default DoctorDashboard;