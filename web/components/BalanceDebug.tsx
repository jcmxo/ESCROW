"use client";

import { useState, useEffect } from "react";
import { useEthereum } from "@/lib/ethereum";
import { ESCROW_ADDRESS, ESCROW_ABI, ERC20_ABI } from "@/lib/contracts";
import { Contract, formatEther, formatUnits } from "ethers";

interface Balance {
  eth: string;
  tokens: { address: string; symbol: string; balance: string }[];
}

const TEST_ACCOUNTS = [
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
];

export default function BalanceDebug() {
  const { provider, signer, isConnected } = useEthereum();
  const [balances, setBalances] = useState<Map<string, Balance>>(new Map());
  const [allowedTokens, setAllowedTokens] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected && provider) {
      loadBalances();
    }
  }, [isConnected, provider]);

  const loadBalances = async () => {
    if (!provider) return;
    setLoading(true);

    try {
      // Get allowed tokens
      if (signer) {
        try {
          const escrowContract = new Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
          const tokens = await escrowContract.getAllowedTokens();
          setAllowedTokens(tokens);
        } catch (error) {
          console.error("Error loading allowed tokens:", error);
          setAllowedTokens([]);
        }
      }

      const newBalances = new Map<string, Balance>();

      // Load Escrow Contract balance
      const escrowEthBalance = await provider.getBalance(ESCROW_ADDRESS);
      const escrowBalance: Balance = {
        eth: formatEther(escrowEthBalance),
        tokens: [],
      };

      if (allowedTokens.length > 0 && signer) {
        for (const tokenAddress of allowedTokens) {
          try {
            const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);
            const [balance, symbol, decimals] = await Promise.all([
              tokenContract.balanceOf(ESCROW_ADDRESS),
              tokenContract.symbol(),
              tokenContract.decimals(),
            ]);
            escrowBalance.tokens.push({
              address: tokenAddress,
              symbol,
              balance: formatUnits(balance, decimals),
            });
          } catch (error) {
            console.error(`Error loading token ${tokenAddress}:`, error);
          }
        }
      }

      newBalances.set(ESCROW_ADDRESS, escrowBalance);

      // Load test account balances
      for (const account of TEST_ACCOUNTS) {
        const ethBalance = await provider.getBalance(account);
        const accountBalance: Balance = {
          eth: formatEther(ethBalance),
          tokens: [],
        };

        if (allowedTokens.length > 0 && signer) {
          for (const tokenAddress of allowedTokens) {
            try {
              const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);
              const [balance, symbol, decimals] = await Promise.all([
                tokenContract.balanceOf(account),
                tokenContract.symbol(),
                tokenContract.decimals(),
              ]);
              accountBalance.tokens.push({
                address: tokenAddress,
                symbol,
                balance: formatUnits(balance, decimals),
              });
            } catch (error) {
              console.error(`Error loading token ${tokenAddress} for ${account}:`, error);
            }
          }
        }

        newBalances.set(account, accountBalance);
      }

      setBalances(newBalances);
    } catch (error) {
      console.error("Error loading balances:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAccountLabel = (address: string) => {
    if (address === ESCROW_ADDRESS) return "Escrow Contract";
    const index = TEST_ACCOUNTS.indexOf(address);
    return index >= 0 ? `Account #${index}` : address;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Debug Balances</h2>
        <button
          onClick={loadBalances}
          disabled={loading}
          className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 transition"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {!isConnected && (
        <p className="text-gray-500">Please connect your wallet to view balances</p>
      )}

      {isConnected && (
        <div className="space-y-4">
          {Array.from(balances.entries()).map(([address, balance]) => (
            <div key={address} className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-semibold mb-2">
                {getAccountLabel(address)}
                {address === ESCROW_ADDRESS && (
                  <span className="ml-2 text-xs text-blue-600">(Contract)</span>
                )}
              </h3>
              <p className="text-xs font-mono text-gray-600 mb-2 break-all">
                {address}
              </p>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-medium">ETH:</span> {parseFloat(balance.eth).toFixed(4)}
                </p>
                {balance.tokens.length === 0 ? (
                  <p className="text-sm text-gray-500">No tokens yet</p>
                ) : (
                  balance.tokens.map((token, index) => (
                    <p key={index} className="text-sm">
                      <span className="font-medium">{token.symbol}</span> (
                      {token.address.slice(0, 6)}...{token.address.slice(-4)}):{" "}
                      {parseFloat(token.balance).toFixed(2)}
                    </p>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

