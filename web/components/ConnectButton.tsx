"use client";

import { useEthereum } from "@/lib/ethereum";
import { useState, useEffect } from "react";

export default function ConnectButton() {
  const { account, connect, disconnect, isConnected } = useEthereum();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (isConnected && account) {
    const shortenedAddress = `${account.slice(0, 6)}...${account.slice(-4)}`;
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono">{shortenedAddress}</span>
        <button
          onClick={disconnect}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
    >
      Connect Wallet
    </button>
  );
}

