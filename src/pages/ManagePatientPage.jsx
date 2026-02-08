// src/pages/ManagePatientPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Tabs, Tab, Badge, Button, Alert } from 'react-bootstrap';
import { 
  FaArrowLeft, FaUser, FaCalendarAlt, FaFileAlt, 
  FaStethoscope, FaPills, FaExclamationTriangle 
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import Header from '../components/layout/Header';
import familyAccessService from '../services/familyAccessService';
import './ManagePatientPage.css';

const ManagePatientPage = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [patientInfo, setPatientInfo] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  
  const [appointments, setAppointments] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);

  useEffect(() => {
    loadPatientData();
  }, [patientId]);

  const loadPatientData = async () => {
    try {
      setLoading(true);

      // Get accessible patients to verify access and get permissions
      const patientsRes = await familyAccessService.getAccessiblePatients();
      const patientAccess = patientsRes.data.patients.find(
        p => p.patientId._id === patientId
      );

      if (!patientAccess) {
        toast.error('You do not have access to this patient');
        navigate('/family-access');
        return;
      }

      setPatientInfo(patientAccess.patientId);
      setPermissions(patientAccess.permissions);

      // Load data based on permissions
      const promises = [];

      if (patientAccess.permissions.manageAppointments) {
        promises.push(
          familyAccessService.getPatientAppointments(patientId)
            .then(res => setAppointments(res.data.appointments || []))
            .catch(err => console.error('Error loading appointments:', err))
        );
      }

      if (patientAccess.permissions.viewAssessments) {
        promises.push(
          familyAccessService.getPatientAssessments(patientId)
            .then(res => setAssessments(res.data.assessments || []))
            .catch(err => console.error('Error loading assessments:', err))
        );
      }

      if (patientAccess.permissions.viewRecords) {
        promises.push(
          familyAccessService.getPatientMedicalRecords(patientId)
            .then(res => setMedicalRecords(res.data.records || []))
            .catch(err => console.error('Error loading records:', err))
        );
      }

      await Promise.all(promises);

    } catch (error) {
      console.error('Error loading patient data:', error);
      toast.error('Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = () => {
    navigate(`/book-appointment?patientId=${patientId}`);
  };

  const handleUploadRecord = () => {
    navigate(`/medical-records/upload?patientId=${patientId}`);
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!patientInfo) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <FaExclamationTriangle className="me-2" />
          Patient not found or access denied
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <Header />
      <Container fluid className="manage-patient-page py-4">
        {/* Back Button */}
        <Button
          variant="outline-secondary"
          className="mb-4"
          onClick={() => navigate('/family-access')}
        >
          <FaArrowLeft className="me-2" />
          Back to Family Access
        </Button>

        {/* Patient Header */}
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <Row className="align-items-center">
              <Col md={8}>
                <div className="d-flex align-items-center">
                  <div 
                    className="patient-avatar me-3"
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '2rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {patientInfo.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="mb-1">{patientInfo.name}</h3>
                    <p className="text-muted mb-0">{patientInfo.email}</p>
                    {patientInfo.phone && (
                      <p className="text-muted mb-0">{patientInfo.phone}</p>
                    )}
                  </div>
                </div>
              </Col>
              <Col md={4} className="text-md-end">
                <Badge bg="success" className="mb-2" style={{ fontSize: '0.9rem' }}>
                  <FaUser className="me-1" />
                  You're managing this patient
                </Badge>
                <div className="mt-2">
                  {patientInfo.dateOfBirth && (
                    <small className="text-muted d-block">
                      Age: {new Date().getFullYear() - new Date(patientInfo.dateOfBirth).getFullYear()} years
                    </small>
                  )}
                  {patientInfo.gender && (
                    <small className="text-muted d-block text-capitalize">
                      Gender: {patientInfo.gender}
                    </small>
                  )}
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Quick Actions */}
        <Row className="mb-4 g-3">
          {permissions.manageAppointments && (
            <Col md={4}>
              <Card 
                className="quick-action-card text-center h-100 cursor-pointer"
                onClick={handleBookAppointment}
              >
                <Card.Body>
                  <FaCalendarAlt className="mb-3" style={{ fontSize: '2.5rem', color: '#0d6efd' }} />
                  <h5>Book Appointment</h5>
                  <p className="text-muted small mb-0">
                    Schedule a doctor consultation
                  </p>
                </Card.Body>
              </Card>
            </Col>
          )}

          {permissions.uploadRecords && (
            <Col md={4}>
              <Card 
                className="quick-action-card text-center h-100 cursor-pointer"
                onClick={handleUploadRecord}
              >
                <Card.Body>
                  <FaFileAlt className="mb-3" style={{ fontSize: '2.5rem', color: '#198754' }} />
                  <h5>Upload Record</h5>
                  <p className="text-muted small mb-0">
                    Add medical documents
                  </p>
                </Card.Body>
              </Card>
            </Col>
          )}

          {permissions.viewAssessments && (
            <Col md={4}>
              <Card 
                className="quick-action-card text-center h-100 cursor-pointer"
                onClick={() => setActiveTab('assessments')}
              >
                <Card.Body>
                  <FaStethoscope className="mb-3" style={{ fontSize: '2.5rem', color: '#dc3545' }} />
                  <h5>View Assessments</h5>
                  <p className="text-muted small mb-0">
                    Check health assessments
                  </p>
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>

        {/* Tabs Section */}
        <Card>
          <Card.Body>
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="mb-4"
            >
              <Tab eventKey="overview" title="Overview">
                <OverviewTab 
                  patientInfo={patientInfo}
                  permissions={permissions}
                  appointments={appointments}
                  assessments={assessments}
                  medicalRecords={medicalRecords}
                />
              </Tab>

              {permissions.manageAppointments && (
                <Tab eventKey="appointments" title={
                  <>
                    Appointments
                    {appointments.length > 0 && (
                      <Badge bg="primary" pill className="ms-2">
                        {appointments.length}
                      </Badge>
                    )}
                  </>
                }>
                  <AppointmentsTab 
                    appointments={appointments}
                    onRefresh={loadPatientData}
                  />
                </Tab>
              )}

              {permissions.viewAssessments && (
                <Tab eventKey="assessments" title={
                  <>
                    Health Assessments
                    {assessments.length > 0 && (
                      <Badge bg="info" pill className="ms-2">
                        {assessments.length}
                      </Badge>
                    )}
                  </>
                }>
                  <AssessmentsTab assessments={assessments} />
                </Tab>
              )}

              {permissions.viewRecords && (
                <Tab eventKey="records" title={
                  <>
                    Medical Records
                    {medicalRecords.length > 0 && (
                      <Badge bg="success" pill className="ms-2">
                        {medicalRecords.length}
                      </Badge>
                    )}
                  </>
                }>
                  <MedicalRecordsTab 
                    records={medicalRecords}
                    permissions={permissions}
                    onRefresh={loadPatientData}
                  />
                </Tab>
              )}

              {permissions.manageMedications && (
                <Tab eventKey="medications" title="Medications">
                  <MedicationsTab patientId={patientId} />
                </Tab>
              )}
            </Tabs>
          </Card.Body>
        </Card>
      </Container>
    </>
  );
};

// Sub-components for each tab
const OverviewTab = ({ patientInfo, permissions, appointments, assessments, medicalRecords }) => {
  return (
    <Row className="g-4">
      <Col md={6}>
        <Card className="h-100">
          <Card.Header className="bg-primary text-white">
            <FaUser className="me-2" />
            Patient Information
          </Card.Header>
          <Card.Body>
            <div className="mb-2">
              <strong>Name:</strong> {patientInfo.name}
            </div>
            <div className="mb-2">
              <strong>Email:</strong> {patientInfo.email}
            </div>
            {patientInfo.phone && (
              <div className="mb-2">
                <strong>Phone:</strong> {patientInfo.phone}
              </div>
            )}
            {patientInfo.dateOfBirth && (
              <div className="mb-2">
                <strong>Date of Birth:</strong>{' '}
                {new Date(patientInfo.dateOfBirth).toLocaleDateString()}
              </div>
            )}
            {patientInfo.gender && (
              <div className="mb-2 text-capitalize">
                <strong>Gender:</strong> {patientInfo.gender}
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>

      <Col md={6}>
        <Card className="h-100">
          <Card.Header className="bg-success text-white">
            <FaStethoscope className="me-2" />
            Your Access Permissions
          </Card.Header>
          <Card.Body>
            {Object.entries(permissions).map(([key, value]) => (
              value && (
                <div key={key} className="mb-2">
                  ✓ {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </div>
              )
            ))}
          </Card.Body>
        </Card>
      </Col>

      <Col md={12}>
        <Card>
          <Card.Header className="bg-info text-white">
            Quick Stats
          </Card.Header>
          <Card.Body>
            <Row className="text-center">
              <Col md={4}>
                <h3>{appointments.length}</h3>
                <p className="text-muted">Appointments</p>
              </Col>
              <Col md={4}>
                <h3>{assessments.length}</h3>
                <p className="text-muted">Assessments</p>
              </Col>
              <Col md={4}>
                <h3>{medicalRecords.length}</h3>
                <p className="text-muted">Medical Records</p>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

const AppointmentsTab = ({ appointments }) => {
  if (appointments.length === 0) {
    return (
      <div className="text-center py-5">
        <FaCalendarAlt style={{ fontSize: '4rem', opacity: 0.3 }} />
        <h4 className="text-muted mt-3">No Appointments Yet</h4>
      </div>
    );
  }

  return (
    <div>
      {/* Display appointments list - integrate with existing appointment components */}
      <p>Appointments will be displayed here</p>
    </div>
  );
};

const AssessmentsTab = ({ assessments }) => {
  if (assessments.length === 0) {
    return (
      <div className="text-center py-5">
        <FaStethoscope style={{ fontSize: '4rem', opacity: 0.3 }} />
        <h4 className="text-muted mt-3">No Assessments Yet</h4>
      </div>
    );
  }

  return (
    <div>
      {/* Display assessments - integrate with existing assessment components */}
      <p>Assessments will be displayed here</p>
    </div>
  );
};

const MedicalRecordsTab = ({ records }) => {
  if (records.length === 0) {
    return (
      <div className="text-center py-5">
        <FaFileAlt style={{ fontSize: '4rem', opacity: 0.3 }} />
        <h4 className="text-muted mt-3">No Medical Records Yet</h4>
      </div>
    );
  }

  return (
    <div>
      {/* Display medical records - integrate with existing records components */}
      <p>Medical records will be displayed here</p>
    </div>
  );
};

const MedicationsTab = ({ patientId }) => {
  return (
    <div className="text-center py-5">
      <FaPills style={{ fontSize: '4rem', opacity: 0.3 }} />
      <h4 className="text-muted mt-3">Medication Management</h4>
      <p className="text-muted">Coming soon...</p>
    </div>
  );
};

export default ManagePatientPage;