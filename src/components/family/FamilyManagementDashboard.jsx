// src/components/family/FamilyManagementDashboard.jsx

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Tabs, Tab } from 'react-bootstrap';
import { FaUserFriends, FaUserPlus, FaUserCog, FaBell } from 'react-icons/fa';
import { toast } from 'react-toastify';
import FamilyMembersList from './FamilyMembersList';
import InviteFamilyModal from './InviteFamilyModal';
import PendingInvitations from './PendingInvitations';
import PatientAccessList from './PatientAccessList';
import familyAccessService from '../../services/familyAccessService';
import './FamilyManagementDashboard.css';

const FamilyManagementDashboard = () => {
  const [activeTab, setActiveTab] = useState('members');
  const [familyMembers, setFamilyMembers] = useState([]);
  const [accessiblePatients, setAccessiblePatients] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    pendingInvites: 0,
    patientsICanAccess: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [membersRes, patientsRes, invitationsRes] = await Promise.all([
        familyAccessService.getFamilyMembers(),
        familyAccessService.getAccessiblePatients(),
        familyAccessService.getPendingInvitations()
      ]);

      setFamilyMembers(membersRes.data.familyMembers || []);
      setAccessiblePatients(patientsRes.data.patients || []);
      setPendingInvitations(invitationsRes.data.invitations || []);

      // Calculate stats
      const activeMembers = membersRes.data.familyMembers.filter(
        fm => fm.status === 'accepted'
      ).length;

      setStats({
        totalMembers: membersRes.data.familyMembers.length,
        activeMembers,
        pendingInvites: invitationsRes.data.invitations.length,
        patientsICanAccess: patientsRes.data.patients.length
      });

    } catch (error) {
      console.error('Error loading family data:', error);
      toast.error('Failed to load family access data');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSuccess = () => {
    setShowInviteModal(false);
    loadData();
    toast.success('Family member invited successfully!');
  };

  const handleAcceptInvitation = async (patientId) => {
    try {
      await familyAccessService.respondToInvitation(patientId, 'accept');
      toast.success('Invitation accepted!');
      loadData();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation');
    }
  };

  const handleRejectInvitation = async (patientId) => {
    try {
      await familyAccessService.respondToInvitation(patientId, 'reject');
      toast.success('Invitation rejected');
      loadData();
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      toast.error('Failed to reject invitation');
    }
  };

  const handleRevokeAccess = async (familyMemberId) => {
    if (!window.confirm('Are you sure you want to revoke access for this family member?')) {
      return;
    }

    try {
      await familyAccessService.revokeFamilyAccess(familyMemberId);
      toast.success('Access revoked successfully');
      loadData();
    } catch (error) {
      console.error('Error revoking access:', error);
      toast.error('Failed to revoke access');
    }
  };

  const handleUpdatePermissions = async (familyMemberId, permissions) => {
    try {
      await familyAccessService.updatePermissions(familyMemberId, permissions);
      toast.success('Permissions updated successfully');
      loadData();
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast.error('Failed to update permissions');
    }
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="family-management-dashboard py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-2">
                <FaUserFriends className="me-2" />
                Family Access Management
              </h2>
              <p className="text-muted mb-0">
                Manage family members and caregivers who can help with your healthcare
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowInviteModal(true)}
            >
              <FaUserPlus className="me-2" />
              Invite Family Member
            </Button>
          </div>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4 g-3">
        <Col md={3}>
          <Card className="stats-card h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Total Family Members</p>
                  <h3 className="mb-0">{stats.totalMembers}</h3>
                </div>
                <div className="stats-icon bg-primary-soft">
                  <FaUserFriends />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="stats-card h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Active Members</p>
                  <h3 className="mb-0">{stats.activeMembers}</h3>
                </div>
                <div className="stats-icon bg-success-soft">
                  <FaUserCog />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="stats-card h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Pending Invitations</p>
                  <h3 className="mb-0">{stats.pendingInvites}</h3>
                </div>
                <div className="stats-icon bg-warning-soft">
                  <FaBell />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="stats-card h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Patients I Manage</p>
                  <h3 className="mb-0">{stats.patientsICanAccess}</h3>
                </div>
                <div className="stats-icon bg-info-soft">
                  <FaUserFriends />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabs Section */}
      <Card>
        <Card.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-4"
          >
            <Tab eventKey="members" title={
              <>
                My Family Members {familyMembers.length > 0 && 
                  <Badge bg="primary" pill className="ms-2">{familyMembers.length}</Badge>
                }
              </>
            }>
              <FamilyMembersList
                familyMembers={familyMembers}
                onRevokeAccess={handleRevokeAccess}
                onUpdatePermissions={handleUpdatePermissions}
                onRefresh={loadData}
              />
            </Tab>

            <Tab eventKey="invitations" title={
              <>
                Pending Invitations {pendingInvitations.length > 0 && 
                  <Badge bg="warning" pill className="ms-2">{pendingInvitations.length}</Badge>
                }
              </>
            }>
              <PendingInvitations
                invitations={pendingInvitations}
                onAccept={handleAcceptInvitation}
                onReject={handleRejectInvitation}
              />
            </Tab>

            <Tab eventKey="patients" title={
              <>
                Patients I Help {accessiblePatients.length > 0 && 
                  <Badge bg="info" pill className="ms-2">{accessiblePatients.length}</Badge>
                }
              </>
            }>
              <PatientAccessList
                patients={accessiblePatients}
                onRefresh={loadData}
              />
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* Invite Modal */}
      <InviteFamilyModal
        show={showInviteModal}
        onHide={() => setShowInviteModal(false)}
        onSuccess={handleInviteSuccess}
      />
    </Container>
  );
};

export default FamilyManagementDashboard;