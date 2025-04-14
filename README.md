# PYUSD Privacy Pool

A decentralized privacy solution for PYUSD transactions using zero-knowledge proofs to ensure transaction confidentiality while maintaining compliance.

## Overview

The PYUSD Privacy Pool allows users to deposit and withdraw PYUSD tokens with enhanced privacy. It leverages blockchain technology and zero-knowledge cryptography to break the on-chain link between depositor and recipient addresses, making it difficult to trace fund transfers while maintaining the integrity of the financial system.

## 🛠 How It Works:

 1. Deposit Phase
 Users generate a secret (random 32 bytes).

  A commitment hash is created:
 commitment = keccak256(amount + secret + timestamp)

 The user deposits PYUSD into the pool with this commitment.

 This hash is saved both on-chain (smart contract) and locally (browser localStorage).

 2. Privacy Layer
 Since no public address is tied to the deposit, there’s no on-chain link between the sender and eventual recipient.

 Only someone with the original secret can later prove they made the deposit.

 3. Withdrawal Phase
 The user provides the same secret and commitment to prove they own the deposit.

 The contract verifies:

 The commitment exists

 It hasn’t been spent before

 A timelock period has passed

 If all checks pass, funds are released to the recipient (can be a different address from the depositor).

### 🔒 Use Cases
Private Transfers

Send PYUSD to someone without the entire world seeing the link between your wallet and theirs.

Private Payrolls

Companies can pay employees or contributors without revealing all salary details publicly on-chain.

Donation Systems

Donors can support causes or projects anonymously while preserving proof of contribution.

DeFi Fund Management

Move capital between protocols or wallets without front-running, tracing, or revealing allocation strategies.

Whale Privacy

Large holders can move funds without triggering bots or affecting price sentiment.

## 🚨 Problem I am Solving
### ❌ Problem:
All on-chain transactions are public, traceable, and link user identities through wallet behavior. This leads to:

Loss of financial privacy

Front-running and MEV attacks

Regulatory challenges (privacy vs compliance)

Reputational risks for DAOs, funds, or individuals

### ✅ MY Solution:
ZKPUSD introduces selective privacy for PYUSD using Zero-Knowledge Proofs, while staying compatible with public chains and EVM standards:

Breaks traceability between deposit and withdrawal

Retains auditability via on-chain commitments

Ensures secure proof-of-ownership without revealing user identity

Uses timelock mechanisms to prevent abuse or immediate withdrawals

## Project Structure

### Core Components

- **`app/page.tsx`**: Main landing page with luxury UI elements and responsive design
- **`app/components/PrivacyPool.tsx`**: Core component that handles all privacy pool interactions
- **`app/globals.css`**: Global styling with luxury design elements
- **`app/config.js`**: Configuration settings for network and contract details
- **`app/components/cons.js`**: Contract ABI definitions
- **`public/grid.svg`**: Background grid pattern for UI enhancement
- **`public/lock-icon.svg`**: Custom lock icon for the privacy pool

### Key Features

1. **Private Transactions**:
   - Deposit PYUSD with commitment hash generation
   - Withdraw PYUSD using commitment proofs
   - Zero-knowledge proofs to verify transactions without revealing user identity

2. **Security Measures**:
   - Timelock mechanism to prevent immediate withdrawals
   - Commitment & secret management for secure transactions
   - Local storage of encrypted commitment data

3. **User Experience**:
   - Luxurious gold & indigo UI design
   - Responsive layout for all device sizes
   - Clear transaction feedback with status messages
   - Wallet connection and network detection

## Technical Implementation

### Smart Contract Integration

The application connects to two main smart contracts:
- **PYUSD Token Contract**: For token approvals and transfers
- **Privacy Pool Contract**: For deposits and withdrawals with zero-knowledge proofs

```javascript
// Creating contract instances
const pyusdContract = new ethers.Contract(
  CONFIG.PYUSD_ADDRESS,
  PYUSD_ABI,
  signer
);

const poolContract = new ethers.Contract(
  CONFIG.POOL_ADDRESS,
  [
    'function deposit(bytes32 commitment, uint256 amount) external',
    'function withdraw(bytes32 commitment, address recipient) external',
    'function isSpent(bytes32 commitment) external view returns (bool)',
    'function getDepositTimestamp(bytes32 commitment) external view returns (uint256)'
  ],
  signer
);
```

### Zero-Knowledge Implementation

The privacy mechanism works through commitment hashes:

1. **Deposit Process**:
   - Generate a random secret: `const secret = ethers.hexlify(ethers.randomBytes(32))`
   - Create a commitment hash: `keccak256(amount + secret + timestamp)`
   - Store funds in the pool associated with this commitment

2. **Withdrawal Process**:
   - Provide the commitment hash to prove ownership
   - Verify the commitment exists and hasn't been spent
   - Check timelock requirements before releasing funds

### Wallet Connection

The application integrates with MetaMask and other Web3 wallets:

```javascript
const connectWallet = async () => {
  if (!window.ethereum) return setError("Please install MetaMask");
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  setCurrentAccount(accounts[0]);
  setIsConnected(true);
  
  // Create provider and signer
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  // ...
};
```

## UI/UX Solutions

### Luxury Design System

- **Color Palette**: Gold (#D4AF37) and indigo with subtle gradients
- **Animation Effects**: Floating, shimmer, pulse, and border glow effects
- **Card Components**: Glass-morphism with subtle shadows and glowing borders
- **Status Indicators**: Clear visual feedback for transactions

### Responsive Considerations

- Adaptive layouts for mobile, tablet, and desktop viewports
- Touch-friendly UI elements with proper spacing
- Optimized loading states with spinners and feedback

## Challenges & Solutions

### Challenge 1: MetaMask Integration
**Problem**: Inconsistent wallet connection across different browsers and devices.  
**Solution**: Implemented robust error handling and multiple connection attempts with clear user feedback.

### Challenge 2: Transaction Privacy
**Problem**: Ensuring transaction privacy while maintaining usability.  
**Solution**: Used commitment-based zero-knowledge approach with local storage for commitment tracking.

### Challenge 3: Contract Gas Issues
**Problem**: Unpredictable gas costs for complex smart contract interactions.  
**Solution**: Implemented manual gas estimation and limits with pre-transaction checks.

### Challenge 4: UI Consistency
**Problem**: Creating a premium feeling interface across all browsers.  
**Solution**: Developed a comprehensive CSS utility system with fallbacks and cross-browser compatibility.

## Getting Started

### Prerequisites

- Node.js (v16+)
- MetaMask or compatible Web3 wallet
- Access to Holesky testnet or compatible network

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/zkpyusd.git
   cd zkpyusd
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   ```
   cp .env.example .env.local
   ```
   Edit `.env.local` with your specific configuration

4. Run the development server:
   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage Instructions

### Depositing PYUSD

1. Connect your wallet
2. Enter the amount to deposit
3. Approve the PYUSD token spending
4. Confirm the deposit transaction
5. **IMPORTANT**: Save the commitment hash and secret - you will need these to withdraw!

### Withdrawing PYUSD

1. Connect your wallet
2. Enter your commitment hash or select from saved commitments
3. Specify a recipient address (or use your current address)
4. Confirm the withdrawal transaction

## Security Considerations

- **Never share your commitment secrets** with anyone
- Always verify transaction details before signing
- The application uses localStorage to store commitments, clear your browser data to remove them
- Network timelock prevents immediate withdrawals for enhanced security

## Advanced Features

### Commitment Management

The application saves commitment details to localStorage for convenient access:

```javascript
// Save to localStorage
const commitmentInfo = {
  commitment: commitment,
  secret: secret,
  timestamp: timestamp,
  amount: amount
};

const savedCommitments = JSON.parse(localStorage.getItem('zkpyusdCommitments') || '[]');
savedCommitments.push(commitmentInfo);
localStorage.setItem('zkpyusdCommitments', JSON.stringify(savedCommitments));
```

### Network Detection

Automatic detection of correct network with one-click switching:

```javascript
const switchNetwork = async () => {
  await window.ethereum.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: NETWORK_DETAILS.chainId }],
  });
};
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Ethers.js for Ethereum interaction
- Next.js for frontend framework
- TailwindCSS for styling
- Zero-knowledge proof technology for privacy enhancement 
