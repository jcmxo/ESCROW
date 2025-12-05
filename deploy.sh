#!/bin/bash

set -e

echo "🚀 Starting deployment..."

# Check if Anvil is running
if ! curl -s http://localhost:8545 > /dev/null; then
    echo "❌ Error: Anvil is not running on http://localhost:8545"
    echo "Please start Anvil first: anvil"
    exit 1
fi

# Set private key for deployment (Anvil account 0)
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Navigate to smart contracts directory
cd sc

echo "📦 Installing dependencies..."
if [ ! -d "lib/openzeppelin-contracts" ]; then
    forge install OpenZeppelin/openzeppelin-contracts
fi

echo "🔨 Compiling contracts..."
forge build

echo "🚀 Deploying contracts..."
forge script script/Deploy.s.sol:DeployScript --rpc-url anvil --broadcast -vvv

# Extract contract addresses from broadcast logs
BROADCAST_FILE="broadcast/Deploy.s.sol/31337/run-latest.json"

if [ -f "$BROADCAST_FILE" ]; then
    # Extract addresses from broadcast file
    ESCROW_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "Escrow") | .contractAddress' "$BROADCAST_FILE" 2>/dev/null | head -n 1 || echo "")
    
    # Get all SimpleToken deployments
    TOKEN_ADDRESSES=($(jq -r '.transactions[] | select(.contractName == "SimpleToken") | select(.contractAddress != null) | .contractAddress' "$BROADCAST_FILE" 2>/dev/null))
    
    if [ ${#TOKEN_ADDRESSES[@]} -ge 2 ]; then
        TOKENA_ADDRESS="${TOKEN_ADDRESSES[0]}"
        TOKENB_ADDRESS="${TOKEN_ADDRESSES[1]}"
    else
        TOKENA_ADDRESS=""
        TOKENB_ADDRESS=""
    fi
    
    # Fallback: try to extract from console output
    if [ -z "$ESCROW_ADDRESS" ]; then
        ESCROW_ADDRESS=$(grep -oP "Escrow deployed at: \K0x[a-fA-F0-9]{40}" "$BROADCAST_FILE" 2>/dev/null | head -n 1 || echo "")
    fi
else
    echo "⚠️  Warning: Broadcast file not found. Contract addresses may not be updated."
    ESCROW_ADDRESS=""
    TOKENA_ADDRESS=""
    TOKENB_ADDRESS=""
fi

cd ..

# Create deployment info file
cat > deployment-info.txt << EOF
Deployment Information
=====================
Date: $(date)

Escrow Contract: $ESCROW_ADDRESS
TokenA (TKA): $TOKENA_ADDRESS
TokenB (TKB): $TOKENB_ADDRESS

Test Accounts (Anvil):
- Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
- Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
- Account #2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC

Private Keys (for MetaMask):
- Account #0: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
- Account #1: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
- Account #2: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
EOF

echo ""
echo "✅ Deployment complete!"
echo ""
cat deployment-info.txt

# Update contracts.ts if web directory exists
if [ -d "web" ] && [ -n "$ESCROW_ADDRESS" ]; then
    echo ""
    echo "📝 Updating web/lib/contracts.ts..."
    
    # Read the Escrow ABI (simplified - in production, use the actual ABI)
    cat > web/lib/contracts.ts << EOF
// Contract addresses (updated by deploy.sh)
export const ESCROW_ADDRESS = "$ESCROW_ADDRESS";
export const TOKENA_ADDRESS = "$TOKENA_ADDRESS";
export const TOKENB_ADDRESS = "$TOKENB_ADDRESS";

// Escrow ABI
export const ESCROW_ABI = [
  "function addToken(address token)",
  "function createOperation(address tokenA, address tokenB, uint256 amountA, uint256 amountB)",
  "function completeOperation(uint256 operationId)",
  "function cancelOperation(uint256 operationId)",
  "function getAllowedTokens() view returns (address[])",
  "function getAllOperations() view returns ((uint256 id, address creator, address tokenA, address tokenB, uint256 amountA, uint256 amountB, bool isActive, uint256 createdAt, uint256 closedAt)[])",
  "function getOperation(uint256 operationId) view returns ((uint256 id, address creator, address tokenA, address tokenB, uint256 amountA, uint256 amountB, bool isActive, uint256 createdAt, uint256 closedAt))",
  "function owner() view returns (address)",
  "event TokenAdded(address indexed token)",
  "event OperationCreated(uint256 indexed operationId, address indexed creator, address indexed tokenA, address tokenB, uint256 amountA, uint256 amountB)",
  "event OperationCompleted(uint256 indexed operationId, address indexed completer, address indexed creator)",
  "event OperationCancelled(uint256 indexed operationId, address indexed creator)"
] as const;

// ERC20 ABI
export const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function name() view returns (string)"
] as const;
EOF

    echo "✅ contracts.ts updated"
fi

echo ""
echo "🎉 All done! You can now start the frontend with: cd web && npm run dev"

