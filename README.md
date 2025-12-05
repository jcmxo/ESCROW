# Escrow DApp

A decentralized application (DApp) for secure token exchanges using an escrow smart contract.

## Project Structure

```
.
├── sc/                    # Smart Contracts (Foundry)
│   ├── src/
│   │   └── Escrow.sol    # Main escrow contract
│   ├── script/
│   │   └── Deploy.s.sol  # Deployment script
│   └── test/
│       └── Escrow.t.sol  # Contract tests
│
├── web/                   # Frontend (Next.js 14)
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   └── lib/              # Utilities and contracts
│
└── deploy.sh             # Automated deployment script
```

## Prerequisites

- Node.js 18+ and npm
- Foundry (for smart contracts)
- Anvil (local blockchain)
- MetaMask browser extension

## Setup

### 1. Install Foundry (if not already installed)

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### 2. Install Smart Contract Dependencies

```bash
cd sc
forge install OpenZeppelin/openzeppelin-contracts --no-commit
```

### 3. Install Frontend Dependencies

```bash
cd web
npm install
```

## Running the Project

### 1. Start Anvil (Local Blockchain)

```bash
anvil
```

Keep this terminal running. Anvil will start on `http://localhost:8545` with Chain ID `31337`.

### 2. Deploy Contracts

In a new terminal:

```bash
./deploy.sh
```

This will:
- Deploy the Escrow contract
- Deploy two test tokens (TokenA and TokenB)
- Add tokens to the escrow
- Distribute tokens to test accounts
- Update `web/lib/contracts.ts` with contract addresses

### 3. Configure MetaMask

1. Add a new network:
   - Network Name: `Anvil Local`
   - RPC URL: `http://localhost:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

2. Import test accounts using private keys (shown in `deployment-info.txt`):
   - Account #0: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - Account #1: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
   - Account #2: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`

### 4. Start Frontend

```bash
cd web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Connect Wallet**: Click "Connect Wallet" and approve the connection in MetaMask
2. **Add Tokens** (Owner only): Add ERC20 tokens that can be used in escrow operations
3. **Create Operation**: Create a new escrow operation by selecting tokens and amounts
4. **Complete Operation**: As a different user, complete an active operation
5. **Cancel Operation**: As the creator, cancel your own active operation
6. **View Balances**: Use the Debug Balances panel to monitor token balances

## Testing

Run Foundry tests:

```bash
cd sc
forge test
```

## License

MIT

