// src/components/family/FamilyMembersList.jsx

import React, { useState } from 'react';
import { Table, Badge, Button, Dropdown, Modal, Form, Row, Col } from 'react-bootstrap';
import { 
  FaEllipsisV, FaEdit, FaTrash, FaStar, FaCheckCircle, 
  FaClock, FaTimesCircle, FaShieldAlt 
} from 'react-icons/fa';
import moment from 'moment';

const FamilyMembersList = ({ familyMembers, onRevokeAccess, onUpdatePermissions, onRefresh }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [editPermissions, setEditPermissions] = useState({});

  const permissionLabels = {
    viewRecords: 'View Records',
    manageAppointments: 'Manage Appointments',
    viewAssessments: 'View Assessments',
    manageMedications: 'Manage Medications',
    uploadRecords: 'Upload Records',
    emergencyContact: 'Emergency Contact'
  };

  const getStatusBadge = (status) => {
    const badges = {
      accepted: { variant: 'success', icon: <FaCheckCircle />, text: 'Active' },
      pending: { variant: 'warning', icon: <FaClock />, text: 'Pending' },
      rejected: { variant: 'danger', icon: <FaTimesCircle />, text: 'Rejected' },
      revoked: { variant: 'secondary', icon: <FaTimesCircle />, text: 'Revoked' }
    };

    const badge = badges[status] || badges.pending;

    return (
      <Badge bg={badge.variant} className="d-flex align-items-center gap-1">
        {badge.icon} {badge.text}
      </Badge>
    );
  };

  const getRelationshipLabel = (relationship) => {
    const labels = {
      spouse: 'Spouse/Partner',
      parent: 'Parent',
      child: 'Child',
      sibling: 'Sibling',
      guardian: 'Legal Guardian',
      caregiver: 'Caregiver',
      other: 'Other Family Member'
    };
    return labels[relationship] || relationship;
  };

  const handleEditPermissions = (member) => {
    setSelectedMember(member);
    setEditPermissions(member.permissions);
    setShowEditModal(true);
  };

  const handleSavePermissions = async () => {
    try {
      await onUpdatePermissions(selectedMember.userId._id, editPermissions);
      setShowEditModal(false);
      setSelectedMember(null);
    } catch (error) {
      console.error('Error updating permissions:', error);
    }
  };

  const handlePermissionToggle = (key) => {
    setEditPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!familyMembers || familyMembers.length === 0) {
    return (
      <div className="text-center py-5">
        <div className="mb-3" style={{ fontSize: '4rem', opacity: 0.3 }}>
          👨‍👩‍👧‍👦
        </div>
        <h4 className="text-muted">No Family Members Yet</h4>
        <p className="text-muted">
          Click "Invite Family Member" to add someone who can help manage your healthcare
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="table-responsive">
        <Table hover className="family-members-table">
          <thead className="bg-light">
            <tr>
              <th>Name & Email</th>
              <th>Relationship</th>
              <th>Status</th>
              <th>Permissions</th>
              <th>Added On</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {familyMembers.map((member) => (
              <tr key={member._id}>
                <td>
                  <div>
                    <strong>{member.userId?.name || 'Unknown'}</strong>
                    <br />
                    <small className="text-muted">{member.userId?.email}</small>
                    {member.userId?.phone && (
                      <>
                        <br />
                        <small className="text-muted">{member.userId.phone}</small>
                      </>
                    )}
                  </div>
                </td>
                
                <td>
                  <Badge bg="info" className="text-capitalize">
                    {getRelationshipLabel(member.relationship)}
                  </Badge>
                </td>
                
                <td>{getStatusBadge(member.status)}</td>
                
                <td>
                  <div className="d-flex flex-wrap gap-1">
                    {Object.entries(member.permissions)
                      .filter(([_, value]) => value)
                      .map(([key]) => (
                        <Badge
                          key={key}
                          bg="light"
                          text="dark"
                          className="border"
                          style={{ fontSize: '0.7rem' }}
                        >
                          {permissionLabels[key]}
                        </Badge>
                      ))}
                    {Object.values(member.permissions).filter(v => v).length === 0 && (
                      <span className="text-muted small">No permissions</span>
                    )}
                  </div>
                </td>
                
                <td>
                  <small className="text-muted">
                    {moment(member.invitedAt).format('MMM D, YYYY')}
                  </small>
                  {member.acceptedAt && (
                    <>
                      <br />
                      <small className="text-success">
                        Accepted: {moment(member.acceptedAt).format('MMM D, YYYY')}
                      </small>
                    </>
                  )}
                </td>
                
                <td className="text-end">
                  {member.status === 'accepted' && (
                    <Dropdown align="end">
                      <Dropdown.Toggle
                        variant="light"
                        size="sm"
                        className="border-0"
                      >
                        <FaEllipsisV />
                      </Dropdown.Toggle>
                      
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => handleEditPermissions(member)}>
                          <FaEdit className="me-2" />
                          Edit Permissions
                        </Dropdown.Item>
                        
                        <Dropdown.Divider />
                        
                        <Dropdown.Item
                          className="text-danger"
                          onClick={() => onRevokeAccess(member.userId._id)}
                        >
                          <FaTrash className="me-2" />
                          Revoke Access
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  )}
                  
                  {member.status === 'pending' && (
                    <Badge bg="warning">Waiting for acceptance</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Edit Permissions Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <FaShieldAlt className="me-2" />
            Edit Permissions
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body>
          {selectedMember && (
            <>
              <div className="mb-4">
                <h6>Family Member</h6>
                <p className="mb-1">
                  <strong>{selectedMember.userId?.name}</strong>
                </p>
                <p className="text-muted small mb-0">
                  {getRelationshipLabel(selectedMember.relationship)}
                </p>
              </div>

              <h6 className="mb-3">Access Permissions</h6>
              
              <Row className="g-2">
                {Object.entries(permissionLabels).map(([key, label]) => (
                  <Col xs={12} key={key}>
                    <Form.Check
                      type="switch"
                      id={`edit-${key}`}
                      label={label}
                      checked={editPermissions[key] || false}
                      onChange={() => handlePermissionToggle(key)}
                      className="permission-switch"
                    />
                  </Col>
                ))}
              </Row>
            </>
          )}
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSavePermissions}>
            <FaCheckCircle className="me-2" />
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default FamilyMembersList;