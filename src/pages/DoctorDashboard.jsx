import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { FaCalendarCheck, FaVideo, FaUserInjured, FaSignOutAlt, FaClock, FaQrcode } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

import Header from '../components/layout/Header';
import AppointmentQueue from '../components/doctor/AppointmentQueue';
import PatientDetailsModal from '../components/doctor/PatientDetailsModal';
import VideoRoom from '../components/video/VideoRoom';
import QRScannerModal from '../components/medical/QRScanner';
import ScannedRecordView from '../components/medical/ScannedRecordView';
import videoService from '../utils/videoService';
import appointmentService from '../services/appointmentService';

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  
  const [view, setView] = useState('home');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [videoRoomUrl, setVideoRoomUrl] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [scannedRecord, setScannedRecord] = useState(null);
  const [showScannedRecord, setShowScannedRecord] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getAppointments();
      setAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCall = async (appointment) => {
    try {
      console.log('🎥 Starting call for appointment:', appointment._id);
      
      // Create unique Daily.co room
      const room = await videoService.createRoom(appointment._id);
      console.log('✅ Room created:', room);
      
      // Update appointment status and room URL in backend
      try {
        await appointmentService.updateAppointment(appointment._id, {
          status: 'in-progress',
          roomUrl: room.url
        });
        console.log('✅ Appointment updated with room URL');
      } catch (updateError) {
        console.warn('⚠️ Could not update appointment, but continuing with call:', updateError);
      }
      
      setVideoRoomUrl(room.url);
      setActiveCall(appointment);
      setView('video');
      
      // Refresh appointments
      await loadAppointments();
      
    } catch (error) {
      console.error('❌ Error starting video call:', error);
      alert(`Failed to start video call: ${error.message || 'Please try again.'}`);
    }
  };

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const handleLeaveCall = async () => {
    if (activeCall) {
      try {
        // Update appointment status
        await appointmentService.updateAppointment(activeCall._id, {
          status: 'completed'
        });
      } catch (error) {
        console.error('Error updating appointment:', error);
      }
    }
    
    setVideoRoomUrl(null);
    setActiveCall(null);
    setView('home');
    await loadAppointments();
  };

  const handleRecordScanned = (recordData) => {
    console.log('📋 Record scanned by doctor:', recordData);
    setScannedRecord(recordData);
    setShowQRScanner(false); // Close QR scanner
    setShowScannedRecord(true); // Show full record view
  };

  // Filter appointments
  const scheduledAppointments = appointments.filter(apt => apt.status === 'scheduled');
  const inProgressAppointments = appointments.filter(apt => apt.status === 'in-progress');
  const completedAppointments = appointments.filter(apt => apt.status === 'completed');
  const urgentAppointments = scheduledAppointments.filter(apt => apt.isUrgent || apt.riskLevel >= 60);

  const renderHome = () => (
    <>
      {/* Doctor Info Card */}
      <Card className="shadow-custom mb-4 border-0">
        <Card.Body className="p-4">
          <Row className="align-items-center">
            <Col md={8}>
              <h2 className="h3 mb-2">Welcome, {user?.name}! 👨‍⚕️</h2>
              <p className="text-muted mb-0">
                {user?.specialty} • {user?.experience}
              </p>
              <p className="text-muted">
                You have <strong>{scheduledAppointments.length}</strong> appointments scheduled
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
              <h3 className="mb-0">{inProgressAppointments.length}</h3>
              <small className="text-muted">In Progress</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm border-0 text-center">
            <Card.Body>
              <FaClock size={32} className="text-info mb-2" />
              <h3 className="mb-0">{completedAppointments.length}</h3>
              <small className="text-muted">Completed</small>
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

      {/* Quick Actions */}
      <div className="mb-4 text-center">
        <Button variant="outline-primary" size="lg" onClick={() => setShowQRScanner(true)}>
          <FaQrcode className="me-2" />
          Scan Patient Medical Record
        </Button>
      </div>

      {/* Appointment Queue */}
      <Row>
        <Col lg={12}>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading appointments...</p>
            </div>
          ) : (
            <AppointmentQueue
              appointments={scheduledAppointments}
              onStartCall={handleStartCall}
              onViewDetails={handleViewDetails}
            />
          )}
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
                  <div key={apt._id} className="mb-2 p-2 bg-light rounded">
                    <Row className="align-items-center">
                      <Col md={6}>
                        <strong>{apt.patient?.name || 'Unknown Patient'}</strong>
                        <small className="d-block text-muted">
                          {apt.assessmentData?.symptoms || 'No symptoms recorded'}
                        </small>
                      </Col>
                      <Col md={3}>
                        <small className="text-muted">
                          {apt.date} at {apt.time}
                        </small>
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
            <strong>Video Consultation:</strong> {activeCall?.patient?.name || 'Patient'}
            <div className="mt-1 small">
              Risk Level: {activeCall?.riskLevel}% | Symptoms: {activeCall?.assessmentData?.symptoms || 'N/A'}
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

      {/* QR Scanner Modal */}
      <QRScannerModal
        show={showQRScanner}
        onHide={() => setShowQRScanner(false)}
        onRecordScanned={handleRecordScanned}
      />

      {/* Scanned Record View Modal */}
      <ScannedRecordView
        show={showScannedRecord}
        onHide={() => setShowScannedRecord(false)}
        recordData={scannedRecord}
      />
    </>
  );
};

export default DoctorDashboard;