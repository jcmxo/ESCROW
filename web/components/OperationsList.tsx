"use client";

import { useState, useEffect } from "react";
import { useEthereum } from "@/lib/ethereum";
import { ESCROW_ADDRESS, ESCROW_ABI, ERC20_ABI } from "@/lib/contracts";
import { Contract, formatUnits } from "ethers";

interface Operation {
  id: bigint;
  creator: string;
  tokenA: string;
  tokenB: string;
  amountA: bigint;
  amountB: bigint;
  isActive: boolean;
  createdAt: bigint;
  closedAt: bigint;
}

interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
}

export default function OperationsList() {
  const { signer, account, isConnected } = useEthereum();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [tokenInfo, setTokenInfo] = useState<Map<string, TokenInfo>>(new Map());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (isConnected && signer) {
      loadOperations();
      const interval = setInterval(loadOperations, 5000);
      return () => clearInterval(interval);
    }
  }, [isConnected, signer, account]);

  const loadTokenInfo = async (address: string): Promise<TokenInfo> => {
    if (tokenInfo.has(address)) {
      return tokenInfo.get(address)!;
    }
    if (!signer) throw new Error("No signer");
    
    try {
      const tokenContract = new Contract(address, ERC20_ABI, signer);
      const [symbol, decimals] = await Promise.all([
        tokenContract.symbol(),
        tokenContract.decimals(),
      ]);
      const info = { address, symbol, decimals: Number(decimals) };
      setTokenInfo((prev) => new Map(prev).set(address, info));
      return info;
    } catch (error) {
      return { address, symbol: "Unknown", decimals: 18 };
    }
  };

  const loadOperations = async () => {
    if (!signer) return;
    try {
      const escrowContract = new Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
      const ops = await escrowContract.getAllOperations();
      
      // Load token info for all operations
      const tokenAddresses = new Set<string>();
      ops.forEach((op: Operation) => {
        tokenAddresses.add(op.tokenA);
        tokenAddresses.add(op.tokenB);
      });
      
      await Promise.all(Array.from(tokenAddresses).map(loadTokenInfo));
      
      setOperations(ops);
    } catch (error) {
      console.error("Error loading operations:", error);
      setOperations([]);
    }
  };

  const handleCompleteOperation = async (operationId: bigint, tokenB: string, amountB: bigint) => {
    if (!signer || !account) return;

    setLoading(true);
    setMessage(null);

    try {
      const tokenInfoB = await loadTokenInfo(tokenB);
      const tokenBContract = new Contract(tokenB, ERC20_ABI, signer);

      // Approve tokenB
      const approveTx = await tokenBContract.approve(ESCROW_ADDRESS, amountB);
      console.log("Approve transaction hash:", approveTx.hash);
      await approveTx.wait();

      // Complete operation
      const escrowContract = new Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
      const completeTx = await escrowContract.completeOperation(operationId);
      console.log("Complete operation transaction hash:", completeTx.hash);
      const receipt = await completeTx.wait();
      console.log("Transaction receipt:", receipt);

      const explorerUrl = `https://sepolia.etherscan.io/tx/${completeTx.hash}`;
      setMessage({ 
        type: "success", 
        text: `Operation completed! Transaction: ${completeTx.hash.slice(0, 10)}...${completeTx.hash.slice(-8)}` 
      });
      await loadOperations();
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error("Error completing operation:", error);
      setMessage({
        type: "error",
        text: error.reason || error.message || "Failed to complete operation",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOperation = async (operationId: bigint) => {
    if (!signer || !account) return;

    setLoading(true);
    setMessage(null);

    try {
      const escrowContract = new Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
      const cancelTx = await escrowContract.cancelOperation(operationId);
      console.log("Cancel operation transaction hash:", cancelTx.hash);
      const receipt = await cancelTx.wait();
      console.log("Transaction receipt:", receipt);

      setMessage({ 
        type: "success", 
        text: `Operation cancelled! Transaction: ${cancelTx.hash.slice(0, 10)}...${cancelTx.hash.slice(-8)}` 
      });
      await loadOperations();
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error("Error cancelling operation:", error);
      setMessage({
        type: "error",
        text: error.reason || error.message || "Failed to cancel operation",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: bigint) => {
    if (timestamp === BigInt(0)) return "N/A";
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  if (!isConnected) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Operations</h2>
        <p className="text-gray-500">Please connect your wallet first</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Operations</h2>
        <button
          onClick={loadOperations}
          className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 transition"
        >
          Refresh
        </button>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded text-sm ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {operations.length === 0 ? (
        <p className="text-gray-500">No operations yet.</p>
      ) : (
        <div className="space-y-4">
          {operations.map((op) => {
            const tokenAInfo = tokenInfo.get(op.tokenA) || { symbol: "Unknown", decimals: 18 };
            const tokenBInfo = tokenInfo.get(op.tokenB) || { symbol: "Unknown", decimals: 18 };
            const amountAFormatted = formatUnits(op.amountA, tokenAInfo.decimals);
            const amountBFormatted = formatUnits(op.amountB, tokenBInfo.decimals);
            const isCreator = account?.toLowerCase() === op.creator.toLowerCase();

            return (
              <div
                key={op.id.toString()}
                className="p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">Operation #{op.id.toString()}</h3>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      op.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {op.isActive ? "Active" : "Closed"}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Creator: {op.creator.slice(0, 6)}...{op.creator.slice(-4)}
                </p>
                <p className="text-sm mb-1">
                  Offering: {amountAFormatted} {tokenAInfo.symbol}
                </p>
                <p className="text-sm mb-2">
                  Requesting: {amountBFormatted} {tokenBInfo.symbol}
                </p>
                {!op.isActive && op.closedAt > BigInt(0) && (
                  <p className="text-xs text-gray-500 mb-2">
                    Closed at {formatDate(op.closedAt)}
                  </p>
                )}
                {op.isActive && (
                  <div className="mt-3">
                    {isCreator ? (
                      <button
                        onClick={() => handleCancelOperation(op.id)}
                        disabled={loading}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                      >
                        Cancel Operation
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCompleteOperation(op.id, op.tokenB, op.amountB)}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                      >
                        Complete Operation
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

