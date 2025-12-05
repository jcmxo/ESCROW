"use client";

import { useState, useEffect } from "react";
import { useEthereum } from "@/lib/ethereum";
import { ESCROW_ADDRESS, ESCROW_ABI, ERC20_ABI } from "@/lib/contracts";
import { Contract } from "ethers";

interface Token {
  address: string;
  symbol: string;
}

export default function AddToken() {
  const { signer, account, isConnected } = useEthereum();
  const [tokenAddress, setTokenAddress] = useState("");
  const [allowedTokens, setAllowedTokens] = useState<Token[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (isConnected && signer) {
      loadTokens();
      checkOwner();
    }
  }, [isConnected, signer, account]);

  const checkOwner = async () => {
    if (!signer) return;
    try {
      const escrowContract = new Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
      const owner = await escrowContract.owner();
      setIsOwner(owner.toLowerCase() === account?.toLowerCase());
    } catch (error) {
      console.error("Error checking owner:", error);
      setIsOwner(false);
    }
  };

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

  const handleAddToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer || !isOwner) return;

    setLoading(true);
    setMessage(null);

    try {
      const escrowContract = new Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
      const tx = await escrowContract.addToken(tokenAddress);
      await tx.wait();
      
      setMessage({ type: "success", text: "Token added successfully!" });
      setTokenAddress("");
      await loadTokens();
    } catch (error: any) {
      console.error("Error adding token:", error);
      setMessage({
        type: "error",
        text: error.reason || error.message || "Failed to add token",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Add Token (Admin Only)</h2>
        <p className="text-gray-500">Please connect your wallet first</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Add Token (Admin Only)</h2>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Escrow Contract:</p>
        <p className="text-xs font-mono text-gray-800 break-all">{ESCROW_ADDRESS}</p>
      </div>

      {!isOwner && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded text-yellow-800 text-sm">
          You are not the owner of this contract
        </div>
      )}

      {isOwner && (
        <form onSubmit={handleAddToken} className="mb-4">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Token Address</label>
            <input
              type="text"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Adding..." : "Add Token"}
          </button>
        </form>
      )}

      {message && (
        <div
          className={`p-3 rounded text-sm ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Added Tokens ({allowedTokens.length})</h3>
        {allowedTokens.length === 0 ? (
          <p className="text-gray-500 text-sm">No tokens added yet</p>
        ) : (
          <div className="space-y-2">
            {allowedTokens.map((token, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 rounded border border-gray-200"
              >
                <p className="font-semibold">{token.symbol}</p>
                <p className="text-xs font-mono text-gray-600 break-all">
                  {token.address}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

