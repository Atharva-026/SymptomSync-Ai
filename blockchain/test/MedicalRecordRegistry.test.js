const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
  time,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

// Opaque 32-byte ids, like the backend's HMAC outputs
const id = (label) => ethers.id(label);

const PATIENT = id("user:patient-1");
const OTHER_PATIENT = id("user:patient-2");
const FAMILY = id("user:family-1");
const DOCTOR = id("user:doctor-1");
const STRANGER = id("user:stranger");
const REC1 = id("record:1");
const REC2 = id("record:2");
const REC_OTHER = id("record:other-patient");
const HASH = id("ciphertext-hash-1");
const HASH2 = id("ciphertext-hash-2");

async function deployFixture() {
  const [admin, operator, outsider] = await ethers.getSigners();
  const Registry = await ethers.getContractFactory("MedicalRecordRegistry");
  const registry = await Registry.deploy(admin.address, operator.address);
  await registry.waitForDeployment();
  const asOperator = registry.connect(operator);
  return { registry, asOperator, admin, operator, outsider };
}

async function withRecordsFixture() {
  const base = await deployFixture();
  await base.asOperator.registerRecord(REC1, PATIENT, HASH);
  await base.asOperator.registerRecord(REC2, PATIENT, HASH2);
  await base.asOperator.registerRecord(REC_OTHER, OTHER_PATIENT, HASH);
  return base;
}

const inOneHour = async () => (await time.latest()) + 3600;

describe("MedicalRecordRegistry", () => {
  describe("deployment and roles", () => {
    it("gives the admin admin+pauser roles and the operator the operator role", async () => {
      const { registry, admin, operator, outsider } = await loadFixture(deployFixture);
      const ADMIN = await registry.DEFAULT_ADMIN_ROLE();
      expect(await registry.hasRole(ADMIN, admin.address)).to.equal(true);
      expect(await registry.hasRole(await registry.PAUSER_ROLE(), admin.address)).to.equal(true);
      expect(await registry.hasRole(await registry.OPERATOR_ROLE(), operator.address)).to.equal(true);
      expect(await registry.hasRole(await registry.OPERATOR_ROLE(), outsider.address)).to.equal(false);
    });

    it("does not make the admin an operator", async () => {
      const { registry, admin } = await loadFixture(deployFixture);
      expect(await registry.hasRole(await registry.OPERATOR_ROLE(), admin.address)).to.equal(false);
    });
  });

  describe("registerRecord", () => {
    it("stores the hash and owner and emits RecordRegistered", async () => {
      const { registry, asOperator } = await loadFixture(deployFixture);
      await expect(asOperator.registerRecord(REC1, PATIENT, HASH))
        .to.emit(registry, "RecordRegistered")
        .withArgs(REC1, PATIENT, HASH);

      const [patientId, fileHash, createdAt] = await registry.getRecord(REC1);
      expect(patientId).to.equal(PATIENT);
      expect(fileHash).to.equal(HASH);
      expect(createdAt).to.be.greaterThan(0n);
    });

    it("rejects a duplicate record id", async () => {
      const { registry, asOperator } = await loadFixture(withRecordsFixture);
      await expect(asOperator.registerRecord(REC1, PATIENT, HASH2)).to.be.revertedWithCustomError(
        registry,
        "RecordExists"
      );
    });

    it("rejects zero values", async () => {
      const { registry, asOperator } = await loadFixture(deployFixture);
      await expect(asOperator.registerRecord(ethers.ZeroHash, PATIENT, HASH)).to.be.revertedWithCustomError(registry, "ZeroValue");
      await expect(asOperator.registerRecord(REC1, ethers.ZeroHash, HASH)).to.be.revertedWithCustomError(registry, "ZeroValue");
      await expect(asOperator.registerRecord(REC1, PATIENT, ethers.ZeroHash)).to.be.revertedWithCustomError(registry, "ZeroValue");
    });

    it("can only be called by the operator", async () => {
      const { registry, outsider, admin } = await loadFixture(deployFixture);
      const OPERATOR_ROLE = await registry.OPERATOR_ROLE();
      await expect(registry.connect(outsider).registerRecord(REC1, PATIENT, HASH))
        .to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount")
        .withArgs(outsider.address, OPERATOR_ROLE);
      await expect(registry.connect(admin).registerRecord(REC1, PATIENT, HASH))
        .to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
    });
  });

  describe("access: owner and strangers", () => {
    it("the patient always has access to their own records", async () => {
      const { registry } = await loadFixture(withRecordsFixture);
      expect(await registry.hasAccess(REC1, PATIENT)).to.equal(true);
      expect(await registry.hasAccess(REC2, PATIENT)).to.equal(true);
    });

    it("strangers and other patients have no access", async () => {
      const { registry } = await loadFixture(withRecordsFixture);
      expect(await registry.hasAccess(REC1, STRANGER)).to.equal(false);
      expect(await registry.hasAccess(REC1, OTHER_PATIENT)).to.equal(false);
    });

    it("nobody has access to a record that does not exist", async () => {
      const { registry } = await loadFixture(withRecordsFixture);
      expect(await registry.hasAccess(id("record:nope"), PATIENT)).to.equal(false);
    });
  });

  describe("record-level grants (doctor / QR link)", () => {
    it("grants access to that record only, then it expires", async () => {
      const { registry, asOperator } = await loadFixture(withRecordsFixture);
      const expiry = await inOneHour();

      await expect(asOperator.grantRecordAccess(REC1, DOCTOR, expiry))
        .to.emit(registry, "RecordAccessGranted")
        .withArgs(REC1, DOCTOR, expiry);

      expect(await registry.hasAccess(REC1, DOCTOR)).to.equal(true);
      expect(await registry.hasAccess(REC2, DOCTOR)).to.equal(false); // not leaked to other records

      await time.increase(3601);
      expect(await registry.hasAccess(REC1, DOCTOR)).to.equal(false); // expired by itself
    });

    it("can be revoked before it expires", async () => {
      const { registry, asOperator } = await loadFixture(withRecordsFixture);
      await asOperator.grantRecordAccess(REC1, DOCTOR, await inOneHour());
      expect(await registry.hasAccess(REC1, DOCTOR)).to.equal(true);

      await expect(asOperator.revokeRecordAccess(REC1, DOCTOR))
        .to.emit(registry, "RecordAccessRevoked")
        .withArgs(REC1, DOCTOR);
      expect(await registry.hasAccess(REC1, DOCTOR)).to.equal(false);
    });

    it("rejects an expiry in the past", async () => {
      const { registry, asOperator } = await loadFixture(withRecordsFixture);
      const past = (await time.latest()) - 10;
      await expect(asOperator.grantRecordAccess(REC1, DOCTOR, past)).to.be.revertedWithCustomError(registry, "BadExpiry");
    });

    it("rejects a grant on an unknown record", async () => {
      const { registry, asOperator } = await loadFixture(withRecordsFixture);
      await expect(asOperator.grantRecordAccess(id("record:nope"), DOCTOR, await inOneHour()))
        .to.be.revertedWithCustomError(registry, "RecordNotFound");
    });

    it("rejects a zero user id", async () => {
      const { registry, asOperator } = await loadFixture(withRecordsFixture);
      await expect(asOperator.grantRecordAccess(REC1, ethers.ZeroHash, await inOneHour()))
        .to.be.revertedWithCustomError(registry, "ZeroValue");
    });

    it("can only be granted/revoked by the operator", async () => {
      const { registry, outsider } = await loadFixture(withRecordsFixture);
      await expect(registry.connect(outsider).grantRecordAccess(REC1, DOCTOR, await inOneHour()))
        .to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
      await expect(registry.connect(outsider).revokeRecordAccess(REC1, DOCTOR))
        .to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
    });

    it("a grant can be renewed with a later expiry", async () => {
      const { registry, asOperator } = await loadFixture(withRecordsFixture);
      await asOperator.grantRecordAccess(REC1, DOCTOR, await inOneHour());
      await time.increase(3000);
      await asOperator.grantRecordAccess(REC1, DOCTOR, (await time.latest()) + 7200);
      await time.increase(1000); // past the original expiry
      expect(await registry.hasAccess(REC1, DOCTOR)).to.equal(true);
    });
  });

  describe("patient-level grants (family)", () => {
    it("covers every record of that patient - including ones registered later", async () => {
      const { registry, asOperator } = await loadFixture(withRecordsFixture);
      const NO_EXPIRY = await registry.NO_EXPIRY();

      await expect(asOperator.grantPatientAccess(PATIENT, FAMILY, NO_EXPIRY))
        .to.emit(registry, "PatientAccessGranted")
        .withArgs(PATIENT, FAMILY, NO_EXPIRY);

      expect(await registry.hasAccess(REC1, FAMILY)).to.equal(true);
      expect(await registry.hasAccess(REC2, FAMILY)).to.equal(true);

      const LATER = id("record:uploaded-later");
      await asOperator.registerRecord(LATER, PATIENT, HASH);
      expect(await registry.hasAccess(LATER, FAMILY)).to.equal(true);
    });

    it("does NOT cover another patient's records", async () => {
      const { registry, asOperator } = await loadFixture(withRecordsFixture);
      await asOperator.grantPatientAccess(PATIENT, FAMILY, await registry.NO_EXPIRY());
      expect(await registry.hasAccess(REC_OTHER, FAMILY)).to.equal(false);
    });

    it("one revoke removes access to all records", async () => {
      const { registry, asOperator } = await loadFixture(withRecordsFixture);
      await asOperator.grantPatientAccess(PATIENT, FAMILY, await registry.NO_EXPIRY());

      await expect(asOperator.revokePatientAccess(PATIENT, FAMILY))
        .to.emit(registry, "PatientAccessRevoked")
        .withArgs(PATIENT, FAMILY);
      expect(await registry.hasAccess(REC1, FAMILY)).to.equal(false);
      expect(await registry.hasAccess(REC2, FAMILY)).to.equal(false);
    });

    it("honours an expiry", async () => {
      const { registry, asOperator } = await loadFixture(withRecordsFixture);
      await asOperator.grantPatientAccess(PATIENT, FAMILY, await inOneHour());
      expect(await registry.hasAccess(REC1, FAMILY)).to.equal(true);
      await time.increase(3601);
      expect(await registry.hasAccess(REC1, FAMILY)).to.equal(false);
    });

    it("rejects zero ids and past expiries", async () => {
      const { registry, asOperator } = await loadFixture(withRecordsFixture);
      await expect(asOperator.grantPatientAccess(ethers.ZeroHash, FAMILY, await inOneHour())).to.be.revertedWithCustomError(registry, "ZeroValue");
      await expect(asOperator.grantPatientAccess(PATIENT, ethers.ZeroHash, await inOneHour())).to.be.revertedWithCustomError(registry, "ZeroValue");
      await expect(asOperator.grantPatientAccess(PATIENT, FAMILY, (await time.latest()) - 1)).to.be.revertedWithCustomError(registry, "BadExpiry");
    });

    it("can only be changed by the operator", async () => {
      const { registry, outsider } = await loadFixture(withRecordsFixture);
      await expect(registry.connect(outsider).grantPatientAccess(PATIENT, FAMILY, await inOneHour()))
        .to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
      await expect(registry.connect(outsider).revokePatientAccess(PATIENT, FAMILY))
        .to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
    });
  });

  describe("hash verification", () => {
    it("verifyHash is true only for the registered hash", async () => {
      const { registry } = await loadFixture(withRecordsFixture);
      expect(await registry.verifyHash(REC1, HASH)).to.equal(true);
      expect(await registry.verifyHash(REC1, HASH2)).to.equal(false);
      expect(await registry.verifyHash(id("record:nope"), HASH)).to.equal(false);
    });

    it("checkAccess returns (access, hashMatches) in one call", async () => {
      const { registry, asOperator } = await loadFixture(withRecordsFixture);
      await asOperator.grantPatientAccess(PATIENT, FAMILY, await registry.NO_EXPIRY());

      // ethers returns a Result object; copy it into a plain [access, hashMatches] pair
      const check = async (...args) => {
        const result = await registry.checkAccess(...args);
        return [result[0], result[1]];
      };

      expect(await check(REC1, PATIENT, HASH)).to.deep.equal([true, true]);
      expect(await check(REC1, FAMILY, HASH)).to.deep.equal([true, true]);
      expect(await check(REC1, PATIENT, HASH2)).to.deep.equal([true, false]); // tampered file
      expect(await check(REC1, STRANGER, HASH)).to.deep.equal([false, true]);
      expect(await check(id("record:nope"), PATIENT, HASH)).to.deep.equal([false, false]);
    });
  });

  describe("audit log", () => {
    it("emits AccessLogged for the operator on an existing record", async () => {
      const { registry, asOperator } = await loadFixture(withRecordsFixture);
      const action = ethers.encodeBytes32String("download");
      await expect(asOperator.logAccess(REC1, FAMILY, action))
        .to.emit(registry, "AccessLogged");
    });

    it("rejects logs for unknown records and from non-operators", async () => {
      const { registry, asOperator, outsider } = await loadFixture(withRecordsFixture);
      const action = ethers.encodeBytes32String("view");
      await expect(asOperator.logAccess(id("record:nope"), FAMILY, action)).to.be.revertedWithCustomError(registry, "RecordNotFound");
      await expect(registry.connect(outsider).logAccess(REC1, FAMILY, action)).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
    });
  });

  describe("pause (emergency brake)", () => {
    it("only the pauser can pause and unpause", async () => {
      const { registry, outsider, operator } = await loadFixture(deployFixture);
      await expect(registry.connect(outsider).pause()).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
      await expect(registry.connect(operator).pause()).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
    });

    it("blocks new registrations, grants and logs while paused", async () => {
      const { registry, asOperator, admin } = await loadFixture(withRecordsFixture);
      await registry.connect(admin).pause();

      await expect(asOperator.registerRecord(id("record:new"), PATIENT, HASH)).to.be.revertedWithCustomError(registry, "EnforcedPause");
      await expect(asOperator.grantRecordAccess(REC1, DOCTOR, await inOneHour())).to.be.revertedWithCustomError(registry, "EnforcedPause");
      await expect(asOperator.grantPatientAccess(PATIENT, FAMILY, await inOneHour())).to.be.revertedWithCustomError(registry, "EnforcedPause");
      await expect(asOperator.logAccess(REC1, FAMILY, ethers.encodeBytes32String("view"))).to.be.revertedWithCustomError(registry, "EnforcedPause");
    });

    it("still allows revocations and reads while paused", async () => {
      const { registry, asOperator, admin } = await loadFixture(withRecordsFixture);
      await asOperator.grantPatientAccess(PATIENT, FAMILY, await registry.NO_EXPIRY());
      await asOperator.grantRecordAccess(REC1, DOCTOR, await inOneHour());
      await registry.connect(admin).pause();

      await asOperator.revokePatientAccess(PATIENT, FAMILY);
      await asOperator.revokeRecordAccess(REC1, DOCTOR);
      expect(await registry.hasAccess(REC1, FAMILY)).to.equal(false);
      expect(await registry.hasAccess(REC1, DOCTOR)).to.equal(false);
      expect(await registry.hasAccess(REC1, PATIENT)).to.equal(true);
    });

    it("works again after unpause", async () => {
      const { registry, asOperator, admin } = await loadFixture(deployFixture);
      await registry.connect(admin).pause();
      await registry.connect(admin).unpause();
      await expect(asOperator.registerRecord(REC1, PATIENT, HASH)).to.emit(registry, "RecordRegistered");
    });
  });

  describe("backend ABI stays in sync with the compiled contract", () => {
    // server/utils/registryAbi.js is what the backend uses. If someone edits
    // the contract without updating it, this test fails.
    const backendAbi = require("../../server/utils/registryAbi.js");

    it("every function in the backend ABI matches the contract (name, inputs, mutability)", async () => {
      const { registry } = await loadFixture(deployFixture);
      const backend = new ethers.Interface(backendAbi);

      for (const fragment of backend.fragments.filter((f) => f.type === "function")) {
        const compiled = registry.interface.getFunction(fragment.name);
        expect(compiled, `missing function ${fragment.name}`).to.not.equal(null);
        expect(compiled.selector, `selector of ${fragment.name}`).to.equal(fragment.selector);
        expect(compiled.stateMutability, `mutability of ${fragment.name}`).to.equal(fragment.stateMutability);
        expect(compiled.outputs.length, `outputs of ${fragment.name}`).to.equal(fragment.outputs.length);
      }
    });

    it("every custom error in the backend ABI exists in the contract", async () => {
      const { registry } = await loadFixture(deployFixture);
      const backend = new ethers.Interface(backendAbi);

      for (const fragment of backend.fragments.filter((f) => f.type === "error")) {
        const compiled = registry.interface.getError(fragment.name);
        expect(compiled, `missing error ${fragment.name}`).to.not.equal(null);
        expect(compiled.selector).to.equal(fragment.selector);
      }
    });
  });
});
