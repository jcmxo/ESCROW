"use client";

import { useState, useEffect } from "react";
import { useEthereum } from "@/lib/ethereum";
import { ESCROW_ADDRESS, ESCROW_ABI, ERC20_ABI } from "@/lib/contracts";
import { Contract, parseUnits, formatUnits } from "ethers";

interface Token {
  address: string;
  symbol: string;
}

export default function CreateOperation() {
  const { signer, account, isConnected } = useEthereum();
  const [allowedTokens, setAllowedTokens] = useState<Token[]>([]);
  const [tokenA, setTokenA] = useState("");
  const [tokenB, setTokenB] = useState("");
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (isConnected && signer) {
      loadTokens();
    }
  }, [isConnected, signer]);

  const loadTokens = async () => {
    if (!signer) return;
    try {
      const escrowContract = new Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
      const tokenAddresses = await escrowContract.getAllowedTokens();
      
      const tokens: Token[] = [];
      for (const addr of tokenAddresses) {
        try {
          const tokenContract = new Contract(addr, ERC20_ABI, signer);
          const symbol = await tokenContract.symbol();
          tokens.push({ address: addr, symbol });
        } catch (error) {
          tokens.push({ address: addr, symbol: "Unknown" });
        }
      }
      setAllowedTokens(tokens);
    } catch (error) {
      console.error("Error loading tokens:", error);
      setAllowedTokens([]);
    }
  };

  const handleCreateOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer || !account) return;

    setLoading(true);
    setMessage(null);

    try {
      const tokenAContract = new Contract(tokenA, ERC20_ABI, signer);
      const decimals = await tokenAContract.decimals();
      const amountAParsed = parseUnits(amountA, decimals);

      // First, approve the escrow contract to spend tokenA
      const approveTx = await tokenAContract.approve(ESCROW_ADDRESS, amountAParsed);
      console.log("Approve transaction hash:", approveTx.hash);
      await approveTx.wait();

      // Then, create the operation
      const escrowContract = new Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
      const tokenBContract = new Contract(tokenB, ERC20_ABI, signer);
      const decimalsB = await tokenBContract.decimals();
      const amountBParsed = parseUnits(amountB, decimalsB);

      const createTx = await escrowContract.createOperation(
        tokenA,
        tokenB,
        amountAParsed,
        amountBParsed
      );
      console.log("Create operation transaction hash:", createTx.hash);
      const receipt = await createTx.wait();
      console.log("Transaction receipt:", receipt);

      setMessage({ 
        type: "success", 
        text: `Operation created! Transaction: ${createTx.hash.slice(0, 10)}...${createTx.hash.slice(-8)}` 
      });
      setTokenA("");
      setTokenB("");
      setAmountA("");
      setAmountB("");
      
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error("Error creating operation:", error);
      setMessage({
        type: "error",
        text: error.reason || error.message || "Failed to create operation",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Create Operation</h2>
        <p className="text-gray-500">Please connect your wallet first</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Create Operation</h2>

      <form onSubmit={handleCreateOperation}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Token A Address (You provide)
          </label>
          <select
            value={tokenA}
            onChange={(e) => setTokenA(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select token...</option>
            {allowedTokens.map((token, index) => (
              <option key={index} value={token.address}>
                {token.symbol} - {token.address.slice(0, 6)}...{token.address.slice(-4)}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Amount A</label>
          <input
            type="number"
            step="0.1"
            value={amountA}
            onChange={(e) => setAmountA(e.target.value)}
            placeholder="0.0"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Token B Address (You want)
          </label>
          <select
            value={tokenB}
            onChange={(e) => setTokenB(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select token...</option>
            {allowedTokens.map((token, index) => (
              <option key={index} value={token.address}>
                {token.symbol} - {token.address.slice(0, 6)}...{token.address.slice(-4)}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Amount B</label>
          <input
            type="number"
            step="0.1"
            value={amountB}
            onChange={(e) => setAmountB(e.target.value)}
            placeholder="0.0"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? "Creating..." : "Create Operation"}
        </button>
      </form>

      {message && (
        <div
          className={`mt-4 p-3 rounded text-sm ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}

