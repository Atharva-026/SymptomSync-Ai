require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const accounts = process.env.DEPLOYER_PRIVATE_KEY
  ? [process.env.DEPLOYER_PRIVATE_KEY]
  : [];

const networks = {
  // `npx hardhat node` (see README steps) listens here
  localhost: { url: "http://127.0.0.1:8545" },
};

// Public testnet - only registered when you provide an RPC URL
if (process.env.SEPOLIA_RPC_URL) {
  networks.sepolia = { url: process.env.SEPOLIA_RPC_URL, accounts };
}

// Private Hyperledger Besu network (Phase 7). Gas is free on a permissioned chain.
if (process.env.BESU_RPC_URL) {
  networks.besu = { url: process.env.BESU_RPC_URL, accounts, gasPrice: 0 };
}

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      // "paris" avoids the PUSH0 opcode so the same bytecode also runs on
      // older / permissioned EVM chains.
      evmVersion: "paris",
    },
  },
  networks,
};
