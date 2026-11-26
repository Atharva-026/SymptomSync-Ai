// Prints everything the contract has recorded - handy to SEE the blockchain
// working while you click around the app.
//   npm run events:local
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const EVENTS = [
  "RecordRegistered",
  "RecordAccessGranted",
  "RecordAccessRevoked",
  "PatientAccessGranted",
  "PatientAccessRevoked",
  "AccessLogged",
];

const short = (v) => (typeof v === "string" && v.startsWith("0x") && v.length === 66 ? `${v.slice(0, 10)}…${v.slice(-6)}` : v);

async function main() {
  const file = path.join(__dirname, "..", "deployments", `${hre.network.name}.json`);
  if (!fs.existsSync(file)) throw new Error(`No deployment found for "${hre.network.name}". Run the deploy script first.`);
  const { address } = JSON.parse(fs.readFileSync(file, "utf8"));
  const registry = await hre.ethers.getContractAt("MedicalRecordRegistry", address);

  const rows = [];
  for (const name of EVENTS) {
    const logs = await registry.queryFilter(registry.filters[name](), 0, "latest");
    for (const log of logs) {
      const args = log.fragment.inputs.map((input, i) => `${input.name}=${short(String(log.args[i]))}`);
      rows.push({ block: log.blockNumber, index: log.index, name, args: args.join("  ") });
    }
  }

  rows.sort((a, b) => a.block - b.block || a.index - b.index);
  if (rows.length === 0) console.log("(no events yet)");
  for (const r of rows) console.log(`#${String(r.block).padStart(4)}  ${r.name.padEnd(22)} ${r.args}`);
  console.log(`\n${rows.length} event(s) on contract ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
