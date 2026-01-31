import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { FaUserMd, FaCalendar, FaClock, FaVideo, FaCheckCircle } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useAppointments } from '../../context/AppointmentContext';
import { useAuth } from '../../context/AuthContext';
import doctorService from '../../services/doctorService';
import assessmentService from '../../services/assessmentService';

const BookingInterface = ({ assessmentData, riskLevel, onBookingComplete }) => {
  const { createAppointment } = useAppointments();
  const { user } = useAuth();
  
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [bookingStep, setBookingStep] = useState('select-doctor');
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState('');
  const [savedAssessmentId, setSavedAssessmentId] = useState(null);

  // Fetch doctors on mount
  useEffect(() => {
    fetchDoctors();
    saveAssessment();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const data = await doctorService.getAllDoctors({ available: true });
      setDoctors(data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setError('Failed to load doctors. Please try again.');
    } finally {
      setLoadingDoctors(false);
    }
  };

  const saveAssessment = async () => {
    try {
      const assessment = await assessmentService.createAssessment({
        symptoms: assessmentData.symptoms,
        bodyPart: assessmentData.bodyPart,
        painLevel: assessmentData.painLevel,
        duration: assessmentData.duration,
        additionalSymptoms: assessmentData.additionalSymptoms || [],
        riskLevel: riskLevel,
        isEmergency: riskLevel >= 80
      });
      setSavedAssessmentId(assessment._id);
    } catch (error) {
      console.error('Error saving assessment:', error);
    }
  };

  const timeSlots = {
    morning: ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'],
    afternoon: ['2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'],
    evening: ['5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM']
  };

  const getRecommendedSpecialty = () => {
    const symptoms = assessmentData?.symptoms?.toLowerCase() || '';
    const bodyPart = assessmentData?.bodyPart?.id || '';

    if (bodyPart === 'chest' || symptoms.includes('chest') || symptoms.includes('heart')) {
      return 'Cardiologist';
    }
    if (bodyPart === 'head' || symptoms.includes('head') || symptoms.includes('migraine')) {
      return 'Neurologist';
    }
    return 'General Physician';
  };

  const recommendedSpecialty = getRecommendedSpecialty();

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    setBookingStep('select-time');
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  const handleConfirmBooking = async () => {
    if (!selectedDoctor || !selectedTime) {
      setError('Please select a doctor and time slot');
      return;
    }

    setIsBooking(true);
    setError('');

    try {
      const appointmentData = {
        doctorId: selectedDoctor._id,
        assessmentId: savedAssessmentId,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        isUrgent: riskLevel >= 60,
        riskLevel: riskLevel,
      };

      await createAppointment(appointmentData);

      setIsBooking(false);
      setBookingStep('confirmed');

      if (onBookingComplete) {
        setTimeout(() => {
          onBookingComplete({ doctor: selectedDoctor, date: selectedDate, time: selectedTime });
        }, 2000);
      }
    } catch (error) {
      console.error('Booking error:', error);
      setError(error || 'Failed to book appointment. Please try again.');
      setIsBooking(false);
    }
  };

  const handleBackToAssessment = () => {
    if (onBookingComplete) {
      onBookingComplete(null);
    }
  };

  // Loading state
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

  // Confirmed booking
  if (bookingStep === 'confirmed') {
    return (
      <Card className="shadow-custom fade-in border-success" style={{ borderWidth: '3px' }}>
        <Card.Body className="p-5 text-center">
          <FaCheckCircle size={80} className="text-success mb-4" />
          <h2 className="h3 mb-3">Appointment Confirmed! 🎉</h2>
          <p className="text-muted mb-4">
            Your video consultation has been successfully scheduled
          </p>

          <Card className="bg-light mb-4">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={3} className="text-center">
                  <div style={{ fontSize: '4rem' }}>👨‍⚕️</div>
                </Col>
                <Col md={9}>
                  <h5 className="mb-2">{selectedDoctor.name}</h5>
                  <p className="mb-1 text-muted">{selectedDoctor.specialty}</p>
                  <div className="d-flex align-items-center gap-3 mt-2">
                    <Badge bg="primary">
                      <FaCalendar className="me-1" />
                      {selectedDate.toDateString()}
                    </Badge>
                    <Badge bg="primary">
                      <FaClock className="me-1" />
                      {selectedTime}
                    </Badge>
                    <Badge bg="success">
                      <FaVideo className="me-1" />
                      Video Call
                    </Badge>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Alert variant="info" className="mb-4">
            <strong>📧 Confirmation sent!</strong> We've sent the appointment details to your email. 
            You'll receive a reminder 15 minutes before your consultation.
          </Alert>

          <div className="d-flex gap-3 justify-content-center">
            <Button variant="outline-primary" onClick={handleBackToAssessment}>
              Back to Dashboard
            </Button>
          </div>
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

        {error && <Alert variant="danger">{error}</Alert>}

        {riskLevel >= 60 && (
          <Alert variant="warning" className="mb-4">
            <strong>⚠️ Recommended:</strong> Based on your risk level ({riskLevel}%), 
            we recommend scheduling a consultation within 24 hours.
          </Alert>
        )}

        <Alert variant="info" className="mb-4">
          <strong>💡 AI Recommendation:</strong> Consider seeing a{' '}
          <strong>{recommendedSpecialty}</strong> for your symptoms.
        </Alert>

        <Card className="bg-light mb-4">
          <Card.Body>
            <h6 className="mb-2">Your Assessment Summary:</h6>
            <p className="mb-1 small"><strong>Symptoms:</strong> {assessmentData?.symptoms}</p>
            <p className="mb-1 small"><strong>Location:</strong> {assessmentData?.bodyPart?.name}</p>
            <p className="mb-1 small"><strong>Pain Level:</strong> {assessmentData?.painLevel}/10</p>
            <p className="mb-0 small"><strong>Duration:</strong> {assessmentData?.duration?.amount} {assessmentData?.duration?.unit}</p>
          </Card.Body>
        </Card>

        {bookingStep === 'select-doctor' && (
          <>
            <h5 className="h6 mb-3">Available Doctors ({doctors.length}):</h5>
            {doctors.length === 0 ? (
              <Alert variant="warning">
                No doctors available at the moment. Please try again later.
              </Alert>
            ) : (
              <Row className="g-3">
                {doctors.map((doctor) => (
                  <Col md={6} key={doctor._id}>
                    <Card 
                      className={`cursor-pointer transition-all h-100 ${
                        selectedDoctor?._id === doctor._id 
                          ? 'border-primary shadow' 
                          : 'border-light'
                      }`}
                      style={{ 
                        borderWidth: '2px',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleDoctorSelect(doctor)}
                    >
                      <Card.Body className="p-3">
                        <Row className="align-items-center">
                          <Col xs={3} className="text-center">
                            <div style={{ fontSize: '3rem' }}>👨‍⚕️</div>
                          </Col>
                          <Col xs={9}>
                            <h6 className="mb-1 fw-bold">{doctor.name}</h6>
                            <p className="mb-1 small text-muted">{doctor.specialty}</p>
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <Badge bg="warning" text="dark">
                                ⭐ {doctor.rating || 4.5}
                              </Badge>
                              <span className="small text-muted">{doctor.experience}</span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                              <Badge bg="success">Available</Badge>
                              <small className="text-muted">${doctor.consultationFee || 50}</small>
                            </div>
                          </Col>
                        </Row>
                        {doctor.specialty === recommendedSpecialty && (
                          <div className="mt-2">
                            <Badge bg="primary" className="w-100">
                              ✓ Recommended for your symptoms
                            </Badge>
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
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => setBookingStep('select-doctor')}
                    >
                      Change
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <h5 className="h6 mb-3">
              <FaCalendar className="me-2" />
              Select Date:
            </h5>
            <div className="mb-4">
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                minDate={new Date()}
                inline
                className="form-control"
              />
            </div>

            <h5 className="h6 mb-3">
              <FaClock className="me-2" />
              Select Time Slot:
            </h5>

            <div className="mb-3">
              <small className="text-muted fw-bold">Morning</small>
              <div className="d-flex flex-wrap gap-2 mt-2">
                {timeSlots.morning.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => handleTimeSelect(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <small className="text-muted fw-bold">Afternoon</small>
              <div className="d-flex flex-wrap gap-2 mt-2">
                {timeSlots.afternoon.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => handleTimeSelect(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <small className="text-muted fw-bold">Evening</small>
              <div className="d-flex flex-wrap gap-2 mt-2">
                {timeSlots.evening.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => handleTimeSelect(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>

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
              <Button
                variant="outline-secondary"
                onClick={() => setBookingStep('select-doctor')}
              >
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