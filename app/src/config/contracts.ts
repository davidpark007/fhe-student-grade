// StudentGrades contract deployed on Sepolia
// Replace with the actual deployed address after `hardhat deploy --network sepolia`
export const CONTRACT_ADDRESS = '0xb6B49EE5A726412464aB0d5F0F97dDEEABe91186';

// ABI copied from generated artifacts (deployments/sepolia/StudentGrades.json)
// Keep in sync after deployment.
export const CONTRACT_ABI = [
  { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
  { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "student", "type": "address" }, { "internalType": "uint8", "name": "subject", "type": "uint8" }], "name": "getEncryptedGrade", "outputs": [{ "internalType": "euint32", "name": "", "type": "bytes32" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint8", "name": "subject", "type": "uint8" }, { "internalType": "address", "name": "viewer", "type": "address" }], "name": "allowViewer", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "student", "type": "address" }, { "internalType": "uint8", "name": "subject", "type": "uint8" }, { "internalType": "externalEuint32", "name": "inputEuint32", "type": "bytes32" }, { "internalType": "bytes", "name": "inputProof", "type": "bytes" }], "name": "setGrade", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "student", "type": "address" }, { "indexed": true, "internalType": "uint8", "name": "subject", "type": "uint8" }], "name": "GradeSet", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "student", "type": "address" }, { "indexed": true, "internalType": "uint8", "name": "subject", "type": "uint8" }, { "indexed": true, "internalType": "address", "name": "viewer", "type": "address" }], "name": "ViewerAllowed", "type": "event" }
] as const;
