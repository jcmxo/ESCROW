"use client";

import { useState, useEffect } from "react";
import { useEthereum } from "@/lib/ethereum";
import { ESCROW_ADDRESS, ESCROW_ABI } from "@/lib/contracts";
import { Contract } from "ethers";

interface TransactionEvent {
  event: string;
  operationId?: bigint;
  address?: string;
  tokenA?: string;
  tokenB?: string;
  amountA?: bigint;
  amountB?: bigint;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
}

export default function TransactionHistory() {
  const { signer, provider, isConnected } = useEthereum();
  const [transactions, setTransactions] = useState<TransactionEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [explorerUrls, setExplorerUrls] = useState<Map<string, string | null>>(new Map());

  const loadTransactionHistory = async () => {
    if (!signer || !provider) return;

    setLoading(true);
    try {
      const escrowContract = new Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
      
      // Get current block number
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000); // Last 10000 blocks

      // Query all events
      const [createdEvents, completedEvents, cancelledEvents, tokenAddedEvents] = await Promise.all([
        escrowContract.queryFilter(escrowContract.filters.OperationCreated(), fromBlock),
        escrowContract.queryFilter(escrowContract.filters.OperationCompleted(), fromBlock),
        escrowContract.queryFilter(escrowContract.filters.OperationCancelled(), fromBlock),
        escrowContract.queryFilter(escrowContract.filters.TokenAdded(), fromBlock),
      ]);

      const allTransactions: TransactionEvent[] = [];

      // Process OperationCreated events
      for (const event of createdEvents) {
        const block = await provider.getBlock(event.blockNumber);
        allTransactions.push({
          event: "OperationCreated",
          operationId: event.args?.operationId,
          address: event.args?.creator,
          tokenA: event.args?.tokenA,
          tokenB: event.args?.tokenB,
          amountA: event.args?.amountA,
          amountB: event.args?.amountB,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          timestamp: block?.timestamp || 0,
        });
      }

      // Process OperationCompleted events
      for (const event of completedEvents) {
        const block = await provider.getBlock(event.blockNumber);
        allTransactions.push({
          event: "OperationCompleted",
          operationId: event.args?.operationId,
          address: event.args?.completer,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          timestamp: block?.timestamp || 0,
        });
      }

      // Process OperationCancelled events
      for (const event of cancelledEvents) {
        const block = await provider.getBlock(event.blockNumber);
        allTransactions.push({
          event: "OperationCancelled",
          operationId: event.args?.operationId,
          address: event.args?.creator,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          timestamp: block?.timestamp || 0,
        });
      }

      // Process TokenAdded events
      for (const event of tokenAddedEvents) {
        const block = await provider.getBlock(event.blockNumber);
        allTransactions.push({
          event: "TokenAdded",
          address: event.args?.token,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          timestamp: block?.timestamp || 0,
        });
      }

      // Sort by block number (newest first)
      allTransactions.sort((a, b) => b.blockNumber - a.blockNumber);

      // Get explorer URLs for all transactions
      const urlMap = new Map<string, string | null>();
      for (const tx of allTransactions) {
        const url = await getExplorerUrl(tx.transactionHash);
        urlMap.set(tx.transactionHash, url);
      }
      setExplorerUrls(urlMap);
      setTransactions(allTransactions);
    } catch (error) {
      console.error("Error loading transaction history:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && signer) {
      loadTransactionHistory();
    }
  }, [isConnected, signer]);

  const formatDate = (timestamp: number) => {
    if (timestamp === 0) return "N/A";
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getExplorerUrl = async (txHash: string) => {
    if (!provider) return null;
    try {
      const network = await provider.getNetwork();
      // Anvil local network (chainId 31337) doesn't have a block explorer
      if (network.chainId === 31337n) {
        return null; // No explorer for local network
      }
      // Sepolia testnet
      if (network.chainId === 11155111n) {
        return `https://sepolia.etherscan.io/tx/${txHash}`;
      }
      // Mainnet
      if (network.chainId === 1n) {
        return `https://etherscan.io/tx/${txHash}`;
      }
    } catch (error) {
      console.error("Error getting network:", error);
    }
    return null;
  };

  if (!isConnected) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Transaction History</h2>
        <p className="text-gray-500">Please connect your wallet first</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Transaction History</h2>
        <button
          onClick={loadTransactionHistory}
          disabled={loading}
          className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 transition disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {loading && transactions.length === 0 ? (
        <p className="text-gray-500">Loading transactions...</p>
      ) : transactions.length === 0 ? (
        <p className="text-gray-500">No transactions found.</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {transactions.map((tx, index) => (
            <div
              key={`${tx.transactionHash}-${index}`}
              className="p-3 border border-gray-200 rounded-lg text-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      tx.event === "OperationCreated"
                        ? "bg-blue-100 text-blue-800"
                        : tx.event === "OperationCompleted"
                        ? "bg-green-100 text-green-800"
                        : tx.event === "OperationCancelled"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {tx.event}
                  </span>
                  {tx.operationId !== undefined && (
                    <span className="ml-2 text-gray-600">Operation #{tx.operationId.toString()}</span>
                  )}
                </div>
                {explorerUrls.get(tx.transactionHash) && (
                  <a
                    href={explorerUrls.get(tx.transactionHash)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-xs"
                  >
                    View on Explorer
                  </a>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-1">
                Tx: {tx.transactionHash.slice(0, 10)}...{tx.transactionHash.slice(-8)}
              </p>
              {tx.address && (
                <p className="text-xs text-gray-600 mb-1">
                  Address: {tx.address.slice(0, 6)}...{tx.address.slice(-4)}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Block: {tx.blockNumber} | {formatDate(tx.timestamp)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

