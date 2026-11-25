const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const { ethers, network } = hre;
  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    throw new Error("No deployer account. Set DEPLOYER_PRIVATE_KEY in blockchain/.env");
  }
  const deployer = signers[0];

  // Locally, Hardhat account #1 acts as the backend operator.
  // On any other network you must say which address the backend will sign with.
  const operatorAddress =
    process.env.OPERATOR_ADDRESS || (network.name === "localhost" || network.name === "hardhat" ? signers[1]?.address : undefined);
  if (!operatorAddress) {
    throw new Error("Set OPERATOR_ADDRESS in blockchain/.env (the address the backend signs with)");
  }

  console.log(`Network:   ${network.name}`);
  console.log(`Admin:     ${deployer.address}`);
  console.log(`Operator:  ${operatorAddress}`);

  const Registry = await ethers.getContractFactory("MedicalRecordRegistry");
  const registry = await Registry.deploy(deployer.address, operatorAddress);
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  const chainId = Number((await ethers.provider.getNetwork()).chainId);

  const deployment = {
    network: network.name,
    chainId,
    address,
    admin: deployer.address,
    operator: operatorAddress,
    txHash: registry.deploymentTransaction().hash,
    deployedAt: new Date().toISOString(),
  };

  const dir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${network.name}.json`), JSON.stringify(deployment, null, 2));

  console.log(`\n✅ MedicalRecordRegistry deployed at ${address}`);
  console.log("\nPut these in server/.env:");
  console.log("  BLOCKCHAIN_ENABLED=true");
  console.log(`  CONTRACT_ADDRESS=${address}`);
  console.log(`  CHAIN_ID=${chainId}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
