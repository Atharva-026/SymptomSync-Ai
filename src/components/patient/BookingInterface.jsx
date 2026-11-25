import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Button, Badge, Alert, Spinner, Form, Collapse } from 'react-bootstrap';
import { FaUserMd, FaCalendar, FaClock, FaVideo, FaCheckCircle, FaFileMedical } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useAppointments } from '../../context/AppointmentContext';
import doctorService from '../../services/doctorService';
import assessmentService from '../../services/assessmentService';
import chatService from '../../services/chatService';
import BriefPreview from './BriefPreview';

const timeSlots = {
  morning: ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'],
  afternoon: ['2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'],
  evening: ['5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM']
};

const BookingInterface = ({ assessmentData, riskLevel, conversationId, onBookingComplete }) => {
  const { createAppointment } = useAppointments();

  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [bookingStep, setBookingStep] = useState('select-doctor');
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState('');

  // Doctor brief: built from the patient's chat, shared only with consent
  const [brief, setBrief] = useState(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState('');
  const [shareBrief, setShareBrief] = useState(false);
  const [showBrief, setShowBrief] = useState(false);
  const [briefWasShared, setBriefWasShared] = useState(false);

  const fetchDoctors = useCallback(async () => {
    try {
      setLoadingDoctors(true);
      const response = await doctorService.getAllDoctors();
      const list = Array.isArray(response) ? response : response?.data || [];
      setDoctors(list);
      if (list.length === 0) setError('No doctors available at the moment. Please try again later.');
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError('Failed to load doctors. Please try again.');
    } finally {
      setLoadingDoctors(false);
    }
  }, []);

  const loadBrief = useCallback(async () => {
    if (!conversationId) return;
    try {
      setBriefLoading(true);
      setBriefError('');
      const res = await chatService.createBrief(conversationId);
      setBrief(res.data);
    } catch (err) {
      setBriefError(err.response?.data?.message || 'Could not prepare the summary.');
    } finally {
      setBriefLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchDoctors();
    loadBrief();
  }, [fetchDoctors, loadBrief]);

  const getRecommendedSpecialty = () => {
    const symptoms = assessmentData?.symptoms?.toLowerCase() || '';
    if (symptoms.includes('chest') || symptoms.includes('heart')) return 'Cardiologist';
    if (symptoms.includes('head') || symptoms.includes('migraine')) return 'Neurologist';
    if (symptoms.includes('stomach') || symptoms.includes('abdom')) return 'Gastroenterologist';
    return 'General Physician';
  };

  const recommendedSpecialty = assessmentData?.recommendedSpecialty || getRecommendedSpecialty();
  const isRecommended = (doctor) =>
    doctor.specialty?.toLowerCase() === recommendedSpecialty.toLowerCase();

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    setBookingStep('select-time');
  };

  const handleConfirmBooking = async () => {
    if (!selectedDoctor || !selectedTime) {
      setError('Please select a doctor and time slot');
      return;
    }

    setIsBooking(true);
    setError('');

    try {
      const sharing = !!(conversationId && shareBrief && brief);
      const hasContext = conversationId || (assessmentData?.symptoms && assessmentData.symptoms.trim());

      let assessmentId;
      if (hasContext) {
        const assessment = await assessmentService.createAssessment({
          symptoms: assessmentData?.symptoms,
          riskLevel: riskLevel || 0,
          isEmergency: (riskLevel || 0) >= 80,
          conversationId: conversationId || undefined,
          shareBrief: sharing
        });
        assessmentId = assessment._id;
      }

      await createAppointment({
        doctorId: selectedDoctor._id,
        assessmentId,
        date: selectedDate.toLocaleDateString('en-CA'), // YYYY-MM-DD in local time
        time: selectedTime,
        isUrgent: (riskLevel || 0) >= 60,
        riskLevel: riskLevel || 0
      });

      setBriefWasShared(sharing);
      setIsBooking(false);
      setBookingStep('confirmed');

      if (onBookingComplete) {
        setTimeout(() => {
          onBookingComplete({ doctor: selectedDoctor, date: selectedDate, time: selectedTime });
        }, 2500);
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError(typeof err === 'string' ? err : err?.message || 'Failed to book appointment. Please try again.');
      setIsBooking(false);
    }
  };

  const handleBackToDashboard = () => {
    if (onBookingComplete) onBookingComplete(null);
  };

  const renderSlots = (label, slots) => (
    <div className="mb-3">
      <small className="text-muted fw-bold">{label}</small>
      <div className="d-flex flex-wrap gap-2 mt-2">
        {slots.map((time) => (
          <Button
            key={time}
            variant={selectedTime === time ? 'primary' : 'outline-primary'}
            size="sm"
            onClick={() => setSelectedTime(time)}
          >
            {time}
          </Button>
        ))}
      </div>
    </div>
  );

  if (loadingDoctors) {
    return (
      <Card className="shadow-custom fade-in">
        <Card.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <p>Loading available doctors...</p>
        </Card.Body>
      </Card>
    );
  }

  if (bookingStep === 'confirmed') {
    return (
      <Card className="shadow-custom fade-in border-success" style={{ borderWidth: '3px' }}>
        <Card.Body className="p-5 text-center">
          <FaCheckCircle size={80} className="text-success mb-4" />
          <h2 className="h3 mb-3">Appointment Confirmed! 🎉</h2>
          <p className="text-muted mb-4">Your video consultation has been successfully scheduled</p>

          <Card className="bg-light mb-4">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={3} className="text-center">
                  <div style={{ fontSize: '4rem' }}>👨‍⚕️</div>
                </Col>
                <Col md={9}>
                  <h5 className="mb-2">{selectedDoctor.name}</h5>
                  <p className="mb-1 text-muted">{selectedDoctor.specialty}</p>
                  <div className="d-flex align-items-center gap-3 mt-2 flex-wrap">
                    <Badge bg="primary"><FaCalendar className="me-1" />{selectedDate.toDateString()}</Badge>
                    <Badge bg="primary"><FaClock className="me-1" />{selectedTime}</Badge>
                    <Badge bg="success"><FaVideo className="me-1" />Video Call</Badge>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {briefWasShared && (
            <Alert variant="success" className="mb-3">
              <FaFileMedical className="me-2" />
              Your chat summary was shared with {selectedDoctor.name}, so you won't need to repeat yourself.
            </Alert>
          )}

          <Alert variant="info" className="mb-4">
            <strong>📧 Confirmation sent!</strong> We've sent the appointment details to your email.
          </Alert>

          <Button variant="outline-primary" onClick={handleBackToDashboard}>
            Back to Dashboard
          </Button>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="shadow-custom fade-in">
      <Card.Body className="p-4">
        <h3 className="h4 mb-3 d-flex align-items-center">
          <FaUserMd className="text-primary me-2" />
          Schedule Doctor Consultation
        </h3>

        {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

        {riskLevel >= 60 && (
          <Alert variant="warning" className="mb-4">
            <strong>⚠️ Recommended:</strong> Based on your risk level ({riskLevel}%), we recommend
            scheduling a consultation within 24 hours.
          </Alert>
        )}

        <Alert variant="info" className="mb-4">
          <strong>💡 AI Recommendation:</strong> Consider seeing a <strong>{recommendedSpecialty}</strong> for your symptoms.
        </Alert>

        {assessmentData?.symptoms && (
          <Card className="bg-light mb-4">
            <Card.Body>
              <h6 className="mb-2">Your concern:</h6>
              <p className="mb-0 small">{assessmentData.symptoms}</p>
            </Card.Body>
          </Card>
        )}

        {bookingStep === 'select-doctor' && (
          <>
            <h5 className="h6 mb-3">Available Doctors ({doctors.length}):</h5>
            {doctors.length === 0 ? (
              <Alert variant="warning">
                <p className="mb-2">No doctors available at the moment.</p>
                <Button variant="outline-warning" size="sm" onClick={fetchDoctors}>
                  🔄 Retry Loading Doctors
                </Button>
              </Alert>
            ) : (
              <Row className="g-3">
                {doctors.map((doctor) => (
                  <Col md={6} key={doctor._id}>
                    <Card
                      className={`h-100 ${selectedDoctor?._id === doctor._id ? 'border-primary shadow' : 'border-light'}`}
                      style={{ borderWidth: '2px', cursor: 'pointer' }}
                      onClick={() => handleDoctorSelect(doctor)}
                    >
                      <Card.Body className="p-3">
                        <Row className="align-items-center">
                          <Col xs={3} className="text-center">
                            <div style={{ fontSize: '3rem' }}>👨‍⚕️</div>
                          </Col>
                          <Col xs={9}>
                            <h6 className="mb-1 fw-bold">{doctor.name}</h6>
                            <p className="mb-1 small text-muted">{doctor.specialty || 'General Physician'}</p>
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <Badge bg="warning" text="dark">⭐ {doctor.rating || 4.5}</Badge>
                              <span className="small text-muted">
                                {doctor.experience ? `${doctor.experience} years` : '5+ years'}
                              </span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                              <Badge bg="success">Available</Badge>
                              <small className="text-muted">${doctor.consultationFee || 50}</small>
                            </div>
                          </Col>
                        </Row>
                        {isRecommended(doctor) && (
                          <div className="mt-2">
                            <Badge bg="primary" className="w-100">✓ Recommended for your symptoms</Badge>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </>
        )}

        {bookingStep === 'select-time' && selectedDoctor && (
          <>
            <Card className="bg-light mb-4">
              <Card.Body className="p-3">
                <Row className="align-items-center">
                  <Col xs={2} className="text-center">
                    <div style={{ fontSize: '2.5rem' }}>👨‍⚕️</div>
                  </Col>
                  <Col xs={8}>
                    <h6 className="mb-0">{selectedDoctor.name}</h6>
                    <small className="text-muted">{selectedDoctor.specialty}</small>
                  </Col>
                  <Col xs={2} className="text-end">
                    <Button variant="outline-secondary" size="sm" onClick={() => setBookingStep('select-doctor')}>
                      Change
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <h5 className="h6 mb-3"><FaCalendar className="me-2" />Select Date:</h5>
            <div className="mb-4">
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                minDate={new Date()}
                inline
                className="form-control"
              />
            </div>

            <h5 className="h6 mb-3"><FaClock className="me-2" />Select Time Slot:</h5>
            {renderSlots('Morning', timeSlots.morning)}
            {renderSlots('Afternoon', timeSlots.afternoon)}
            {renderSlots('Evening', timeSlots.evening)}

            {conversationId && (
              <Card className="bg-light border-0 my-4">
                <Card.Body className="p-3">
                  <div className="d-flex align-items-center mb-2">
                    <FaFileMedical className="text-primary me-2" />
                    <strong>Share a summary of your chat with the doctor</strong>
                  </div>

                  {briefLoading && (
                    <div className="text-muted small">
                      <Spinner size="sm" animation="border" className="me-2" />
                      Preparing your summary...
                    </div>
                  )}

                  {briefError && (
                    <Alert variant="warning" className="py-2 small mb-2">
                      {briefError}{' '}
                      <Button variant="link" size="sm" className="p-0 align-baseline" onClick={loadBrief}>
                        Try again
                      </Button>
                    </Alert>
                  )}

                  {brief && (
                    <>
                      <Form.Check
                        type="checkbox"
                        id="share-brief"
                        checked={shareBrief}
                        onChange={(e) => setShareBrief(e.target.checked)}
                        label="Yes, share this summary with my doctor so I don't have to repeat myself"
                      />
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 mt-2"
                        onClick={() => setShowBrief((v) => !v)}
                      >
                        {showBrief ? 'Hide' : 'Preview'} what will be shared
                      </Button>
                      <Collapse in={showBrief}>
                        <div>
                          <div className="mt-3 p-3 bg-white border rounded">
                            <BriefPreview brief={brief} />
                          </div>
                        </div>
                      </Collapse>
                      <div className="text-muted small mt-2">
                        Only the doctor you book can see it. It is AI-generated from your chat, and the doctor
                        will confirm everything with you.
                      </div>
                    </>
                  )}
                </Card.Body>
              </Card>
            )}

            <Card className="bg-primary text-white mb-4">
              <Card.Body className="p-3">
                <div className="d-flex align-items-center">
                  <FaVideo size={24} className="me-3" />
                  <div>
                    <h6 className="mb-0">Video Consultation</h6>
                    <small>Secure HD video call from anywhere</small>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <div className="d-flex gap-3">
              <Button variant="outline-secondary" onClick={() => setBookingStep('select-doctor')}>
                ← Back
              </Button>
              <Button
                variant="primary"
                className="flex-fill"
                size="lg"
                onClick={handleConfirmBooking}
                disabled={!selectedTime || isBooking}
              >
                {isBooking ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Booking...
                  </>
                ) : (
                  `Confirm Appointment - $${selectedDoctor.consultationFee || 50}`
                )}
              </Button>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default BookingInterface;