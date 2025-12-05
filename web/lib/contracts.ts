// Contract addresses (updated by deploy.sh)
export const ESCROW_ADDRESS = "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e";
export const TOKENA_ADDRESS = "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0";
export const TOKENB_ADDRESS = "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82";

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

