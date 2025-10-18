# FHE Student Grade Management System

A privacy-preserving student grade management system built with Fully Homomorphic Encryption (FHE) technology. This decentralized application enables teachers to set student grades that remain encrypted on-chain, ensuring complete privacy while maintaining the benefits of blockchain transparency and immutability.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [How It Works](#how-it-works)
- [Problems Solved](#problems-solved)
- [Installation](#installation)
- [Usage](#usage)
- [Smart Contract](#smart-contract)
- [Frontend Application](#frontend-application)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security Considerations](#security-considerations)
- [Future Roadmap](#future-roadmap)
- [Contributing](#contributing)
- [License](#license)

## Overview

The FHE Student Grade Management System is a revolutionary educational platform that leverages blockchain technology and Fully Homomorphic Encryption (FHE) to create a secure, transparent, and privacy-preserving grade management solution. Unlike traditional systems where grades are stored in centralized databases vulnerable to unauthorized access, this system stores encrypted grades on-chain, ensuring that only authorized parties can decrypt and view them.

## Key Features

### Privacy-First Design
- **End-to-End Encryption**: All grades are encrypted using FHE before being stored on-chain
- **Zero-Knowledge Architecture**: Grades remain encrypted even during on-chain storage and computation
- **Selective Disclosure**: Students can choose to share specific subject grades with specific viewers
- **No Centralized Database**: Eliminates single points of failure and unauthorized access risks

### Multi-Subject Support
- Language
- Mathematics
- Science
- History
- Physical Education

### Role-Based Access Control
- **Teachers**: Set encrypted grades for students (owner-only permission)
- **Students**: Decrypt and view their own grades
- **Viewers**: Access grades only when explicitly authorized by students

### Transparency & Immutability
- All grade-setting actions are recorded on-chain
- Tamper-proof audit trail via blockchain events
- Verifiable grade history without exposing sensitive data

## Architecture

The system consists of three main components:

### 1. Smart Contract Layer (`contracts/StudentGrades.sol`)
- Implements FHE-based grade storage using Zama's FHEVM protocol
- Manages access control for teachers, students, and authorized viewers
- Emits events for grade updates and viewer authorizations
- Deployed on Ethereum Sepolia testnet

### 2. Frontend Application (`app/`)
- React-based single-page application
- Wallet integration via RainbowKit and Wagmi
- Client-side encryption/decryption using Zama Relayer SDK
- Four main interfaces:
  - Teacher grade setting
  - Student grade viewing
  - Grade sharing
  - Viewing shared grades

### 3. Encryption Infrastructure
- Zama FHEVM protocol for homomorphic encryption
- Zama Relayer SDK for client-side operations
- EIP-712 signature-based decryption authorization

## Technology Stack

### Blockchain & Smart Contracts
- **Solidity**: ^0.8.24 (Smart contract development)
- **Hardhat**: ^2.26.0 (Development framework)
- **FHEVM**: @fhevm/solidity ^0.8.0 (Fully homomorphic encryption library)
- **Zama Oracle**: @zama-fhe/oracle-solidity ^0.1.0 (Decryption oracle)
- **Ethers.js**: ^6.15.0 (Ethereum interaction)
- **TypeChain**: ^8.3.2 (TypeScript bindings for contracts)

### Frontend
- **React**: ^19.1.1 (UI framework)
- **TypeScript**: ~5.8.3 (Type-safe development)
- **Vite**: ^7.1.6 (Build tool and dev server)
- **Wagmi**: ^2.17.0 (React hooks for Ethereum)
- **RainbowKit**: ^2.2.8 (Wallet connection UI)
- **Viem**: ^2.37.6 (TypeScript Ethereum library)
- **TanStack Query**: ^5.89.0 (Data fetching and state management)
- **Zama Relayer SDK**: ^0.2.0 (FHE client operations)

### Development & Testing
- **Mocha**: ^11.7.1 (Testing framework)
- **Chai**: ^4.5.0 (Assertion library)
- **Hardhat Deploy**: ^0.11.45 (Deployment management)
- **Hardhat Gas Reporter**: ^2.3.0 (Gas optimization analysis)
- **Solidity Coverage**: ^0.8.16 (Code coverage)
- **ESLint & Prettier**: Code quality and formatting
- **Solhint**: ^6.0.0 (Solidity linting)

### Infrastructure
- **Ethereum Sepolia**: Testnet deployment
- **Infura**: RPC provider
- **Hardhat Network**: Local testing environment
- **FHEVM Plugin**: @fhevm/hardhat-plugin ^0.1.0

## How It Works

### Grade Setting Flow (Teacher)

1. **Teacher Authentication**: Teacher connects wallet (must be contract owner)
2. **Input Grade**: Enters student address, subject, and grade value
3. **Client-Side Encryption**:
   - Zama instance creates encrypted input
   - Grade is encrypted using FHE before leaving browser
4. **Transaction Submission**:
   - Encrypted grade + proof sent to `setGrade()` function
   - Smart contract stores encrypted grade on-chain
5. **Access Permissions**:
   - Automatic ACL grants access to: contract, teacher, and student
   - Grade remains encrypted in contract storage

### Grade Viewing Flow (Student)

1. **Student Authentication**: Student connects wallet
2. **Subject Selection**: Chooses which subject to view
3. **Fetch Encrypted Handle**:
   - Reads encrypted grade handle from contract
   - No decryption occurs on-chain
4. **Client-Side Decryption**:
   - Generates temporary keypair
   - Signs EIP-712 message for decryption authorization
   - Sends request to Zama relayer with signature
   - Relayer returns decrypted grade
5. **Display**: Decrypted grade shown only to student

### Grade Sharing Flow

1. **Student Authorization**: Student selects subject and viewer address
2. **On-Chain Permission**: Calls `allowViewer()` function
3. **ACL Update**: Smart contract grants viewer access to encrypted grade
4. **Viewer Access**: Authorized viewer can now decrypt the grade using same flow as student

### Technical Implementation Details

#### FHE Encryption Process
```javascript
// Create encrypted input
const input = instance.createEncryptedInput(contractAddress, userAddress);
input.add32(gradeValue);
const encrypted = await input.encrypt();

// Submit to smart contract
await contract.setGrade(
  studentAddress,
  subjectId,
  encrypted.handles[0],  // Encrypted handle
  encrypted.inputProof   // Zero-knowledge proof
);
```

#### Decryption Process
```javascript
// Generate keypair for decryption session
const keypair = instance.generateKeypair();

// Create EIP-712 signature for authorization
const eip712 = instance.createEIP712(keypair.publicKey, [contractAddress], timestamp, duration);
const signature = await signer.signTypedData(eip712.domain, eip712.types, eip712.message);

// Decrypt via Zama relayer
const result = await instance.userDecrypt(
  [{ handle, contractAddress }],
  keypair.privateKey,
  keypair.publicKey,
  signature,
  [contractAddress],
  userAddress,
  timestamp,
  duration
);
```

## Problems Solved

### 1. Privacy Violations in Traditional Systems
**Problem**: Traditional grade management systems store grades in plaintext databases, making them vulnerable to:
- Data breaches exposing sensitive student information
- Unauthorized access by system administrators
- Insider threats from database operators
- Centralized control over sensitive educational data

**Solution**: FHE encryption ensures grades remain encrypted at all times, even during computation. No one - not even the contract owner or blockchain validators - can view grades without proper authorization.

### 2. Lack of Student Control
**Problem**: Students have no control over who can access their grades. System administrators, database operators, and potentially hackers can view all grades indiscriminately.

**Solution**: Students have granular control over grade sharing. They can:
- Choose specific subjects to share
- Authorize specific viewers (employers, universities, etc.)
- Revoke access by not granting permissions
- Maintain full sovereignty over their educational data

### 3. Trust in Centralized Authorities
**Problem**: Traditional systems require trusting the institution to:
- Not manipulate grade records
- Properly secure the database
- Not share data with third parties
- Maintain accurate historical records

**Solution**: Blockchain immutability ensures:
- Tamper-proof grade records
- Transparent audit trail via events
- Decentralized verification
- Trustless operation without intermediaries

### 4. Verifiability Issues
**Problem**: Difficult to verify grade authenticity when sharing with third parties. Paper transcripts can be forged, and digital records from centralized systems lack cryptographic proof.

**Solution**: Blockchain-based records provide:
- Cryptographic verification of grade authenticity
- On-chain proof that grades were set by authorized teacher
- Transparent event history showing when grades were set
- Shareable encrypted proofs that third parties can verify

### 5. Single Point of Failure
**Problem**: Centralized databases create single points of failure:
- Server downtime prevents grade access
- Database corruption loses historical data
- System hacks compromise all records
- Vendor lock-in limits portability

**Solution**: Decentralized blockchain storage ensures:
- 24/7 availability via distributed network
- Redundant data storage across nodes
- No single entity controls the data
- Portable records that persist independent of any institution

### 6. Limited Audit Capabilities
**Problem**: Traditional systems lack transparent audit trails. Modifications to grades may not be logged, and historical changes can be hard to track.

**Solution**: Blockchain events provide:
- Immutable record of all grade-setting actions
- Timestamp verification for all operations
- Public audit trail (while maintaining privacy via encryption)
- Transparent viewer authorization tracking

## Installation

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm**: Version 7.0.0 or higher
- **MetaMask** or compatible Web3 wallet
- **Infura API Key**: For Ethereum network access
- **Sepolia ETH**: For testnet deployment and transactions

### Clone Repository

```bash
git clone https://github.com/yourusername/fhe-student-grade.git
cd fhe-student-grade
```

### Install Dependencies

#### Backend (Smart Contracts)

```bash
npm install
```

#### Frontend

```bash
cd app
npm install
cd ..
```

### Environment Setup

#### Configure Hardhat Variables

```bash
# Set mnemonic for account generation
npx hardhat vars set MNEMONIC

# Set Infura API key
npx hardhat vars set INFURA_API_KEY

# Optional: Set Etherscan API key for verification
npx hardhat vars set ETHERSCAN_API_KEY
```

#### Alternative: Use .env File

Create a `.env` file in the root directory:

```env
PRIVATE_KEY=your_private_key_here
INFURA_API_KEY=your_infura_api_key
```

## Usage

### Compile Smart Contracts

```bash
npm run compile
```

This compiles the Solidity contracts and generates TypeScript type definitions.

### Run Tests

```bash
# Run tests on local mock FHEVM
npm run test

# Run tests on Sepolia testnet
npm run test:sepolia
```

### Deploy to Sepolia

```bash
npm run deploy:sepolia
```

After deployment, update `app/src/config/contracts.ts` with the deployed contract address.

### Verify Contract on Etherscan

```bash
npm run verify:sepolia -- <DEPLOYED_CONTRACT_ADDRESS>
```

### Start Frontend Development Server

```bash
cd app
npm run dev
```

The application will be available at `http://localhost:5173`

### Build Frontend for Production

```bash
cd app
npm run build
```

Production files will be in `app/dist/`

## Smart Contract

### Contract: `StudentGrades.sol`

#### Key Functions

##### `setGrade(address student, uint8 subject, externalEuint32 inputEuint32, bytes calldata inputProof)`
- **Access**: Teacher only (contract owner)
- **Purpose**: Set encrypted grade for a student's subject
- **Parameters**:
  - `student`: Student's Ethereum address
  - `subject`: Subject ID (0-4)
  - `inputEuint32`: Encrypted grade handle
  - `inputProof`: Zero-knowledge proof for encryption validity
- **Emits**: `GradeSet(student, subject)`

##### `getEncryptedGrade(address student, uint8 subject) returns (euint32)`
- **Access**: Public view function
- **Purpose**: Retrieve encrypted grade handle
- **Returns**: Encrypted grade (cannot be decrypted without proper authorization)

##### `allowViewer(uint8 subject, address viewer)`
- **Access**: Student only (must be grade owner)
- **Purpose**: Grant a viewer permission to decrypt specific subject grade
- **Emits**: `ViewerAllowed(student, subject, viewer)`

#### Access Control Logic

```solidity
// Automatic permissions when grade is set
FHE.allowThis(enc);      // Contract can read handle
FHE.allow(enc, owner);    // Teacher can decrypt
FHE.allow(enc, student);  // Student can decrypt

// Student can grant additional viewers
FHE.allow(enc, viewer);   // Authorized viewer can decrypt
```

#### Events

```solidity
event GradeSet(address indexed student, uint8 indexed subject);
event ViewerAllowed(address indexed student, uint8 indexed subject, address indexed viewer);
```

### Deployed Addresses

- **Sepolia Testnet**: `0xb6B49EE5A726412464aB0d5F0F97dDEEABe91186`

## Frontend Application

### Component Structure

```
app/src/
├── components/
│   ├── GradesApp.tsx          # Main application with tab navigation
│   ├── Header.tsx             # Wallet connection header
│   ├── TeacherSetGrades.tsx   # Teacher interface for setting grades
│   ├── MyGrades.tsx           # Student interface for viewing grades
│   ├── ShareGrade.tsx         # Student interface for sharing grades
│   └── ViewSharedGrade.tsx    # Viewer interface for accessing shared grades
├── hooks/
│   ├── useZamaInstance.ts     # Hook for Zama FHE instance
│   └── useEthersSigner.ts     # Hook for Ethers.js signer
└── config/
    ├── contracts.ts           # Contract address and ABI
    └── wagmi.ts               # Wagmi configuration
```

### Key Hooks

#### `useZamaInstance()`
- Initializes Zama FHE instance for encryption/decryption
- Manages loading state
- Returns instance for creating encrypted inputs and decrypting values

#### `useEthersSigner()`
- Converts Wagmi client to Ethers.js signer
- Enables transaction signing
- Compatible with both libraries

### User Workflows

#### Teacher Workflow
1. Connect wallet to Sepolia network
2. Navigate to "Teacher: Set Grade" tab
3. Input student address, select subject, enter grade
4. Submit transaction (requires ETH for gas)
5. Wait for confirmation

#### Student Workflow
1. Connect wallet to Sepolia network
2. Navigate to "My Grades" tab
3. Select subject from dropdown
4. Click "Decrypt" button
5. Sign EIP-712 message for decryption authorization
6. View decrypted grade

#### Sharing Workflow
1. Student navigates to "Share My Grade" tab
2. Selects subject to share
3. Inputs viewer's Ethereum address
4. Submits transaction to grant permission
5. Viewer can now decrypt that specific grade

#### Viewer Workflow
1. Connect wallet to Sepolia network
2. Navigate to "View Shared Grade" tab
3. Input student address and select subject
4. Click "Decrypt" button
5. If authorized, view decrypted grade

## Testing

### Unit Tests

The test suite (`test/StudentGrades.ts`) covers:

#### Test Case 1: Teacher Sets Grade, Student Decrypts
```javascript
it("teacher can set and student can decrypt", async function () {
  const subject = 1; // Mathematics
  const grade = 95;

  // Teacher encrypts and sets grade
  const enc = await fhevm.createEncryptedInput(address, teacher.address)
    .add32(grade)
    .encrypt();

  await contract.connect(teacher)
    .setGrade(alice.address, subject, enc.handles[0], enc.inputProof);

  // Student decrypts grade
  const handle = await contract.getEncryptedGrade(alice.address, subject);
  const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, address, alice);

  expect(clear).to.eq(grade);
});
```

#### Test Case 2: Viewer Authorization
```javascript
it("viewer cannot decrypt until allowed, then can", async function () {
  // Teacher sets grade
  await contract.connect(teacher).setGrade(alice.address, subject, enc.handles[0], enc.inputProof);

  // Bob cannot decrypt before authorization (expect failure)
  let failed = false;
  try {
    await fhevm.userDecryptEuint(FhevmType.euint32, handle, address, bob);
  } catch {
    failed = true;
  }
  expect(failed).to.eq(true);

  // Alice authorizes Bob
  await contract.connect(alice).allowViewer(subject, bob.address);

  // Bob can now decrypt
  const dec = await fhevm.userDecryptEuint(FhevmType.euint32, handle, address, bob);
  expect(dec).to.eq(grade);
});
```

### Running Tests

```bash
# Local mock FHEVM tests
npm run test

# Sepolia testnet tests (requires ETH)
npm run test:sepolia
```

### Coverage Report

```bash
npm run coverage
```

Coverage report will be generated in `coverage/` directory.

## Deployment

### Local Development Network

```bash
# Terminal 1: Start local Hardhat node
npm run chain

# Terminal 2: Deploy contracts
npm run deploy:localhost
```

### Sepolia Testnet Deployment

#### Step 1: Fund Wallet
Ensure your deployment wallet has Sepolia ETH. Get testnet ETH from:
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Alchemy Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)

#### Step 2: Configure Environment
```bash
npx hardhat vars set PRIVATE_KEY
npx hardhat vars set INFURA_API_KEY
```

#### Step 3: Deploy
```bash
npm run deploy:sepolia
```

#### Step 4: Verify on Etherscan
```bash
npm run verify:sepolia -- <DEPLOYED_CONTRACT_ADDRESS>
```

#### Step 5: Update Frontend Configuration
Edit `app/src/config/contracts.ts`:
```typescript
export const CONTRACT_ADDRESS = '0xYourDeployedAddress';
```

### Deployment Scripts

Located in `deploy/deploy.ts`:

```typescript
const deployed = await deploy("StudentGrades", {
  from: deployer,
  log: true,
});
```

## Security Considerations

### Smart Contract Security

#### Access Control
- `setGrade()`: Protected by owner-only modifier
- `allowViewer()`: Only grade owner (student) can grant access
- Input validation for subject IDs (0-4 range)

#### FHE Security Properties
- **Ciphertext Indistinguishability**: Encrypted grades are computationally indistinguishable from random data
- **Zero-Knowledge Proofs**: Input proofs verify encryption validity without revealing plaintext
- **ACL Enforcement**: FHEVM ACL system prevents unauthorized decryption attempts

#### Potential Vulnerabilities & Mitigations

**Reentrancy**: Not applicable (no external calls in state-changing functions)

**Integer Overflow**: Solidity 0.8.x has built-in overflow protection

**Front-Running**: Grade values are encrypted, so front-running provides no advantage

**Access Control Bypass**: ACL enforced at protocol level by FHEVM

### Frontend Security

#### Private Key Management
- Never expose private keys in frontend code
- Use hardware wallets for production teacher accounts
- Implement multi-sig for critical operations

#### Signature Security
- EIP-712 signatures prevent signature replay across different contracts
- Timestamp and duration parameters limit decryption request validity
- Signatures are tied to specific contract addresses

#### Network Security
- All RPC calls use HTTPS
- Infura provides DDoS protection
- Frontend served over HTTPS in production

### Operational Security

#### Best Practices for Teachers
1. Use dedicated wallet for teacher role
2. Never share private keys
3. Verify student addresses before setting grades
4. Monitor GradeSet events for unauthorized activity

#### Best Practices for Students
1. Carefully verify viewer addresses before granting access
2. Monitor ViewerAllowed events
3. Use hardware wallet for long-term grade storage
4. Backup wallet recovery phrase securely

#### Privacy Considerations
- Grade values never appear in transaction data
- Blockchain explorers show only encrypted handles
- Event logs contain addresses and subjects but not grades
- Decryption occurs entirely off-chain via relayer

## Future Roadmap

### Phase 1: Core Enhancements (Q2 2025)
- [ ] **Batch Grade Setting**: Allow teachers to set multiple grades in one transaction
- [ ] **Grade History**: Track grade updates over time with versioning
- [ ] **Multi-Teacher Support**: Role-based access for multiple teachers
- [ ] **Subject Customization**: Allow institutions to define custom subjects
- [ ] **Mobile Application**: React Native app for iOS and Android

### Phase 2: Advanced Features (Q3 2025)
- [ ] **Weighted GPA Calculation**: On-chain FHE computation of encrypted GPAs
- [ ] **Credential Issuance**: NFT-based diplomas with encrypted grade proofs
- [ ] **Selective Disclosure Proofs**: Zero-knowledge proofs for grade ranges (e.g., "GPA > 3.5") without revealing exact values
- [ ] **Time-Limited Sharing**: Auto-expiring viewer permissions
- [ ] **Revocation Mechanism**: Students can revoke previously granted access

### Phase 3: Institutional Integration (Q4 2025)
- [ ] **Multi-Institution Network**: Cross-institution grade sharing protocol
- [ ] **DID Integration**: Decentralized identity for students and teachers
- [ ] **IPFS Storage**: Store additional academic documents off-chain with encrypted links
- [ ] **Oracle Integration**: Chainlink oracles for real-world credential verification
- [ ] **Governance Module**: DAO for protocol upgrades and parameter changes

### Phase 4: Scalability & Performance (Q1 2026)
- [ ] **Layer 2 Deployment**: Optimism/Arbitrum integration for lower gas costs
- [ ] **Gasless Transactions**: Meta-transactions for students (institution-sponsored gas)
- [ ] **Batch Decryption**: Decrypt multiple grades in single relayer call
- [ ] **Caching Layer**: Frontend caching for improved performance
- [ ] **Progressive Web App**: Offline-capable PWA

### Phase 5: Analytics & Insights (Q2 2026)
- [ ] **Encrypted Analytics**: FHE-based statistics without revealing individual grades
- [ ] **Teacher Dashboard**: Aggregated class performance (encrypted)
- [ ] **Student Progress Tracking**: Trend analysis while maintaining privacy
- [ ] **Recommendation Engine**: Encrypted AI-driven academic recommendations

### Phase 6: Compliance & Standards (Q3 2026)
- [ ] **FERPA Compliance**: Alignment with educational privacy regulations
- [ ] **GDPR Features**: Right to erasure and data portability
- [ ] **Accessibility (WCAG 2.1)**: Full accessibility compliance
- [ ] **Interoperability Standards**: Integration with existing student information systems
- [ ] **Audit Logging**: Enhanced logging for institutional compliance

### Research & Innovation
- **FHE Performance**: Optimize encryption/decryption speeds
- **Novel Privacy Primitives**: Research homomorphic comparison for grade rankings
- **Quantum Resistance**: Prepare for post-quantum cryptography
- **Cross-Chain Bridges**: Enable grade portability across blockchains

## Contributing

We welcome contributions from the community! Here's how you can help:

### Areas for Contribution
- Smart contract optimization
- Frontend UI/UX improvements
- Documentation enhancements
- Test coverage expansion
- Bug reports and fixes
- Feature suggestions

### Contribution Process

1. **Fork the Repository**
```bash
git clone https://github.com/yourusername/fhe-student-grade.git
cd fhe-student-grade
git checkout -b feature/your-feature-name
```

2. **Make Changes**
- Follow existing code style
- Add tests for new features
- Update documentation

3. **Run Tests**
```bash
npm run test
npm run lint
```

4. **Submit Pull Request**
- Describe changes clearly
- Reference related issues
- Ensure CI passes

### Code Style
- **Solidity**: Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- **TypeScript**: ESLint configuration enforced
- **React**: Functional components with hooks
- **Formatting**: Prettier with project config

### Reporting Issues
- Use GitHub Issues
- Provide detailed reproduction steps
- Include environment details (Node version, network, etc.)

## License

This project is licensed under the **BSD-3-Clause-Clear License**.

### Key Points
- Permissive open-source license
- Allows commercial and private use
- Requires attribution and license inclusion
- No patent grant (Clear clause)
- No warranty provided

See the [LICENSE](LICENSE) file for full details.

## Acknowledgments

### Built With
- **Zama**: For pioneering FHEVM technology and providing the encryption infrastructure
- **Ethereum Foundation**: For the blockchain platform
- **Hardhat**: For the excellent development framework
- **RainbowKit & Wagmi**: For seamless wallet integration

### Special Thanks
- Zama team for technical support and documentation
- FHEVM community for early feedback
- Open-source contributors

## Resources & Documentation

### Official Documentation
- [Zama FHEVM Docs](https://docs.zama.ai/fhevm)
- [FHEVM Hardhat Plugin](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat)
- [Zama Relayer SDK](https://docs.zama.ai/protocol/client-apis/relayer-api)

### Tutorials
- [FHEVM Quick Start](https://docs.zama.ai/protocol/solidity-guides/getting-started/quick-start-tutorial)
- [Writing FHE Smart Contracts](https://docs.zama.ai/protocol/solidity-guides/development-guide/smart-contract)
- [Testing FHE Contracts](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat/write_test)

### Community
- **Discord**: [Zama Discord](https://discord.gg/zama)
- **GitHub Issues**: [Report bugs or request features](https://github.com/zama-ai/fhevm/issues)
- **Zama Blog**: [Latest updates and tutorials](https://www.zama.ai/blog)

### Academic Papers
- [TFHE: Fast Fully Homomorphic Encryption over the Torus](https://eprint.iacr.org/2018/421)
- [Programmable Bootstrap for TFHE](https://eprint.iacr.org/2020/086)

## FAQ

### General Questions

**Q: What is Fully Homomorphic Encryption (FHE)?**
A: FHE is a form of encryption that allows computations to be performed on encrypted data without decrypting it first. This enables privacy-preserving smart contracts where sensitive data remains encrypted even during execution.

**Q: Why use blockchain for grade management?**
A: Blockchain provides immutability, transparency, and decentralization. Combined with FHE, it offers privacy, tamper-proof records, and student data sovereignty - solving major problems with traditional centralized systems.

**Q: Is this production-ready?**
A: This is currently a proof-of-concept deployed on Sepolia testnet. While the core technology is sound, additional auditing, testing, and feature development are needed for production deployment at scale.

### Technical Questions

**Q: What are the gas costs?**
A: FHE operations are more expensive than standard transactions. On Sepolia:
- Setting grade: ~200,000-300,000 gas
- Allowing viewer: ~50,000-100,000 gas
- Reading encrypted handle: Free (view function)

**Q: How fast is decryption?**
A: Client-side decryption via Zama relayer typically takes 1-3 seconds depending on network conditions and relayer load.

**Q: Can grades be modified after being set?**
A: Yes, teachers can call `setGrade()` again with the same student and subject to update a grade. The blockchain event history will show all modifications.

**Q: What prevents a teacher from seeing all student grades?**
A: While the teacher (contract owner) has permission to decrypt grades they set, the decryption still requires creating a proper EIP-712 signature and calling the relayer. The ACL system prevents unauthorized bulk decryption.

**Q: Is this vulnerable to quantum computers?**
A: Current FHE schemes are based on lattice cryptography, which is believed to be quantum-resistant. However, long-term quantum security requires ongoing cryptographic updates.

### Privacy Questions

**Q: What data is visible on the blockchain?**
A: Public data includes:
- Student addresses (pseudonymous)
- Subject IDs
- Encrypted grade handles (indistinguishable from random data)
- Event timestamps
Grade values are never exposed on-chain.

**Q: Can validators/miners see grades?**
A: No. Validators and miners only see encrypted ciphertexts. FHE ensures that computation happens on encrypted data, so no party in the blockchain network can view plaintext grades.

**Q: What if I lose my wallet?**
A: Losing your wallet means losing access to decrypt your grades. Recovery mechanisms (multi-sig, social recovery) can be implemented in future versions. Always backup your recovery phrase securely.

---

## Contact & Support

For questions, feedback, or support:
- **GitHub Issues**: [Create an issue](https://github.com/yourusername/fhe-student-grade/issues)
- **Email**: your.email@example.com
- **Twitter**: [@yourhandle](https://twitter.com/yourhandle)

---

**Built with privacy, powered by mathematics, secured by blockchain.**

*Making education data sovereign, one encrypted grade at a time.*
