# Escrow DApp

Sistema educativo de depósito en garantía (escrow). Permite simular el flujo completo: depósito, verificación, liberación o devolución de fondos según condiciones. Ideal para aprender lógica de negocio y seguridad en transacciones.

## Descripción

Escrow es un proyecto diseñado para implementar un sistema de depósito en garantía (escrow), pensado para servir como ejercicio académico y educativo. El objetivo es:

- Mostrar de forma práctica cómo funciona un servicio de escrow: recepción de fondos, retención segura, verificación, liberación o cancelación según condiciones pactadas.
- Permitir a estudiantes o desarrolladores en formación entender los mecanismos básicos de escrow, su lógica de negocio, y las implicaciones de seguridad.
- Servir como base modular que puede extenderse — por ejemplo, integrando contratos inteligentes, validaciones, manejo de múltiples monedas, etc.

Este repositorio incluye funcionalidades básicas, documentación paso a paso para instalación y uso, así como buenas prácticas para que puedas estudiarlo, modificarlo y expandirlo a tus necesidades.

## 🧰 ¿Para quién es este proyecto?

- Estudiantes de desarrollo de software que quieren aprender sobre lógica de negocio y flujos de control en escrow.
- Personas interesadas en comprender cómo se maneja un sistema de depósito en garantía (escrow) desde cero.
- Desarrolladores que buscan una base para construir soluciones más completas, ya sea con backend, blockchain, o integración de métodos de pago.

## ⭐ Lo que aprenderás / lo que ofrece

- Comprender la lógica fundamental de un escrow: ¿qué sucede cuando se deposita? ¿qué criterios deben cumplirse para liberar o devolver los fondos?
- Estructura organizada del proyecto, ideal para reutilización o ampliación.
- Guía clara de instalación y uso (envío de fondos, verificación, liberación).
- Buenas prácticas de proyecto: documentación, modularidad, claridad de código — útil tanto para estudiar como para contribuir.

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
│   ├── components/       # React components
│   ├── lib/              # Utilities and contracts
│   └── pages/            # Next.js pages
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

Open [http://localhost:3006](http://localhost:3006) in your browser (or the port configured in `package.json`).

## Usage

1. **Connect Wallet**: Click "Connect Wallet" and approve the connection in MetaMask
2. **Add Tokens** (Owner only): Add ERC20 tokens that can be used in escrow operations
3. **Create Operation**: Create a new escrow operation by selecting tokens and amounts
4. **Complete Operation**: As a different user, complete an active operation
5. **Cancel Operation**: As the creator, cancel your own active operation
6. **View Balances**: Use the Debug Balances panel to monitor token balances
7. **Transaction History**: View all transactions and events in the Transaction History panel

## Features

- ✅ Secure token escrow operations
- ✅ Real-time transaction history
- ✅ Balance monitoring
- ✅ Multi-account support
- ✅ Event tracking and logging

## Testing

Run Foundry tests:

```bash
cd sc
forge test
```

## License

MIT
