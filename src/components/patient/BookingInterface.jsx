import React, { useState } from 'react';
import { Card, Row, Col, Button, Badge, Form, Alert } from 'react-bootstrap';
import { FaUserMd, FaCalendar, FaClock, FaVideo, FaCheckCircle } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useAppointments } from '../../context/AppointmentContext';
import { useAuth } from '../../context/AuthContext';

const BookingInterface = ({ assessmentData, riskLevel, onBookingComplete }) => {
  const { createAppointment } = useAppointments();
  const { user } = useAuth();
  
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [isUrgent, setIsUrgent] = useState(riskLevel >= 60);
  const [bookingStep, setBookingStep] = useState('select-doctor'); // select-doctor, select-time, confirm
  const [isBooking, setIsBooking] = useState(false);

  // Mock doctor data
  const doctors = [
    {
      id: 'doctor-001',
      name: 'Dr. Sarah Johnson',
      specialty: 'General Physician',
      rating: 4.8,
      experience: '12 years',
      available: 'Today',
      image: '👩‍⚕️',
      nextAvailable: '2:00 PM',
      consultationFee: '$50'
    },
    {
      id: 'doctor-002',
      name: 'Dr. Michael Chen',
      specialty: 'Cardiologist',
      rating: 4.9,
      experience: '15 years',
      available: 'Today',
      image: '👨‍⚕️',
      nextAvailable: '3:30 PM',
      consultationFee: '$80'
    },
    {
      id: 'doctor-003',
      name: 'Dr. Emily Rodriguez',
      specialty: 'Neurologist',
      rating: 4.7,
      experience: '10 years',
      available: 'Tomorrow',
      image: '👩‍⚕️',
      nextAvailable: '10:00 AM',
      consultationFee: '$75'
    },
    {
      id: 'doctor-004',
      name: 'Dr. James Wilson',
      specialty: 'Internal Medicine',
      rating: 4.6,
      experience: '8 years',
      available: 'Today',
      image: '👨‍⚕️',
      nextAvailable: '4:00 PM',
      consultationFee: '$60'
    }
  ];

  // Available time slots
  const timeSlots = {
    morning: ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'],
    afternoon: ['2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'],
    evening: ['5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM']
  };

  // Get recommended specialty based on symptoms
  const getRecommendedSpecialty = () => {
    const symptoms = assessmentData?.symptoms?.toLowerCase() || '';
    const bodyPart = assessmentData?.bodyPart?.id || '';

    if (bodyPart === 'chest' || symptoms.includes('chest') || symptoms.includes('heart')) {
      return 'Cardiologist';
    }
    if (bodyPart === 'head' || symptoms.includes('head') || symptoms.includes('migraine')) {
      return 'Neurologist';
    }
    if (bodyPart === 'abdomen' || symptoms.includes('stomach') || symptoms.includes('digestive')) {
      return 'Gastroenterologist';
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
      alert('Please select a doctor and time slot');
      return;
    }

    setIsBooking(true);

    try {
      // Create appointment
      const appointment = createAppointment({
        patientId: user.id,
        patientName: user.name,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        doctorSpecialty: selectedDoctor.specialty,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        assessmentData: assessmentData,
        riskLevel: riskLevel,
        isUrgent: isUrgent,
        consultationType: 'video',
      });

      // Simulate booking delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      setIsBooking(false);
      setBookingStep('confirmed');

      // Notify parent component
      if (onBookingComplete) {
        onBookingComplete(appointment);
      }
    } catch (error) {
      console.error('Booking error:', error);
      setIsBooking(false);
      alert('Failed to book appointment. Please try again.');
    }
  };

  const handleBackToAssessment = () => {
    if (onBookingComplete) {
      onBookingComplete(null);
    }
  };

  // Render confirmed booking
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
                  <div style={{ fontSize: '4rem' }}>{selectedDoctor.image}</div>
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
            <Button variant="primary" size="lg">
              Add to Calendar
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

        {/* Risk Level Alert */}
        {riskLevel >= 60 && (
          <Alert variant="warning" className="mb-4">
            <strong>⚠️ Recommended:</strong> Based on your risk level ({riskLevel}%), 
            we recommend scheduling a consultation within 24 hours.
          </Alert>
        )}

        {/* AI Recommendation */}
        <Alert variant="info" className="mb-4">
          <strong>💡 AI Recommendation:</strong> Consider seeing a{' '}
          <strong>{recommendedSpecialty}</strong> for your symptoms.
          {isUrgent && <div className="mt-2"><Badge bg="danger">Urgent Care Recommended</Badge></div>}
        </Alert>

        {/* Assessment Summary */}
        <Card className="bg-light mb-4">
          <Card.Body>
            <h6 className="mb-2">Your Assessment Summary:</h6>
            <p className="mb-1 small"><strong>Symptoms:</strong> {assessmentData?.symptoms}</p>
            <p className="mb-1 small"><strong>Location:</strong> {assessmentData?.bodyPart?.name}</p>
            <p className="mb-1 small"><strong>Pain Level:</strong> {assessmentData?.painLevel}/10</p>
            <p className="mb-0 small"><strong>Duration:</strong> {assessmentData?.duration?.amount} {assessmentData?.duration?.unit}</p>
          </Card.Body>
        </Card>

        {/* Step 1: Select Doctor */}
        {bookingStep === 'select-doctor' && (
          <>
            <h5 className="h6 mb-3">Select a Doctor:</h5>
            <Row className="g-3">
              {doctors.map((doctor) => (
                <Col md={6} key={doctor.id}>
                  <Card 
                    className={`cursor-pointer transition-all h-100 ${
                      selectedDoctor?.id === doctor.id 
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
                          <div style={{ fontSize: '3rem' }}>{doctor.image}</div>
                        </Col>
                        <Col xs={9}>
                          <h6 className="mb-1 fw-bold">{doctor.name}</h6>
                          <p className="mb-1 small text-muted">{doctor.specialty}</p>
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <Badge bg="warning" text="dark">
                              ⭐ {doctor.rating}
                            </Badge>
                            <span className="small text-muted">{doctor.experience}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <Badge bg={doctor.available === 'Today' ? 'success' : 'info'}>
                              {doctor.available}
                            </Badge>
                            <small className="text-muted">{doctor.consultationFee}</small>
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
          </>
        )}

        {/* Step 2: Select Date & Time */}
        {bookingStep === 'select-time' && selectedDoctor && (
          <>
            <Card className="bg-light mb-4">
              <Card.Body className="p-3">
                <Row className="align-items-center">
                  <Col xs={2} className="text-center">
                    <div style={{ fontSize: '2.5rem' }}>{selectedDoctor.image}</div>
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

            {/* Morning Slots */}
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

            {/* Afternoon Slots */}
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

            {/* Evening Slots */}
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

            {/* Consultation Type */}
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

            {/* Action Buttons */}
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
                {isBooking ? 'Booking...' : `Confirm Appointment - ${selectedDoctor.consultationFee}`}
              </Button>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default BookingInterface;