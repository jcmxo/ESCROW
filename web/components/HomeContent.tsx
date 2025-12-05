import { useState, useEffect } from "react";
import { EthereumProvider, useEthereum } from "@/lib/ethereum";
import ConnectButton from "@/components/ConnectButton";
import AddToken from "@/components/AddToken";
import CreateOperation from "@/components/CreateOperation";
import OperationsList from "@/components/OperationsList";
import BalanceDebug from "@/components/BalanceDebug";
import TransactionHistory from "@/components/TransactionHistory";

function HomeContentInner() {
  const { isConnected } = useEthereum();

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Escrow DApp</h1>
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isConnected ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">Welcome to Escrow DApp</h2>
            <p className="text-gray-600 mb-6">
              Connect your wallet to start using the escrow service
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-1 space-y-6">
              <AddToken />
              <CreateOperation />
            </div>

            {/* Middle Column */}
            <div className="lg:col-span-1">
              <OperationsList />
            </div>

            {/* Right Column */}
            <div className="lg:col-span-1 space-y-6">
              <BalanceDebug />
              <TransactionHistory />
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Escrow DApp - Secure Token Exchange Platform
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function HomeContent() {
  return (
    <EthereumProvider>
      <HomeContentInner />
    </EthereumProvider>
  );
}

