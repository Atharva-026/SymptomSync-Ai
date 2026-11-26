// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title MedicalRecordRegistry
 * @notice Tamper-evident registry for SymptomSync AI.
 *
 * WHAT IS (AND IS NOT) ON THE CHAIN
 *   - Stored: the SHA-256 hash of each ENCRYPTED file, who owns it, who may
 *     access it, until when, and an audit trail of events.
 *   - Never stored: files, file keys, names, diagnoses or any readable health
 *     data. Every identifier below is an opaque bytes32 (an HMAC computed by
 *     the backend), so nothing here can be linked back to a person without the
 *     backend's secret.
 *
 * WHO WRITES
 *   Only the backend "operator" account (OPERATOR_ROLE) can write. Patients do
 *   not hold wallets; the platform records consent decisions on their behalf.
 *
 * ACCESS MODEL
 *   hasAccess(record, user) is true when the user is:
 *     1. the record's patient, OR
 *     2. holding an unexpired RECORD-level grant (doctor share, QR link), OR
 *     3. holding an unexpired PATIENT-level grant (a family member, who can
 *        see all of that patient's records - one grant, one revoke).
 *
 * EMERGENCY BRAKE
 *   The admin/pauser can pause() all new registrations, grants and logs.
 *   Revocations stay possible while paused, on purpose.
 */
contract MedicalRecordRegistry is AccessControl, Pausable {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @dev Pass as `expiry` for a grant that never expires.
    uint64 public constant NO_EXPIRY = type(uint64).max;

    struct Record {
        bytes32 patientId;
        bytes32 fileHash; // SHA-256 of the encrypted file
        uint64 createdAt; // 0 means "not registered"
    }

    mapping(bytes32 recordId => Record) private _records;
    mapping(bytes32 recordId => mapping(bytes32 userId => uint64 expiry)) private _recordAccess;
    mapping(bytes32 patientId => mapping(bytes32 userId => uint64 expiry)) private _patientAccess;

    error RecordExists();
    error RecordNotFound();
    error BadExpiry();
    error ZeroValue();

    event RecordRegistered(bytes32 indexed recordId, bytes32 indexed patientId, bytes32 fileHash);
    event RecordAccessGranted(bytes32 indexed recordId, bytes32 indexed userId, uint64 expiry);
    event RecordAccessRevoked(bytes32 indexed recordId, bytes32 indexed userId);
    event PatientAccessGranted(bytes32 indexed patientId, bytes32 indexed userId, uint64 expiry);
    event PatientAccessRevoked(bytes32 indexed patientId, bytes32 indexed userId);
    event AccessLogged(bytes32 indexed recordId, bytes32 indexed userId, bytes32 action, uint64 at);

    constructor(address admin, address operator) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(OPERATOR_ROLE, operator);
    }

    // ------------------------------------------------------------ writes

    /// @notice Register an encrypted file's fingerprint and its owner.
    function registerRecord(bytes32 recordId, bytes32 patientId, bytes32 fileHash)
        external
        onlyRole(OPERATOR_ROLE)
        whenNotPaused
    {
        if (recordId == bytes32(0) || patientId == bytes32(0) || fileHash == bytes32(0)) {
            revert ZeroValue();
        }
        if (_records[recordId].createdAt != 0) revert RecordExists();

        _records[recordId] = Record(patientId, fileHash, uint64(block.timestamp));
        emit RecordRegistered(recordId, patientId, fileHash);
    }

    /// @notice Give one user access to one record (doctor share, QR link).
    function grantRecordAccess(bytes32 recordId, bytes32 userId, uint64 expiry)
        external
        onlyRole(OPERATOR_ROLE)
        whenNotPaused
    {
        if (_records[recordId].createdAt == 0) revert RecordNotFound();
        if (userId == bytes32(0)) revert ZeroValue();
        if (expiry <= block.timestamp) revert BadExpiry();

        _recordAccess[recordId][userId] = expiry;
        emit RecordAccessGranted(recordId, userId, expiry);
    }

    /// @notice Remove a record-level grant. Allowed even while paused.
    function revokeRecordAccess(bytes32 recordId, bytes32 userId)
        external
        onlyRole(OPERATOR_ROLE)
    {
        delete _recordAccess[recordId][userId];
        emit RecordAccessRevoked(recordId, userId);
    }

    /// @notice Give a user (family member) access to ALL of a patient's records.
    function grantPatientAccess(bytes32 patientId, bytes32 userId, uint64 expiry)
        external
        onlyRole(OPERATOR_ROLE)
        whenNotPaused
    {
        if (patientId == bytes32(0) || userId == bytes32(0)) revert ZeroValue();
        if (expiry <= block.timestamp) revert BadExpiry();

        _patientAccess[patientId][userId] = expiry;
        emit PatientAccessGranted(patientId, userId, expiry);
    }

    /// @notice Remove a patient-level grant. Allowed even while paused.
    function revokePatientAccess(bytes32 patientId, bytes32 userId)
        external
        onlyRole(OPERATOR_ROLE)
    {
        delete _patientAccess[patientId][userId];
        emit PatientAccessRevoked(patientId, userId);
    }

    /// @notice Append an access event (view / download / analyze) to the audit trail.
    function logAccess(bytes32 recordId, bytes32 userId, bytes32 action)
        external
        onlyRole(OPERATOR_ROLE)
        whenNotPaused
    {
        if (_records[recordId].createdAt == 0) revert RecordNotFound();
        emit AccessLogged(recordId, userId, action, uint64(block.timestamp));
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ------------------------------------------------------------- reads

    function hasAccess(bytes32 recordId, bytes32 userId) external view returns (bool) {
        Record storage r = _records[recordId];
        if (r.createdAt == 0) return false;
        return _hasAccess(recordId, r, userId);
    }

    function verifyHash(bytes32 recordId, bytes32 fileHash) external view returns (bool) {
        Record storage r = _records[recordId];
        return r.createdAt != 0 && r.fileHash == fileHash;
    }

    /// @notice One-call check used by the backend before serving a file.
    /// @return access      the user may read this record right now
    /// @return hashMatches the supplied hash equals the one registered on-chain
    function checkAccess(bytes32 recordId, bytes32 userId, bytes32 fileHash)
        external
        view
        returns (bool access, bool hashMatches)
    {
        Record storage r = _records[recordId];
        if (r.createdAt == 0) return (false, false);
        return (_hasAccess(recordId, r, userId), r.fileHash == fileHash);
    }

    function getRecord(bytes32 recordId)
        external
        view
        returns (bytes32 patientId, bytes32 fileHash, uint64 createdAt)
    {
        Record storage r = _records[recordId];
        return (r.patientId, r.fileHash, r.createdAt);
    }

    function _hasAccess(bytes32 recordId, Record storage r, bytes32 userId)
        private
        view
        returns (bool)
    {
        if (r.patientId == userId) return true;
        return
            _recordAccess[recordId][userId] > block.timestamp ||
            _patientAccess[r.patientId][userId] > block.timestamp;
    }
}
